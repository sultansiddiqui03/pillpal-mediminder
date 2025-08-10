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
    
    // Update inventory if medicine was taken
    if (status === 'taken') {
      const updatedMedicines = medicines.map(med => 
        med.id === medicineId 
          ? { ...med, currentStock: Math.max(0, med.currentStock - 1) }
          : med
      );
      saveMedicines(updatedMedicines);
    }
  };

  const reorderMedicines = (orderedIds: string[]) => {
    const idToMed = new Map(medicines.map(m => [m.id, m] as const));
    const newOrder: Medicine[] = [];
    for (const id of orderedIds) {
      const med = idToMed.get(id);
      if (med) newOrder.push(med);
    }
    // Include any meds not in orderedIds to be safe
    for (const med of medicines) {
      if (!orderedIds.includes(med.id)) newOrder.push(med);
    }
    saveMedicines(newOrder);
  };

  return {
    medicines,
    intakes,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    recordIntake,
    reorderMedicines
  };
};