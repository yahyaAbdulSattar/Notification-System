import type { MetricsSnapshot } from "../types/metrics.type.js";

const metrics: MetricsSnapshot = {
  notifications_published_total: 0,
  urgent_processed_total: 0,
  normal_buffered_total: 0,
  digest_flushed_total: 0,
  digest_notifications_total: 0,
  dlq_count_total: 0,
  attempts_total: 0,
  published_errors_total: 0,
  last_updated: null,
};


function touch() {
  metrics.last_updated = new Date().toISOString();
}

// increment metric
export function inc(key: keyof MetricsSnapshot, by = 1) {
  // @ts-ignore
  metrics[key] = (metrics[key] ?? 0) + by;
  touch();
}

export function setMetric(key: keyof MetricsSnapshot, value: number) {
  // @ts-ignore
  metrics[key] = value;
  touch();
}

// get all metrics
export function snapshot(): MetricsSnapshot {
  return { ...metrics };
}