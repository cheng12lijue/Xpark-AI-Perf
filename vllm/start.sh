# bash ./discover-sparks && VLLM_SPARK_EXTRA_DOCKER_ARGS="-v /home/admin/model/DeepSeek-V4-Flash-DSpark:/root/DeepSeek-V4-Flash" ./run-recipe.py deepseek-v4-dspark.yaml -n 169.254.9.203,169.254.128.101  --no-ray


# nohup bash -c "bash ./discover-sparks && VLLM_SPARK_EXTRA_DOCKER_ARGS=\"-v /home/admin/model/DeepSeek-V4-Flash-DSpark:/root/DeepSeek-V4-Flash\" ./run-recipe.py deepseek-v4-dspark.yaml -n 169.254.9.203,169.254.128.101 --no-ray" > cluster.log 2>&1 &


#!/bin/bash
set -euo pipefail

# ============================================================
# 1. 环境变量
# ============================================================
export VLLM_SPARK_EXTRA_DOCKER_ARGS="-v /home/admin/model/DeepSeek-V4-Flash-DSpark:/root/DeepSeek-V4-Flash"

# ============================================================
# 2. 首次使用：SSH 互信 + 生成 .env（只跑一次，之后注释掉）
# ============================================================
#
# 2a. SSH 互信（avahi 发现节点 + 分发密钥）
bash ./discover-sparks
#
# 2b. 自动检测网卡 + 生成 .env (秒出结果)
#     ETH_IF、IB_IF 自动写入，CLUSTER_NODES、LOCAL_IP 需手动改为 169.254.x.x
bash ./discover-env.sh
#
# 2c. 或者手动创建 .env：
# cat > .env << 'DOTENV'
# CLUSTER_NODES=169.254.9.203,169.254.128.101
# ETH_IF=enp1s0f0np0
# IB_IF=rocep1s0f0,roceP2p1s0f0
# LOCAL_IP=169.254.9.203
# DOTENV

# ============================================================
# 3. 启动（.env 存在后不再需要 -n 参数）
# ============================================================

# 前台启动（日志直接输出到终端，Ctrl+C 停止）
# python3 run-recipe.py deepseek-v4-dspark.yaml --no-ray

# 后台启动（日志写入 nohup.out）
nohup python3 run-recipe.py deepseek-v4-dspark.yaml --no-ray > cluster.log 2>&1 &


# ============================================================
# 旧方式（手动 -n 指定节点，不走 .env）
# ============================================================
# python3 run-recipe.py deepseek-v4-dspark.yaml -n 169.254.9.203,169.254.128.101 --no-ray




nohup bash ./xpark-watchdog.sh > watchdog.log 2>&1 &
