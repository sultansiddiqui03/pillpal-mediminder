export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: FrequencyType;
  customTimes?: string[]; // For specific times like ["09:00", "21:00"]
  intervalHours?: number; // For interval-based like every 8 hours
  startDate: string;
  endDate?: string;
  notes?: string;
  currentStock: number;
  lowStockAlert: number;
  takeWithFood: boolean;
  createdAt: string;
}

export type FrequencyType = 
  | 'once-daily'
  | 'twice-daily' 
  | 'three-times-daily'
  | 'four-times-daily'
  | 'custom-times'
  | 'interval-hours';

export interface MedicineIntake {
  id: string;
  medicineId: string;
  scheduledTime: string;
  actualTime?: string;
  status: 'pending' | 'taken' | 'skipped' | 'delayed';
  date: string;
  notes?: string;
}

export interface DailySchedule {
  date: string;
  medications: ScheduledMedicine[];
}

export interface ScheduledMedicine {
  medicineId: string;
  medicine: Medicine;
  scheduledTime: string;
  status: 'pending' | 'taken' | 'skipped' | 'delayed';
  intakeId?: string;
}