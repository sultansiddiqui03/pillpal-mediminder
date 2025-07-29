import { useState, useEffect } from 'react';
import { Medicine, MedicineIntake } from '@/types/medicine';

const STORAGE_KEYS = {
  MEDICINES: 'meditrack_medicines',
  INTAKES: 'meditrack_intakes'
};

export const useMedicines = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [intakes, setIntakes] = useState<MedicineIntake[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedMedicines = localStorage.getItem(STORAGE_KEYS.MEDICINES);
    const savedIntakes = localStorage.getItem(STORAGE_KEYS.INTAKES);

    if (savedMedicines) {
      setMedicines(JSON.parse(savedMedicines));
    }
    if (savedIntakes) {
      setIntakes(JSON.parse(savedIntakes));
    }
  }, []);

  // Save medicines to localStorage
  const saveMedicines = (newMedicines: Medicine[]) => {
    setMedicines(newMedicines);
    localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(newMedicines));
  };

  // Save intakes to localStorage
  const saveIntakes = (newIntakes: MedicineIntake[]) => {
    setIntakes(newIntakes);
    localStorage.setItem(STORAGE_KEYS.INTAKES, JSON.stringify(newIntakes));
  };

  const addMedicine = (medicine: Omit<Medicine, 'id' | 'createdAt'>) => {
    const newMedicine: Medicine = {
      ...medicine,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    saveMedicines([...medicines, newMedicine]);
  };

  const updateMedicine = (id: string, updates: Partial<Medicine>) => {
    const updatedMedicines = medicines.map(med => 
      med.id === id ? { ...med, ...updates } : med
    );
    saveMedicines(updatedMedicines);
  };

  const deleteMedicine = (id: string) => {
    const updatedMedicines = medicines.filter(med => med.id !== id);
    saveMedicines(updatedMedicines);
    // Also remove related intakes
    const updatedIntakes = intakes.filter(intake => intake.medicineId !== id);
    saveIntakes(updatedIntakes);
  };

  const recordIntake = (medicineId: string, scheduledTime: string, status: MedicineIntake['status'], notes?: string) => {
    const intake: MedicineIntake = {
      id: crypto.randomUUID(),
      medicineId,
      scheduledTime,
      actualTime: status === 'taken' ? new Date().toISOString() : undefined,
      status,
      date: new Date().toISOString().split('T')[0],
      notes
    };
    saveIntakes([...intakes, intake]);
  };

  return {
    medicines,
    intakes,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    recordIntake
  };
};