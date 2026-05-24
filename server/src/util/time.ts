export function hoursUntil(isoDate: string): number {
  const ms = new Date(isoDate).getTime() - Date.now();
  return ms / (1000 * 60 * 60);
}

export function isRampingUp(prevShare: number, currentShare: number): boolean {
  return currentShare >= prevShare * 2;
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}
