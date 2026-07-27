import { useState, useMemo } from 'react'

interface RecipeMeta {
  file: string
  description: string
  model: string
  nodes: number
  tensorParallel: number
  gpuMemUtil: string
}

const RECIPES: RecipeMeta[] = [
  // ── 单机 (13) ──
  { file: '1x-xpark-solo/gemma4-26b-a4b.yaml', description: 'vLLM serving Gemma4-26B-A4B', model: 'google/gemma-4-26B-A4B-it', nodes: 1, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: '1x-xpark-solo/glm-4.7-flash-awq.yaml', description: 'vLLM serving GLM-4.7-Flash-AWQ-4bit', model: 'cyankiwi/GLM-4.7-Flash-AWQ-4bit', nodes: 1, tensorParallel: 1, gpuMemUtil: '0.70' },
  { file: '1x-xpark-solo/minimax-m2.7-awq.yaml', description: 'vLLM serving MiniMax-M2.7-AWQ with Ray backend', model: 'cyankiwi/MiniMax-M2.7-AWQ-4bit', nodes: 1, tensorParallel: 2, gpuMemUtil: '0.80' },
  { file: '1x-xpark-solo/minimax-m2-awq.yaml', description: 'vLLM serving MiniMax-M2-AWQ with Ray backend', model: 'QuantTrio/MiniMax-M2-AWQ', nodes: 1, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: '1x-xpark-solo/nemotron-3-nano-nvfp4.yaml', description: 'vLLM serving Nemotron-3-Nano-NVFP4 (single node)', model: 'nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-NVFP4', nodes: 1, tensorParallel: 1, gpuMemUtil: '0.70' },
  { file: '1x-xpark-solo/nemotron-3-super-nvfp4.yaml', description: 'vLLM serving Nemotron-3-Super-120B using CUTLASS kernels', model: 'nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-NVFP4', nodes: 1, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: '1x-xpark-solo/openai-gpt-oss-120b.yaml', description: 'vLLM serving openai/gpt-oss-120b with MXFP4 quantization', model: 'openai/gpt-oss-120b', nodes: 1, tensorParallel: 1, gpuMemUtil: '0.70' },
  { file: '1x-xpark-solo/qwen3.5-122b-int4-autoround.yaml', description: 'vLLM serving Qwen3.5-122B-INT4-Autoround', model: 'Intel/Qwen3.5-122B-A10B-int4-AutoRound', nodes: 1, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: '1x-xpark-solo/qwen3.5-35b-a3b-fp8.yaml', description: 'vLLM serving Qwen3.5-35B-A3B-FP8', model: 'Qwen/Qwen3.5-35B-A3B-FP8', nodes: 1, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: '1x-xpark-solo/qwen3.6-35b-a3b-fp8-dflash.yaml', description: 'vLLM serving Qwen3.6-35B-A3B-FP8 (dFlash)', model: 'Qwen/Qwen3.6-35B-A3B-FP8', nodes: 1, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: '1x-xpark-solo/qwen3.6-35b-a3b-fp8.yaml', description: 'vLLM serving Qwen3.6-35B-A3B-FP8', model: 'Qwen/Qwen3.6-35B-A3B-FP8', nodes: 1, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: '1x-xpark-solo/qwen3-coder-next-fp8.yaml', description: 'vLLM serving Qwen3-Coder-Next-FP8', model: 'Qwen/Qwen3-Coder-Next-FP8', nodes: 1, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: '1x-xpark-solo/qwen3-coder-next-int4-autoround.yaml', description: 'Qwen3-Coder-Next-int4-Autoround', model: 'Intel/Qwen3-Coder-Next-int4-AutoRound', nodes: 1, tensorParallel: 1, gpuMemUtil: '0.70' },

  // ── 2x (7) ──
  { file: '2x-spark-cluster/deepseek-v4-b12x.yaml', description: 'DeepSeek V4 Flash FP8 on dual DGX Spark', model: 'deepseek-ai/DeepSeek-V4-Flash', nodes: 2, tensorParallel: 2, gpuMemUtil: '0.85' },
  { file: '2x-spark-cluster/deepseek-v4-dspark.yaml', description: 'DeepSeek V4 Flash DSpark on dual DGX Spark', model: '', nodes: 2, tensorParallel: 2, gpuMemUtil: '0.82' },
  { file: '2x-spark-cluster/minimax-m2.5-awq.yaml', description: 'MiniMax-M2.5-AWQ on 2x DGX Spark cluster', model: 'cyankiwi/MiniMax-M2.5-AWQ-4bit', nodes: 2, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: '2x-spark-cluster/qwen3.5-122b-fp8.yaml', description: 'Qwen3.5-122B-FP8 on 2x DGX Spark cluster', model: 'Qwen/Qwen3.5-122B-A10B-FP8', nodes: 2, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: '2x-spark-cluster/qwen3.5-397b-int4-autoround.yaml', description: 'Qwen3.5-397B-INT4 on 2x DGX Spark cluster', model: 'Intel/Qwen3.5-397B-A17B-int4-AutoRound', nodes: 2, tensorParallel: 2, gpuMemUtil: '0.85' },
  { file: '2x-spark-cluster/step-3.7-flash-fp8.yaml', description: 'Step-3.7-Flash-FP8 on two Sparks', model: 'stepfun-ai/Step-3.7-Flash-FP8', nodes: 2, tensorParallel: 2, gpuMemUtil: '0.85' },
  { file: '2x-spark-cluster/step-3.7-flash-nvfp4.yaml', description: 'Step-3.7-Flash-NVFP4 on two Sparks', model: 'stepfun-ai/Step-3.7-Flash-NVFP4', nodes: 2, tensorParallel: 2, gpuMemUtil: '0.80' },

  // ── 3x (1) ──
  { file: '3x-spark-cluster/qwen3.5-397b-int4-autoround.yaml', description: 'Qwen3.5-397B-INT4 PP=3 on 3-node mesh', model: 'Intel/Qwen3.5-397B-A17B-int4-AutoRound', nodes: 3, tensorParallel: 2, gpuMemUtil: '0.70' },

  // ── 4x (3) ──
  { file: '4x-spark-cluster/minimax-m2.5.yaml', description: 'MiniMax-M2.5 on 4x DGX Spark cluster', model: 'MiniMaxAI/MiniMax-M2.5', nodes: 4, tensorParallel: 4, gpuMemUtil: '0.90' },
  { file: '4x-spark-cluster/qwen3.5-397b-a17B-fp8.yaml', description: 'Qwen3.5-397B-A17B-FP8 on 4x DGX Spark', model: 'Qwen/Qwen3.5-397B-A17B-FP8', nodes: 4, tensorParallel: 4, gpuMemUtil: '0.85' },
  { file: '4x-spark-cluster/qwen3.5-397b-int4-autoround.yaml', description: 'Qwen3.5-397B-INT4 TP=4 on 4x DGX Spark', model: 'Intel/Qwen3.5-397B-A17B-int4-AutoRound', nodes: 4, tensorParallel: 4, gpuMemUtil: '0.78' },
]

