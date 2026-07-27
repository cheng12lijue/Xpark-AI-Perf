#!/bin/bash

# ==============================================================================
# 默认参数配置 (Default Configuration)，通过输入参数传递时，会覆盖这些默认值
# ==============================================================================
MODEL_PATH=/root/DeepSeek-V4-Flash/
SERVER_NAME=DeepSeek-V4-Flash
HOST=0.0.0.0
PORT=8000
TAG="src"
# OUTPUT_PATH 将在参数解析后动态生成，如果用户没有通过 -o 指定的话
OUTPUT_PATH=""


random_range_ratio=0
random_range_ratio_percent=0

# ==============================================================================
# 定义测试参数数组 (Test Parameters Array)
# 格式: "request_rate max_concurrency num_prompts input_len output_len prefix_ratio"
# ==============================================================================
params=(

"inf 1 1 128 128"
# 对话(1K/1K) - 短对话
"inf 1 5 1024 1024"
"inf 4 5 1024 1024"
"inf 5 5 1024 1024"
"inf 6 5 1024 1024"
"inf 7 5 1024 1024"
"inf 8 5 1024 1024"

# 对话(2K/2K) - 中短对话
"inf 1 5 2048 2048"
"inf 4 5 2048 2048"
"inf 5 5 2048 2048"
"inf 6 5 2048 2048"
"inf 7 5 2048 2048"
"inf 8 5 2048 2048"

# RAG（3.5K/1.5K） - 中等输入，检索增强
"inf 1 5 3500 1500"
"inf 4 5 3500 1500"
"inf 5 5 3500 1500"
"inf 6 5 3500 1500"
"inf 7 5 3500 1500"
"inf 8 5 3500 1500"

# 通用复杂任务(4K/4K) - 中等长上下文
"inf 1 5 4096 4096"
"inf 4 5 4096 4096"
"inf 5 5 4096 4096"
"inf 6 5 4096 4096"
"inf 7 5 4096 4096"
"inf 8 5 4096 4096"

# 通用复杂任务(8K/8K) - 较长上下文
"inf 1 3 8192 8192"
"inf 4 3 8192 8192"
"inf 5 3 8192 8192"
"inf 6 3 8192 8192"
"inf 7 3 8192 8192"
"inf 8 3 8192 8192"

# 通用复杂任务(8K/1K) - 较长输入
"inf 1 3 8192 1024"
"inf 4 3 8192 1024"
"inf 5 3 8192 1024"
"inf 6 3 8192 1024"
"inf 7 3 8192 1024"
"inf 8 3 8192 1024"

# 合同分析(16K/4K) - 长输入，中等输出
"inf 1 3 16384 4096"
"inf 2 3 16384 4096"
"inf 3 3 16384 4096"
"inf 4 3 16384 4096"

# 文档写作（16K/8K） - 长输入 + 长输出
"inf 1 3 16384 8192"
"inf 2 3 16384 8192"
"inf 3 3 16384 8192"
"inf 4 3 16384 8192"

# Openclaw+90%重复（32K/0.5K）- 长输入，90%前缀复用
"inf 1 3 32768 512"
"inf 2 3 32768 512"
"inf 3 3 32768 512"
"inf 4 3 32768 512"

# AI Coding(32K/32K) - 长输入 + 长输出
"inf 1 3 32768 32768"
"inf 2 3 32768 32768"
"inf 3 3 32768 32768"
"inf 4 3 32768 32768"

)

