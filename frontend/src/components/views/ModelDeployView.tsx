import { useState } from 'react'

interface DeployedInstance {
  id: string
  name: string
  model: string
  port: number
  container: string
  status: 'healthy' | 'warming' | 'error'
  uptime: string
  throughput: number
  memoryGb: number
  batchSize: number
  p99TtftMs: number
}

interface LogEntry {
  time: string
  type: 'ok' | 'info' | 'warn' | 'error'
  message: string
}

const INSTANCES: DeployedInstance[] = [
  { id: '1', name: 'Qwen3.5-35B-A3B', model: 'Qwen/Qwen3.5-35B-A3B-FP8', port: 8000, container: 'vllm_qwen35', status: 'healthy', uptime: '2h 13m', throughput: 142, memoryGb: 10.2, batchSize: 8, p99TtftMs: 320 },
  { id: '2', name: 'MiniMax-M2.7-AWQ', model: 'cyankiwi/MiniMax-M2.7-AWQ-4bit', port: 8001, container: 'vllm_minimax', status: 'healthy', uptime: '45m', throughput: 856, memoryGb: 4.8, batchSize: 16, p99TtftMs: 180 },
]

const LOGS: LogEntry[] = [
  { time: '14:32:01', type: 'ok', message: 'Qwen3.5-35B-A3B-FP8 部署完成 (端口 8000)' },
  { time: '14:30:45', type: 'ok', message: 'MiniMax M2.7 AWQ 部署完成 (端口 8001)' },
  { time: '14:28:12', type: 'info', message: '正在下载 MiniMax M2.7 AWQ 权重...' },
  { time: '14:25:30', type: 'info', message: '构建容器镜像 vllm-node...' },
  { time: '14:22:18', type: 'warn', message: 'Gemma 4 部署失败：HF_TOKEN 未配置' },
  { time: '14:20:05', type: 'error', message: 'DeepSeek V4 部署失败：需要 4 节点集群' },
]

const STATUS_STYLE = {
  healthy: { dot: 'bg-emerald-400 shadow-[0_0_4px_#22c55e66]', label: '健康', text: 'text-emerald-400' },
  warming: { dot: 'bg-amber-400 shadow-[0_0_4px_#eab30866]', label: '预热', text: 'text-amber-400' },
  error: { dot: 'bg-red-400', label: '异常', text: 'text-red-400' },
}

const LOG_STYLE = { ok: 'text-emerald-400', info: 'text-blue-400', warn: 'text-amber-400', error: 'text-red-400' }
const LOG_PREFIX = { ok: '✅', info: 'ℹ️', warn: '⚠️', error: '✗' }

export function ModelDeployView() {
  const [instances] = useState(INSTANCES)
  const [logs] = useState(LOGS)
  const totalMem = instances.reduce((s, i) => s + i.memoryGb, 0)

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">模型部署</h2>
          <p className="text-xs text-zinc-600 mt-0.5">管理运行中的推理实例，监控资源占用</p>
        </div>
        <button className="text-xs font-medium py-1.5 px-3 rounded-md bg-[#76B900] text-[#08080a] hover:bg-[#8cd41a] transition-colors">+ 新建部署</button>
      </div>

      {/* Running instances */}
      <h3 className="text-xs font-semibold text-zinc-300 mb-2 shrink-0">
        运行中 <span className="text-zinc-600 font-normal">— {instances.length} 实例 · {totalMem.toFixed(1)} GB 显存</span>
      </h3>

      <div className="space-y-2 shrink-0">
        {instances.map(inst => {
          const st = STATUS_STYLE[inst.status]
          return (
            <div key={inst.id} className="bg-[#0c0c10] border border-white/[0.06] rounded-lg p-3.5 border-l-[3px] border-l-[#76B900]">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-100">{inst.name}</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#76B900]/10 text-[#76B900]">单机</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] ${st.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}/>{st.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-600 mt-0.5">
                    端口 {inst.port} · 容器 {inst.container} · 已运行 {inst.uptime}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button className="text-[11px] font-medium py-1 px-2.5 rounded-md bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1] transition-colors">日志</button>
                  <button className="text-[11px] font-medium py-1 px-2.5 rounded-md bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1] transition-colors">重启</button>
                  <button className="text-[11px] font-medium py-1 px-2.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">停止</button>
                </div>
              </div>
              <div className="flex gap-5 mt-2.5 pt-2.5 border-t border-white/[0.04]">
                <div><span className="text-[10px] text-zinc-600">吞吐</span><br/><span className="text-sm font-semibold text-[#76B900]">{inst.throughput}</span><span className="text-[11px] text-zinc-600 ml-0.5">tok/s</span></div>
                <div><span className="text-[10px] text-zinc-600">显存</span><br/><span className="text-sm font-semibold text-zinc-100">{inst.memoryGb}</span><span className="text-[11px] text-zinc-600 ml-0.5">GB</span></div>
                <div><span className="text-[10px] text-zinc-600">批处理</span><br/><span className="text-sm font-semibold text-zinc-100">{inst.batchSize}</span></div>
                <div><span className="text-[10px] text-zinc-600">P99 TTFT</span><br/><span className="text-sm font-semibold text-zinc-100">{inst.p99TtftMs}</span><span className="text-[11px] text-zinc-600 ml-0.5">ms</span></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Deploy log */}
      <h3 className="text-xs font-semibold text-zinc-300 mt-3 mb-2 shrink-0">部署日志</h3>
      <div className="bg-[#050508] border border-white/[0.06] rounded-lg p-3 font-mono text-[11px] leading-relaxed overflow-y-auto flex-1 min-h-[120px]">
        {logs.map((l, i) => (
          <div key={i} className={LOG_STYLE[l.type]}>
            <span className="text-zinc-700">[{l.time}]</span> {LOG_PREFIX[l.type]} {l.message}
          </div>
        ))}
      </div>
    </div>
  )
}
