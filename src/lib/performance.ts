type AppPerfMetric = {
  name: string;
  durationMs: number;
  detail?: string;
  recordedAt: string;
};

type PerfWindow = Window & {
  __avrMetrics?: AppPerfMetric[];
};

export function recordElapsedMetric(name: string, startedAtMs: number, detail?: string) {
  if (typeof window === "undefined" || typeof performance === "undefined") return;

  const durationMs = Math.max(0, performance.now() - startedAtMs);
  const metric: AppPerfMetric = {
    name,
    durationMs,
    detail,
    recordedAt: new Date().toISOString(),
  };

  const perfWindow = window as PerfWindow;
  perfWindow.__avrMetrics = [...(perfWindow.__avrMetrics ?? []), metric].slice(-20);

  if (import.meta.env.DEV) {
    const detailSuffix = detail ? ` (${detail})` : "";
    console.info(`[perf] ${name}: ${durationMs.toFixed(1)}ms${detailSuffix}`);
  }
}
