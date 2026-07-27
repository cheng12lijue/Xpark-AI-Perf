import { useState, useMemo } from 'react'

interface RecipeMeta {
  file: string
  name: string
  description: string
  model: string
  nodes: number  // 1=solo, 2=dual, 3=3x, 4=4x, 12=12x
  tensorParallel: number
  gpuMemUtil: string
}

const RECIPES: RecipeMeta[] = [
  { file: 'qwen3.5-35b-a3b-fp8.yaml', name: 'Qwen3.5-35B-A3B', description: '通义千问 MoE FP8 高效推理', model: 'Qwen/Qwen3.5-35B-A3B-FP8', nodes: 1, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: 'qwen3.6-35b-a3b-fp8.yaml', name: 'Qwen3.6-35B-A3B', description: '通义千问 3.6 MoE FP8', model: 'Qwen/Qwen3.6-35B-A3B-FP8', nodes: 1, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: 'qwen3.6-35b-a3b-fp8-dflash.yaml', name: 'Qwen3.6-35B-A3B-D', description: '通义千问 3.6 MoE FP8 dFlash', model: 'Qwen/Qwen3.6-35B-A3B-FP8', nodes: 1, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: 'qwen3-coder-next-fp8.yaml', name: 'Qwen3-Coder-Next', description: '通义千问 Coder Next FP8', model: 'Qwen/Qwen3-Coder-Next-FP8', nodes: 1, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: 'qwen3-coder-next-int4-autoround.yaml', name: 'Qwen3-Coder-INT4', description: '通义千问 Coder Next INT4', model: 'Intel/Qwen3-Coder-Next-int4-AutoRound', nodes: 1, tensorParallel: 1, gpuMemUtil: '0.70' },
  { file: 'qwen3.5-122b-int4-autoround.yaml', name: 'Qwen3.5-122B-INT4', description: '通义千问 122B INT4 AutoRound', model: 'Intel/Qwen3.5-122B-A10B-int4-AutoRound', nodes: 1, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: 'gemma4-26b-a4b.yaml', name: 'Gemma4-26B-A4B', description: 'Google Gemma 4 MoE FP8', model: 'google/gemma-4-26B-A4B-it', nodes: 1, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: 'glm-4.7-flash-awq.yaml', name: 'GLM-4.7-Flash-AWQ', description: 'GLM-4.7 Flash AWQ 量化', model: 'cyankiwi/GLM-4.7-Flash-AWQ-4bit', nodes: 1, tensorParallel: 1, gpuMemUtil: '0.70' },
  { file: 'nemotron-3-nano-nvfp4.yaml', name: 'Nemotron-3-Nano', description: 'NVIDIA Nemotron 3 Nano NVFP4', model: 'nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-NVFP4', nodes: 1, tensorParallel: 1, gpuMemUtil: '0.70' },
  { file: 'nemotron-3-super-nvfp4.yaml', name: 'Nemotron-3-Super', description: 'NVIDIA Nemotron 3 Super 120B', model: 'nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-NVFP4', nodes: 1, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: 'openai-gpt-oss-120b.yaml', name: 'GPT-OSS-120B', description: 'OpenAI GPT-OSS 120B MXFP4', model: 'openai/gpt-oss-120b', nodes: 1, tensorParallel: 1, gpuMemUtil: '0.70' },
  { file: 'deepseek-v4-dspark.yaml', name: 'DeepSeek V4 (Spark)', description: 'DeepSeek V4 DGX Spark 部署', model: '', nodes: 1, tensorParallel: 1, gpuMemUtil: '0.85' },
  { file: 'step-3.7-flash-fp8.yaml', name: 'Step-3.7-Flash-FP8', description: 'Step 3.7 Flash FP8', model: 'stepfun-ai/Step-3.7-Flash-FP8', nodes: 2, tensorParallel: 2, gpuMemUtil: '0.85' },
  { file: 'step-3.7-flash-nvfp4.yaml', name: 'Step-3.7-Flash-NVFP4', description: 'Step 3.7 Flash NVFP4', model: 'stepfun-ai/Step-3.7-Flash-NVFP4', nodes: 2, tensorParallel: 2, gpuMemUtil: '0.80' },
  { file: 'minimax-m2-awq.yaml', name: 'MiniMax-M2-AWQ', description: 'MiniMax M2 AWQ 量化', model: 'QuantTrio/MiniMax-M2-AWQ', nodes: 2, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: 'minimax-m2.5-awq.yaml', name: 'MiniMax-M2.5-AWQ', description: 'MiniMax M2.5 AWQ 量化', model: 'cyankiwi/MiniMax-M2.5-AWQ-4bit', nodes: 2, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: 'minimax-m2.7-awq.yaml', name: 'MiniMax-M2.7-AWQ', description: 'MiniMax M2.7 AWQ 量化', model: 'cyankiwi/MiniMax-M2.7-AWQ-4bit', nodes: 2, tensorParallel: 2, gpuMemUtil: '0.80' },
  { file: 'qwen3.5-122b-fp8.yaml', name: 'Qwen3.5-122B-FP8', description: '通义千问 122B FP8 量化', model: 'Qwen/Qwen3.5-122B-A10B-FP8', nodes: 4, tensorParallel: 2, gpuMemUtil: '0.70' },
  { file: 'qwen3.5-397b-int4-autoround.yaml', name: 'Qwen3.5-397B-INT4', description: '通义千问 397B INT4 量化', model: 'Intel/Qwen3.5-397B-A17B-int4-AutoRound', nodes: 4, tensorParallel: 2, gpuMemUtil: '0.85' },
  { file: 'deepseek-v4-b12x.yaml', name: 'DeepSeek V4 B12X', description: 'DeepSeek V4 12 节点集群', model: '', nodes: 12, tensorParallel: 1, gpuMemUtil: '0.90' },
]

const NODE_LABELS: Record<number, string> = { 1: '单机', 2: '双机', 3: '3x', 4: '4x', 12: '12x' }

type FilterMode = 'all' | 'solo' | 'cluster' | 'dual' | 'triple' | 'quad'

export function ModelRegistryView() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterMode>('all')

  const filtered = useMemo(() => {
    return RECIPES.filter(r => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase()) &&
          !r.description.toLowerCase().includes(search.toLowerCase())) return false
      switch (filter) {
        case 'solo': return r.nodes === 1
        case 'cluster': return r.nodes >= 2
        case 'dual': return r.nodes === 2
        case 'triple': return r.nodes === 3 || r.nodes === 4
        case 'quad': return r.nodes >= 12
        default: return true
      }
    })
  }, [search, filter])

  const counts = useMemo(() => ({
    all: RECIPES.length,
    solo: RECIPES.filter(r => r.nodes === 1).length,
    cluster: RECIPES.filter(r => r.nodes >= 2).length,
    dual: RECIPES.filter(r => r.nodes === 2).length,
    triple: RECIPES.filter(r => r.nodes === 3 || r.nodes === 4).length,
    quad: RECIPES.filter(r => r.nodes >= 12).length,
  }), [])

  const nodeTag = (n: number) => {
    const label = NODE_LABELS[n] || `${n}x`
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
                    <div className="text-sm font-semibold text-zinc-100 truncate">{r.name}</div>
                    <div className="text-xs text-zinc-600 truncate mt-0.5">{r.description}</div>
                  </div>
                  {nodeTag(r.nodes)}
                </div>
                <div className="text-[11px] text-zinc-600 mb-2.5 font-mono truncate">{r.model || '(本地镜像)'}</div>
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
