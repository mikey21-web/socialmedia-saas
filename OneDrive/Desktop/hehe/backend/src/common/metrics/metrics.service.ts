import { Injectable, Logger } from '@nestjs/common';

interface CounterMetric {
  name: string;
  value: number;
  labels: Record<string, string>;
}

interface HistogramBucket {
  le: number;
  count: number;
}

interface HistogramMetric {
  name: string;
  buckets: HistogramBucket[];
  sum: number;
  count: number;
}

/**
 * In-memory metrics collector exposing Prometheus-style counters and histograms.
 * Lightweight alternative to a full prom-client install.
 *
 * Usage:
 *   metrics.incCounter('publish_total', { platform: 'twitter', status: 'success' })
 *   metrics.observeHistogram('publish_duration_ms', 1234, { platform: 'twitter' })
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly counters = new Map<string, CounterMetric>();
  private readonly histograms = new Map<string, HistogramMetric>();
  private readonly defaultBuckets = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 30000];

  incCounter(name: string, labels: Record<string, string> = {}, value: number = 1): void {
    const key = this.makeKey(name, labels);
    const existing = this.counters.get(key);
    if (existing) {
      existing.value += value;
    } else {
      this.counters.set(key, { name, value, labels });
    }
  }

  observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.makeKey(name, labels);
    let metric = this.histograms.get(key);
    if (!metric) {
      metric = {
        name,
        buckets: this.defaultBuckets.map((le) => ({ le, count: 0 })),
        sum: 0,
        count: 0,
      };
      this.histograms.set(key, metric);
    }
    metric.sum += value;
    metric.count++;
    for (const bucket of metric.buckets) {
      if (value <= bucket.le) {
        bucket.count++;
      }
    }
  }

  /**
   * Render metrics in Prometheus exposition format.
   */
  toPrometheusFormat(): string {
    const lines: string[] = [];

    for (const counter of this.counters.values()) {
      const labelStr = this.formatLabels(counter.labels);
      lines.push(`# TYPE ${counter.name} counter`);
      lines.push(`${counter.name}${labelStr} ${counter.value}`);
    }

    for (const hist of this.histograms.values()) {
      lines.push(`# TYPE ${hist.name} histogram`);
      for (const bucket of hist.buckets) {
        const labelStr = this.formatLabels({ le: String(bucket.le) });
        lines.push(`${hist.name}_bucket${labelStr} ${bucket.count}`);
      }
      lines.push(`${hist.name}_sum ${hist.sum}`);
      lines.push(`${hist.name}_count ${hist.count}`);
    }

    return lines.join('\n');
  }

  /**
   * Get metrics as JSON for dashboards.
   */
  toJson() {
    return {
      counters: Array.from(this.counters.values()),
      histograms: Array.from(this.histograms.values()).map((h) => ({
        name: h.name,
        sum: h.sum,
        count: h.count,
        avg: h.count > 0 ? h.sum / h.count : 0,
        p50: this.percentile(h, 0.5),
        p95: this.percentile(h, 0.95),
        p99: this.percentile(h, 0.99),
      })),
    };
  }

  reset(): void {
    this.counters.clear();
    this.histograms.clear();
  }

  private makeKey(name: string, labels: Record<string, string>): string {
    const sortedLabels = Object.keys(labels).sort().map((k) => `${k}=${labels[k]}`).join(',');
    return `${name}{${sortedLabels}}`;
  }

  private formatLabels(labels: Record<string, string>): string {
    const entries = Object.entries(labels);
    if (entries.length === 0) return '';
    const parts = entries.map(([k, v]) => `${k}="${v}"`).join(',');
    return `{${parts}}`;
  }

  private percentile(hist: HistogramMetric, p: number): number {
    if (hist.count === 0) return 0;
    const target = hist.count * p;
    let cumulative = 0;
    for (const bucket of hist.buckets) {
      cumulative = bucket.count;
      if (cumulative >= target) {
        return bucket.le;
      }
    }
    return hist.buckets[hist.buckets.length - 1]?.le ?? 0;
  }
}
