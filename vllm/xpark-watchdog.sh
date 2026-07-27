#!/bin/bash
# xpark-watchdog.sh — 常驻检测 + 自愈
# 用法: nohup bash xpark-watchdog.sh >> watchdog.log 2>&1 &

set -euo pipefail

SCRIPT_DIR="$(dirname "$(realpath "$0")")"
INTERVAL="${WATCHDOG_INTERVAL:-60}"
RECOVERY_COOLDOWN=300  # 恢复后至少等 5 分钟再检测，避免重试风暴

# ============================================================
# 1. 初始化：加载 .env
# ============================================================
ENV_FILE="${SCRIPT_DIR}/.env"
if [[ ! -f "${ENV_FILE}" ]]; then
    echo "[$(date)] FATAL: .env not found at ${ENV_FILE}" >&2
    exit 1
fi
source <(grep -E '^(CLUSTER_NODES|LOCAL_IP|CONTAINER_NAME|ETH_IF|IB_IF)=' "${ENV_FILE}")
CONTAINER="${CONTAINER_NAME:-sparkrun-vllm-ds4-gb10}"
DIR="/tmp/${CONTAINER}"
PROJECT="xpark-${CONTAINER}"

if [[ -z "${CLUSTER_NODES:-}" || -z "${LOCAL_IP:-}" ]]; then
    echo "[$(date)] FATAL: CLUSTER_NODES or LOCAL_IP missing in .env" >&2
    exit 1
fi

IFS=',' read -ra ALL <<< "${CLUSTER_NODES}"
IS_SOLO=false
if [[ ${#ALL[@]} -eq 1 ]]; then
    IS_SOLO=true
else
    WORKER=""
    for ip in "${ALL[@]}"; do
        [[ "${ip}" != "${LOCAL_IP}" ]] && WORKER="${ip}" && break
    done
    if [[ -z "${WORKER}" ]]; then
        echo "[$(date)] FATAL: no worker IP found" >&2
        exit 1
    fi
fi

if [[ "$IS_SOLO" == "true" ]]; then
    echo "[$(date)] Watchdog started (solo): interval=${INTERVAL}s, container=${CONTAINER}"
else
    echo "[$(date)] Watchdog started: interval=${INTERVAL}s, container=${CONTAINER}, head=${LOCAL_IP}, worker=${WORKER}"
fi

# ============================================================
# 2. 主循环
# ============================================================
while true; do
    echo "[$(date)] INFO: Executing health check round"

    if [[ "$IS_SOLO" == "true" ]]; then
        # ---- 单机模式 ----
        MY=$(docker inspect -f '{{.State.Health.Status}}' "${CONTAINER}" 2>/dev/null)
        if [ "${MY}" = "healthy" ]; then
            echo "[$(date)] INFO: local=${MY}, healthy, sleep ${INTERVAL}s"
            sleep "${INTERVAL}"
            continue
        fi
        echo "[$(date)] Unhealthy: local=${MY}, recovering..."
        docker compose -f "${DIR}/compose.yml" -p "${PROJECT}" down 2>/dev/null || true
        docker compose -f "${DIR}/compose.yml" -p "${PROJECT}" up -d
        echo "[$(date)] Recovery complete, enter cooldown ${RECOVERY_COOLDOWN}s"
        sleep "${RECOVERY_COOLDOWN}"
    else
        # ---- 多机模式 ----
        MY=$(docker inspect -f '{{.State.Health.Status}}' "${CONTAINER}" 2>/dev/null)
        WK=$(ssh -o BatchMode=yes -o ConnectTimeout=5 "${WORKER}" \
              "docker inspect -f '{{.State.Health.Status}}' ${CONTAINER}" 2>/dev/null)

        if [ "${MY}" = "healthy" ] && [ "${WK}" = "healthy" ]; then
            echo "[$(date)] INFO: head=$MY worker=$WK , all healthy, sleep ${INTERVAL}s"
            sleep "${INTERVAL}"
            continue
        fi

        echo "[$(date)] Unhealthy: head=${MY} worker=${WK}, recovering..."

        ssh "${WORKER}" "docker compose -f ${DIR}/compose.yml -p ${PROJECT} down" 2>/dev/null || true
        docker compose -f "${DIR}/compose.yml" -p "${PROJECT}" down 2>/dev/null || true
        sleep 5

        if ssh "${WORKER}" "docker compose -f ${DIR}/compose.yml -p ${PROJECT} up -d" 2>/dev/null; then
            echo "[$(date)] Worker up, waiting 30s..."
            sleep 30
            docker compose -f "${DIR}/compose.yml" -p "${PROJECT}" up -d
            echo "[$(date)] Recovery complete, enter cooldown ${RECOVERY_COOLDOWN}s"
            sleep "${RECOVERY_COOLDOWN}"
        else
            echo "[$(date)] CRITICAL: Worker unreachable, retry in ${INTERVAL}s"
            sleep "${INTERVAL}"
        fi
    fi
done
