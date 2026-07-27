import { useState, useCallback } from 'react'

interface SecretKey {
  id: string
  name: string
  type: 'huggingface' | 'api-key' | 'oauth'
  maskedValue: string
  fullValue: string
  status: 'valid' | 'expiring' | 'expired'
  distributedTo: string
  createdAt: string
}

const INITIAL_KEYS: SecretKey[] = [
  { id: '2', name: 'OpenAI API Key', type: 'api-key', maskedValue: 'sk-******X7k9', fullValue: 'sk-7a9f3b2c1d8e4f5a0b3c7d2e1f9a8b4c', status: 'valid', distributedTo: 'Head 节点', createdAt: '2026-07-10' },
]

const TYPE_LABELS: Record<string, string> = { huggingface: 'HuggingFace', 'api-key': 'API Key', oauth: 'OAuth' }
const TYPE_COLORS: Record<string, string> = { huggingface: 'text-amber-400', 'api-key': 'text-blue-400', oauth: 'text-purple-400' }

export function KeyManagementView() {
  const [keys] = useState(INITIAL_KEYS)
  const [visibleId, setVisibleId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const toggleVisible = useCallback((id: string) => {
    setVisibleId(prev => prev === id ? null : id)
  }, [])

  const copyKey = useCallback(async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      // fallback for insecure contexts
      const ta = document.createElement('textarea')
      ta.value = value
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    }
  }, [])

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">密钥管理</h2>
          <p className="text-xs text-zinc-600 mt-0.5">管理模型仓库访问凭证，安全分发到各节点</p>
        </div>
        <button className="text-xs font-medium py-1.5 px-3 rounded-md bg-[#76B900] text-[#08080a] hover:bg-[#8cd41a] transition-colors">+ 新增密钥</button>
      </div>

      <div className="bg-[#0c0c10] border border-white/[0.06] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[11px] text-zinc-600 uppercase tracking-wider border-b border-white/[0.06]">
              <th className="text-left font-medium px-3 py-2">名称</th>
              <th className="text-left font-medium px-3 py-2">类型</th>
              <th className="text-left font-medium px-3 py-2">密钥</th>
              <th className="text-left font-medium px-3 py-2">状态</th>
              <th className="text-left font-medium px-3 py-2">分发</th>
              <th className="text-right font-medium px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => {
              const isVisible = visibleId === k.id
              const isCopied = copiedId === k.id
              const displayValue = isVisible ? k.fullValue : k.maskedValue
              return (
                <tr key={k.id} className="text-xs border-b border-white/[0.04] last:border-b-0">
                  <td className="px-3 py-2.5 font-medium text-zinc-200">{k.name}</td>
                  <td className={`px-3 py-2.5 ${TYPE_COLORS[k.type]}`}>{TYPE_LABELS[k.type]}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <code className="bg-white/[0.04] px-1.5 py-0.5 rounded text-[11px] text-zinc-400 font-mono">
                        {displayValue}
                      </code>
                      <button
                        onClick={() => toggleVisible(k.id)}
                        className="text-zinc-600 hover:text-zinc-300 transition-colors p-0.5"
                        title={isVisible ? '隐藏' : '显示'}
                      >
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          {isVisible ? (
                            <>
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                              <line x1="1" y1="1" x2="23" y2="23"/>
                            </>
                          ) : (
                            <>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </>
                          )}
                        </svg>
                      </button>
                      <button
                        onClick={() => copyKey(k.id, k.fullValue)}
                        className="text-zinc-600 hover:text-zinc-300 transition-colors p-0.5"
                        title="复制"
                      >
                        {isCopied ? (
                          <svg className="size-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : (
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1.5 ${
                      k.status === 'valid' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        k.status === 'valid' ? 'bg-emerald-400 shadow-[0_0_4px_#22c55e66]' : 'bg-amber-400 shadow-[0_0_4px_#eab30866]'
                      }`}/>
                      {k.status === 'valid' ? '有效' : '7日过期'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-500">{k.distributedTo}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button className="text-zinc-500 hover:text-zinc-300 text-[11px] mr-2">编辑</button>
                    <button className="text-zinc-500 hover:text-red-400 text-[11px]">删除</button>
                  </td>
                </tr>
              )}
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
