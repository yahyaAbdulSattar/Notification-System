export type MetricsSnapshot = {
  notifications_published_total: number;
  urgent_processed_total: number;
  normal_buffered_total: number;
  digest_flushed_total: number;
  digest_notifications_total: number;
  dlq_count_total: number;
  attempts_total: number;
  published_errors_total: number;
  last_updated: string | null;
};
