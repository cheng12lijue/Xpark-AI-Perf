import { Dashboard } from './Dashboard'
import type { MetricsSnapshot } from '@/types/metrics'
import type { GpuEvent, InferenceRequest } from '@/types/events'

interface SystemViewProps {
  metrics: MetricsSnapshot | null
  history: {
    getChartData: (metric: string) => Array<{ timestamp: number; value: number }>
    getSparklineData: (metric: string, count?: number) => number[]
  }
  events: GpuEvent[]
  requests: InferenceRequest[]
}

export function SystemView(props: SystemViewProps) {
  return <Dashboard {...props} />
}
