import { useMemo } from 'react'
import { EngineSection } from '@/components/engines/EngineSection'
import { useElementSize } from '@/hooks/useElementSize'
import type { MetricsSnapshot } from '@/types/metrics'
import type { InferenceRequest } from '@/types/events'

interface InferenceViewProps {
  metrics: MetricsSnapshot | null
  history: {
    getChartData: (metric: string) => Array<{ timestamp: number; value: number }>
    getSparklineData: (metric: string, count?: number) => number[]
  }
  requests: InferenceRequest[]
}

/** Minimum height (px) below which engine trend charts are hidden to keep
 *  the view compact on small viewports. */
const ENGINE_CHARTS_MIN_HEIGHT_PX = 520

export function InferenceView({
  metrics,
  history,
  requests,
}: InferenceViewProps) {
  const [rootRef, rootSize] = useElementSize<HTMLDivElement>()
  const showEngineCharts = rootSize.height === 0 || rootSize.height >= ENGINE_CHARTS_MIN_HEIGHT_PX

  const gpuCount = useMemo(() => {
    if (!metrics) return 0
    return metrics.gpus && metrics.gpus.length > 0 ? metrics.gpus.length : 1
  }, [metrics])

  if (!metrics) return null

  return (
    <div ref={rootRef} className="flex-1 min-h-0 flex flex-col">
      {metrics.engines.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <svg className="size-12 mx-auto mb-4 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            <h3 className="text-lg font-semibold text-zinc-100 mb-1">No Inference Engines Detected</h3>
            <p className="text-sm text-zinc-500">
              Start a vLLM inference engine and it will appear here automatically within seconds.
            </p>
          </div>
        </div>
      ) : (
        <EngineSection
          engines={metrics.engines}
          showCharts={showEngineCharts}
          getChartData={history.getChartData}
          requests={requests}
          gpuCount={gpuCount}
        />
      )}
    </div>
  )
}
