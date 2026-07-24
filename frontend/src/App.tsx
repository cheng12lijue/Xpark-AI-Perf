import { useCallback, useMemo } from 'react'
import { useMetrics } from './hooks/useMetrics'
import { useMetricsHistory } from './hooks/useMetricsHistory'
import { ConnectionBadge } from './components/ConnectionBadge'
import { SystemView } from './components/views/SystemView'
import { InferenceView } from './components/views/InferenceView'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { GpuEvent, InferenceRequest } from './types/events'

const VIEW_TAB_KEY = 'xpark-ai-perf:view-tab'

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
      return window.localStorage.getItem(VIEW_TAB_KEY) ?? 'system'
    } catch {
      return 'system'
    }
  }, [])

  return (
    <div className="h-dvh flex flex-col bg-[#08080a] overflow-hidden">
      <header className="shrink-0 border-b border-white/[0.04] px-4 py-1.5 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
          <span className="text-[#76B900]">Spark</span>{' '}
          <span className="text-zinc-500 font-normal">Dashboard</span>
        </h1>
        <ConnectionBadge status={connectionStatus} isStale={isStale} />
      </header>

      <Tabs
        defaultValue={defaultTab}
        onValueChange={handleTabChange}
        className="flex-1 min-h-0 flex flex-col"
      >
        <div className="shrink-0 border-b border-white/[0.04] px-4 py-0">
          <TabsList variant="line" className="bg-transparent h-10 gap-0">
            <TabsTrigger
              value="system"
              className="relative px-4 py-2 text-sm font-medium text-zinc-500 data-[state=active]:text-zinc-100 data-[state=active]:after:opacity-100 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#76B900] after:opacity-0 after:transition-opacity transition-colors hover:text-zinc-300"
            >
              <svg className="size-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              系统监控
            </TabsTrigger>
            <TabsTrigger
              value="inference"
              className="relative px-4 py-2 text-sm font-medium text-zinc-500 data-[state=active]:text-zinc-100 data-[state=active]:after:opacity-100 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#76B900] after:opacity-0 after:transition-opacity transition-colors hover:text-zinc-300"
            >
              <svg className="size-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              vLLM 推理
            </TabsTrigger>
          </TabsList>
        </div>

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
        </main>
      </Tabs>
    </div>
  )
}

export default App
