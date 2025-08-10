import { Medicine, MedicineIntake } from "@/types/medicine";
import { generateTimesForMedicine, formatDateISO, getDatesBackwards, isDateWithinRange } from "./schedule";

export type ExpectedDose = {
  medicine: Medicine;
  medicineId: string;
  scheduledTime: string; // HH:mm
  date: string; // YYYY-MM-DD
  intake?: MedicineIntake;
};

export type DailyMetrics = {
  date: string;
  taken: number;
  skipped: number;
  missed: number; // expected but no record and in the past
  upcoming: number; // expected but in the future
  adherenceRate: number; // taken / (taken+skipped+missed)
};

export function buildExpectedForDate(medicines: Medicine[], intakes: MedicineIntake[], dateISO: string): ExpectedDose[] {
  const expected: ExpectedDose[] = [];
  for (const med of medicines) {
    if (!isDateWithinRange(dateISO, med.startDate, med.endDate)) continue;
    for (const time of generateTimesForMedicine(med)) {
      const intake = intakes.find(i => i.medicineId === med.id && i.date === dateISO && i.scheduledTime === time);
      expected.push({ medicine: med, medicineId: med.id, scheduledTime: time, date: dateISO, intake });
    }
  }
  return expected.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

export function computeDailyMetrics(medicines: Medicine[], intakes: MedicineIntake[], dateISO: string): DailyMetrics {
  const expected = buildExpectedForDate(medicines, intakes, dateISO);
  let taken = 0, skipped = 0, missed = 0, upcoming = 0;
  const now = new Date();
  const todayISO = formatDateISO(now);
  const isPastOrToday = dateISO <= todayISO;

  for (const dose of expected) {
    if (dose.intake) {
      if (dose.intake.status === 'taken') taken++;
      else if (dose.intake.status === 'skipped') skipped++;
      else if (dose.intake.status === 'delayed') taken++; // treat delayed as taken for adherence
      else skipped++;
    } else {
      if (!isPastOrToday) {
        upcoming++;
      } else {
        // compare time if same day
        if (dateISO < todayISO) {
          missed++;
        } else {
          const [hh, mm] = dose.scheduledTime.split(":").map(Number);
          const cutoff = new Date(now);
          cutoff.setHours(hh, mm, 0, 0);
          if (now > cutoff) missed++; else upcoming++;
        }
      }
    }
  }
  const denominator = taken + skipped + missed;
  const adherenceRate = denominator > 0 ? Math.round((taken / denominator) * 100) : 0;
  return { date: dateISO, taken, skipped, missed, upcoming, adherenceRate };
}

export function computeSeries(medicines: Medicine[], intakes: MedicineIntake[], days: number): DailyMetrics[] {
  const dates = getDatesBackwards(days);
  return dates.map(d => computeDailyMetrics(medicines, intakes, d));
}

export function computePerMedicineAdherence(medicines: Medicine[], intakes: MedicineIntake[], days: number): { medicine: Medicine; taken: number; total: number; rate: number }[] {
  const startDates = getDatesBackwards(days);
  const result: { medicine: Medicine; taken: number; total: number; rate: number }[] = [];
  for (const med of medicines) {
    let taken = 0;
    let total = 0;
    for (const d of startDates) {
      if (!isDateWithinRange(d, med.startDate, med.endDate)) continue;
      const times = generateTimesForMedicine(med);
      for (const t of times) {
        const intake = intakes.find(i => i.medicineId === med.id && i.date === d && i.scheduledTime === t);
        const now = new Date();
        const todayISO = formatDateISO(now);
        const isPastOrToday = d <= todayISO;
        if (!isPastOrToday) continue; // exclude future from adherence denominator
        total++;
        if (intake?.status === 'taken' || intake?.status === 'delayed') taken++;
      }
    }
    const rate = total > 0 ? Math.round((taken / total) * 100) : 0;
    result.push({ medicine: med, taken, total, rate });
  }
  return result.sort((a, b) => b.rate - a.rate);
}