const NODE_LABELS: Record<number, string> = { 1: '单机', 2: '双机', 3: '三机', 4: '四机' }

type FilterMode = 'all' | 'solo' | 'cluster' | 'dual' | 'triple' | 'quad'

export function ModelRegistryView() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterMode>('all')

  const filtered = useMemo(() => {
    return RECIPES.filter(r => {
      if (search && !r.file.toLowerCase().includes(search.toLowerCase()) &&
          !r.description.toLowerCase().includes(search.toLowerCase())) return false
      switch (filter) {
        case 'solo': return r.nodes === 1
        case 'cluster': return r.nodes >= 2
        case 'dual': return r.nodes === 2
        case 'triple': return r.nodes === 3
        case 'quad': return r.nodes === 4
        default: return true
      }
    })
  }, [search, filter])

  const counts = useMemo(() => ({
    all: RECIPES.length,
    solo: RECIPES.filter(r => r.nodes === 1).length,
    cluster: RECIPES.filter(r => r.nodes >= 2).length,
    dual: RECIPES.filter(r => r.nodes === 2).length,
    triple: RECIPES.filter(r => r.nodes === 3).length,
    quad: RECIPES.filter(r => r.nodes === 4).length,
  }), [])

  const nodeTag = (n: number) => {
    const label = NODE_LABELS[n]
    if (n === 1) return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#76B900]/10 text-[#76B900]">{label}</span>
    return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{label}</span>
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">模型广场</h2>
          <p className="text-xs text-zinc-600 mt-0.5">浏览可用模型配方，一键部署推理服务</p>
        </div>
        <input
          className="bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5 text-xs text-zinc-300 outline-none w-44 placeholder:text-zinc-600 focus:border-[#76B900] transition-colors"
          placeholder="搜索模型名称..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-0 mb-3 border-b border-white/[0.06] shrink-0">
        {([
          { key: 'all' as FilterMode, label: '全部' },
          { key: 'solo' as FilterMode, label: '单机' },
          { key: 'cluster' as FilterMode, label: '集群' },
          { key: 'dual' as FilterMode, label: '双机' },
          { key: 'triple' as FilterMode, label: '三机' },
          { key: 'quad' as FilterMode, label: '四机' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 text-xs border-b-2 transition-colors ${
              filter === key
                ? 'text-[#76B900] border-[#76B900]'
                : 'text-zinc-600 border-transparent hover:text-zinc-400'
            }`}
          >
            {label}
            <span className="ml-1 text-zinc-700">{counts[key]}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">没有匹配的模型配方</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {filtered.map(r => (
              <div key={r.file} className="bg-[#0c0c10] border border-white/[0.06] rounded-lg p-3.5 hover:border-white/[0.12] transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-zinc-100 truncate">{r.file.replace(/^.*\//, '').replace('.yaml', '')}</div>
                    <div className="text-xs text-zinc-600 truncate mt-0.5">{r.description}</div>
                  </div>
                  {nodeTag(r.nodes)}
                </div>
                <div className="text-[11px] text-zinc-600 mb-2.5 font-mono">{r.model}</div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500 pb-2.5 mb-2 border-b border-white/[0.04]">
                  <span>TP {r.tensorParallel}</span>
                  <span>显存 {r.gpuMemUtil}</span>
                </div>
                <div className="flex gap-1.5">
                  <button className="flex-1 text-xs font-medium py-1.5 rounded-md bg-[#76B900] text-[#08080a] hover:bg-[#8cd41a] transition-colors">查看详情</button>
                  <button className="flex-1 text-xs font-medium py-1.5 rounded-md bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] transition-colors">一键部署</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