# ==============================================================================
# 命令行参数解析 (Parse Command Line Arguments)
# ==============================================================================
show_help() {
    cat << EOF
用法: $0 [选项]

此脚本用于封装 vllm bench serve 命令，进行大模型推理性能的批量压测。

选项:
  -h, --help          显示此帮助信息并退出
  -m, --model-path    指定模型权重的本地路径或 HuggingFace 模型名称 (默认: $MODEL_PATH)
                      例如: /data/models/Qwen3-8B
  -s, --server-name   指定 vLLM 服务的 served-model-name (默认: $SERVER_NAME)
                      需要与启动 vLLM 服务时指定的 --served-model-name 保持一致。
  -H, --host          指定 vLLM 服务的主机地址 (默认: $HOST)
  -p, --port          指定 vLLM 服务的端口号 (默认: $PORT)
  -o, --output        指定测试结果（JSON、日志与CSV汇总）的保存目录路径 
                      (默认: ./results/<server_name>_<tag>_<timestamp>)
  -t, --tag           指定测试标签，用于标识本次测试任务的特殊标记 (默认: $TAG)
                      (注意: 该参数非必填，仅在未指定 -o 参数时用于生成默认的输出目录名)

脚本内部测试参数通过 'params' 数组定义，格式为:
  "request_rate max_concurrency num_prompts input_len output_len [prefix_ratio]"

示例:
  $0 -m /data/models/Qwen -s Qwen-7B -p 8000 -t test_run
EOF
}

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -h|--help) show_help; exit 0 ;;
        -m|--model-path) MODEL_PATH="$2"; shift 2 ;;
        -s|--server-name) SERVER_NAME="$2"; shift 2 ;;
        -H|--host) HOST="$2"; shift 2 ;;
        -p|--port) PORT="$2"; shift 2 ;;
        -o|--output) OUTPUT_PATH="$2"; shift 2 ;;
        -t|--tag) TAG="$2"; shift 2 ;;
        -*) echo "Unknown parameter passed: $1"
            show_help
            exit 1 ;;
        *) shift ;;  # 跳过位置参数
    esac
done

# 如果未指定 OUTPUT_PATH，则使用默认的目录结构
if [ -z "$OUTPUT_PATH" ]; then
    OUTPUT_PATH="./results/${SERVER_NAME}_${TAG}_$(date +%Y%m%d_%H%M%S)"
fi

# ==============================================================================
# Helper Functions and Core Logic
# ==============================================================================
# 定义一个函数来安全地提取值
extract_value() {
    local result="$1"
    local pattern="$2"
    local value=$(echo "$result" | grep "$pattern" | awk '{print $NF}')
    if [ -z "$value" ]; then
        echo "Error: Value for pattern '$pattern' not found." >&2
        return
    fi
    echo "$value"
}

