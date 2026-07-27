import { useCallback, useMemo } from 'react'
import { useMetrics } from './hooks/useMetrics'
import { useMetricsHistory } from './hooks/useMetricsHistory'
import { ConnectionBadge } from './components/ConnectionBadge'
import { SystemView } from './components/views/SystemView'
import { InferenceView } from './components/views/InferenceView'
import { ModelRegistryView } from './components/views/ModelRegistryView'
import { KeyManagementView } from './components/views/KeyManagementView'
import { ModelDeployView } from './components/views/ModelDeployView'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { GpuEvent, InferenceRequest } from './types/events'
import changelogRaw from '../../CHANGELOG.md?raw'

const VIEW_TAB_KEY = 'xpark-ai-perf:view-tab'

// Extract the latest version from CHANGELOG.md (first ## [x.y.z] heading)
const APP_VERSION = changelogRaw.match(/## \[([\d.]+)\]/)?.[1] ?? '0.0.0'

function App() {
  const { metrics, connectionStatus, isStale } = useMetrics()

  const history = useMetricsHistory(metrics)

  const { getEvents, getRequests } = history

  const events = useMemo((): GpuEvent[] =>
    getEvents().map((e) => ({
      timestamp_ms: e.timestamp_ms,
      gpu_index: e.gpu_index,
      event_type: e.event_type as GpuEvent['event_type'],
      detail: e.detail,
    })),
    [getEvents],
  )

  const requests = useMemo((): InferenceRequest[] =>
    getRequests().map((r) => ({
      start_ms: r.start_ms,
      end_ms: r.end_ms,
      tps: r.tokens_per_sec,
      ttft_ms: r.ttft_ms,
    })),
    [getRequests],
  )

  const handleTabChange = useCallback((value: string) => {
    try {
      window.localStorage.setItem(VIEW_TAB_KEY, value)
    } catch { /* ignore */ }
  }, [])

  const defaultTab = useMemo(() => {
    try {
      return window.localStorage.getItem(VIEW_TAB_KEY) ?? 'registry'
    } catch {
      return 'system'
    }
  }, [])

  return (
    <div className="h-dvh flex flex-col bg-[#08080a] overflow-hidden">
      {/* Top header bar */}
      <header className="shrink-0 border-b border-white/[0.04] px-4 py-1.5 flex justify-between items-center z-10">
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight flex items-baseline gap-0" style={{ fontFamily: 'Inter, sans-serif' }}>
          <span className="text-[#76B900]">AI</span>{' '}
          <span className="text-zinc-500 font-normal">Perf</span>
          <span className="ml-1.5 text-[9px] font-mono text-[#76B900] font-normal leading-none translate-y-[-1px]">
            v{APP_VERSION}
          </span>
        </h1>
        <ConnectionBadge status={connectionStatus} isStale={isStale} />
      </header>

      {/* Body: sidebar + content */}
      <div className="flex-1 min-h-0 flex">
        {/* Left sidebar navigation — always expanded */}
        <Tabs
          orientation="vertical"
          defaultValue={defaultTab}
          onValueChange={handleTabChange}
          className="flex-1 min-h-0 flex"
        >
          <nav className="w-16 shrink-0 border-r border-white/[0.04] bg-[#0c0c10] flex flex-col items-center gap-3 py-4 px-1">
            <TabsList variant="line" className="flex flex-col bg-transparent gap-3 w-full">
              <TabsTrigger
                value="system"
                className="relative flex flex-col items-center justify-center gap-1 w-full rounded-lg text-zinc-400 data-active:text-[#76B900] data-active:bg-[#76B900]/[0.12] transition-colors hover:text-zinc-200 hover:bg-white/[0.03] text-[10px] leading-tight"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                <span>系统监控</span>
              </TabsTrigger>
              <TabsTrigger
                value="inference"
                className="relative flex flex-col items-center justify-center gap-1 w-full rounded-lg text-zinc-400 data-active:text-[#76B900] data-active:bg-[#76B900]/[0.12] transition-colors hover:text-zinc-200 hover:bg-white/[0.03] text-[10px] leading-tight"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
                <span>vLLM 推理</span>
              </TabsTrigger>
              <TabsTrigger
                value="registry"
                className="relative flex flex-col items-center justify-center gap-1 w-full rounded-lg text-zinc-400 data-active:text-[#76B900] data-active:bg-[#76B900]/[0.12] transition-colors hover:text-zinc-200 hover:bg-white/[0.03] text-[10px] leading-tight"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
                <span>模型广场</span>
              </TabsTrigger>
              <TabsTrigger
                value="deploy"
                className="relative flex flex-col items-center justify-center gap-1 w-full rounded-lg text-zinc-400 data-active:text-[#76B900] data-active:bg-[#76B900]/[0.12] transition-colors hover:text-zinc-200 hover:bg-white/[0.03] text-[10px] leading-tight"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                <span>模型部署</span>
              </TabsTrigger>
              <TabsTrigger
                value="keys"
                className="relative flex flex-col items-center justify-center gap-1 w-full rounded-lg text-zinc-400 data-active:text-[#76B900] data-active:bg-[#76B900]/[0.12] transition-colors hover:text-zinc-200 hover:bg-white/[0.03] text-[10px] leading-tight"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                <span>密钥管理</span>
              </TabsTrigger>
            </TabsList>
          </nav>

          <main className={`flex-1 min-h-0 flex flex-col p-3 lg:p-4 2xl:p-5 min-[1920px]:p-6 ${isStale ? 'opacity-50' : ''}`}>
            {!metrics && connectionStatus !== 'connected' && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-zinc-50 mb-2">Waiting for metrics</h2>
                  <p className="text-zinc-400">
                    Connecting to the metrics server at {window.location.origin}. Make sure Xpark AI Perf is running.
                  </p>
                </div>
              </div>
            )}

            <TabsContent value="system" className="flex-1 min-h-0 flex flex-col data-[state=inactive]:hidden">
              <SystemView
                metrics={metrics}
                history={history}
                events={events}
                requests={requests}
              />
            </TabsContent>

            <TabsContent value="inference" className="flex-1 min-h-0 flex flex-col data-[state=inactive]:hidden">
              <InferenceView
                metrics={metrics}
                history={history}
                requests={requests}
              />
            </TabsContent>

            <TabsContent value="registry" className="flex-1 min-h-0 flex flex-col data-[state=inactive]:hidden">
              <ModelRegistryView />
            </TabsContent>

            <TabsContent value="deploy" className="flex-1 min-h-0 flex flex-col data-[state=inactive]:hidden">
              <ModelDeployView />
            </TabsContent>

            <TabsContent value="keys" className="flex-1 min-h-0 flex flex-col data-[state=inactive]:hidden">
              <KeyManagementView />
            </TabsContent>
          </main>
        </Tabs>
      </div>
    </div>
  )
}

export default App
