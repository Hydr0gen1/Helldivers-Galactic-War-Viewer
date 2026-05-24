export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(Math.round(n));
}

export function formatPercent(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

export function formatHours(hours: number): string {
  if (hours <= 0) return 'Expired';
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function formatLocalTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