run_benchmark() {
    local request_rate=$1
    local max_concurrency=$2
    local num_prompts=$3
    local total_input_len=$4
    local output_len=$5
    local prefix_ratio=$6

    local prefix_len=$(awk "BEGIN {print int($total_input_len * $prefix_ratio)}")
    local random_input_len=$((total_input_len - prefix_len))

    # 计算 input 范围
    local input_start=$((prefix_len + random_input_len - random_input_len * random_range_ratio_percent / 100))
    local input_end=$((prefix_len + random_input_len + random_input_len * random_range_ratio_percent / 100))

    # 计算 output 范围
    local output_start=$((output_len - output_len * random_range_ratio_percent / 100))
    local output_end=$((output_len + output_len * random_range_ratio_percent / 100))

    local ready_timeout=0
    if (( $(awk "BEGIN {print ($prefix_ratio > 0) ? 1 : 0}") )); then
        ready_timeout=600
    fi

    local dataset_name="random"
    echo "测试参数：req_rate: $request_rate, max_concurrency: $max_concurrency, num_prompts: $num_prompts, total_input: $total_input_len (prefix: $prefix_len, random: $random_input_len), output: $output_start-$output_end, prefix_ratio: $prefix_ratio"

    result_json="prompts-$num_prompts-in-$total_input_len-out-$output_len-concur-$max_concurrency-prefix-$prefix_len-$(date +%Y%m%d_%H%M%S).json"
    result_log="$OUTPUT_PATH/prompts-$num_prompts-in-$total_input_len-out-$output_len-concur-$max_concurrency-prefix-$prefix_len-$(date +%Y%m%d_%H%M%S).log"

    local benchmark_result=$(
            vllm bench serve \
            --backend vllm \
            --model $SERVER_NAME \
            --tokenizer $MODEL_PATH \
            --dataset-name $dataset_name \
            --random-input-len $random_input_len \
            --random-output-len $output_len \
            --random-prefix-len $prefix_len \
            --random-range-ratio $random_range_ratio \
            --request-rate $request_rate \
            --num-prompts $num_prompts \
            --base-url http://${HOST}:${PORT} \
            --endpoint /v1/completions \
            --save-result \
            --result-dir "$OUTPUT_PATH" \
            --result-filename ${result_json} \
            --max-concurrency "$max_concurrency" \
            --trust-remote-code \
            --seed $(date +%s) \
            --burstiness 100 \
            --ignore-eos \
            --ready-check-timeout-sec $ready_timeout \
            --percentile-metrics ttft,tpot,itl,e2el \
            --metric-percentiles "90,95,99" \
    )

    echo "$benchmark_result"  | tee ${result_log}

    # 提取所需的值
    local duration=$(extract_value "$benchmark_result" "Benchmark duration (s):")
    local failed_requests=$(extract_value "$benchmark_result" "Failed requests:")
    local request_throughput=$(extract_value "$benchmark_result" "Request throughput (req/s):")
    local output_token_throughput=$(extract_value "$benchmark_result" "Output token throughput (tok/s):")
    local total_token_throughput=$(extract_value "$benchmark_result" "Total token throughput (tok/s):")
    local mean_ttft=$(extract_value "$benchmark_result" "Mean TTFT (ms):")
    local p90_ttft=$(extract_value "$benchmark_result" "P90 TTFT (ms):")
    local p95_ttft=$(extract_value "$benchmark_result" "P95 TTFT (ms):")
    local p99_ttft=$(extract_value "$benchmark_result" "P99 TTFT (ms):")
    local mean_tpot=$(extract_value "$benchmark_result" "Mean TPOT (ms):")
    local p90_tpot=$(extract_value "$benchmark_result" "P90 TPOT (ms):")
    local p95_tpot=$(extract_value "$benchmark_result" "P95 TPOT (ms):")
    local p99_tpot=$(extract_value "$benchmark_result" "P99 TPOT (ms):")
    local mean_itl=$(extract_value "$benchmark_result" "Mean ITL (ms):")
    local p90_itl=$(extract_value "$benchmark_result" "P90 ITL (ms):")
    local p95_itl=$(extract_value "$benchmark_result" "P95 ITL (ms):")
    local p99_itl=$(extract_value "$benchmark_result" "P99 ITL (ms):")
    local mean_e2el=$(extract_value "$benchmark_result" "Mean E2EL (ms):")
    local p90_e2el=$(extract_value "$benchmark_result" "P90 E2EL (ms):")
    local p95_e2el=$(extract_value "$benchmark_result" "P95 E2EL (ms):")
    local p99_e2el=$(extract_value "$benchmark_result" "P99 E2EL (ms):")

    # 组合成所需的字符串，使用逗号作为分隔符
    local result=$(printf "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s" "$request_rate" "$max_concurrency" "$num_prompts" "$total_input_len" "$prefix_ratio" "$output_start" "$duration" "$failed_requests" "$request_throughput" "$output_token_throughput" "$total_token_throughput" "$mean_ttft" "$p90_ttft" "$p95_ttft" "$p99_ttft" "$mean_tpot" "$p90_tpot" "$p95_tpot" "$p99_tpot" "$mean_itl" "$p90_itl" "$p95_itl" "$p99_itl" "$mean_e2el" "$p90_e2el" "$p95_e2el" "$p99_e2el")
    echo "$result" >> $OUTPUT_PATH/$tag-summary.csv

    sleep 1
}

main() {
    cd "$(dirname "$0")"
    export VLLM_HOST_IP=$(hostname -I | awk '{print $1}')

    # 设置全局输出相关变量
    mkdir -p "$OUTPUT_PATH"
    tag="$SERVER_NAME"-"$(date +%Y%m%d-%H%M%S)"
    echo "request_rate","max_concurrency","num_prompts","total_input_len","prefix_ratio","output_start","duration","failed_requests","request_throughput","output_token_throughput","total_token_throughput","mean_ttft","p90_ttft","p95_ttft","p99_ttft","mean_tpot","p90_tpot","p95_tpot","p99_tpot","mean_itl","p90_itl","p95_itl","p99_itl","mean_e2el","p90_e2el","p95_e2el","p99_e2el" > $OUTPUT_PATH/$tag-summary.csv

    # 循环读取 params 数组并进行测试
    for param_str in "${params[@]}"; do
        # 将字符串按空格拆分为对应参数
        read -r req_rate max_conc num_p in_len out_len prefix_ratio <<< "$param_str"
        prefix_ratio=${prefix_ratio:-0}

        run_benchmark "$req_rate" "$max_conc" "$num_p" "$in_len" "$out_len" "$prefix_ratio"
    done
}

main "$@"
