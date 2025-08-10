import { Medicine } from "@/types/medicine";

export function generateTimesForMedicine(medicine: Medicine): string[] {
  switch (medicine.frequency) {
    case 'once-daily':
      return ['09:00'];
    case 'twice-daily':
      return ['09:00', '21:00'];
    case 'three-times-daily':
      return ['08:00', '14:00', '20:00'];
    case 'four-times-daily':
      return ['08:00', '12:00', '16:00', '20:00'];
    case 'custom-times':
      return medicine.customTimes || [];
    case 'interval-hours': {
      const times: string[] = [];
      let startHour = 8;
      const interval = medicine.intervalHours || 8;
      while (startHour < 24) {
        times.push(`${startHour.toString().padStart(2, '0')}:00`);
        startHour += interval;
      }
      return times;
    }
    default:
      return [];
  }
}

export function isDateWithinRange(dateISO: string, startDateISO: string, endDateISO?: string): boolean {
  const d = new Date(dateISO);
  const start = new Date(startDateISO);
  const end = endDateISO ? new Date(endDateISO) : undefined;
  if (d < start) return false;
  if (end && d > end) return false;
  return true;
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getDatesBackwards(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(formatDateISO(d));
  }
  return dates;
}