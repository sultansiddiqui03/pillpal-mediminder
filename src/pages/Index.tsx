import { useState } from 'react';
import { useMedicines } from '@/hooks/useMedicines';
import { AddMedicineForm } from '@/components/AddMedicineForm';
import { MedicineList } from '@/components/MedicineList';
import { DailyTimeline } from '@/components/DailyTimeline';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pill, Calendar, BarChart3 } from 'lucide-react';
import { StatsDashboard } from '@/components/StatsDashboard';
import { ThemeToggle } from '@/components/ThemeToggle';

const Index = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const { medicines, intakes, addMedicine, deleteMedicine, recordIntake } = useMedicines();

  const handleAddMedicine = (medicineData: any) => {
    addMedicine(medicineData);
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(40%_40%_at_50%_0%,hsl(var(--primary)/0.12),transparent)]" />
      <div className="container mx-auto px-4 py-6">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Pill className="h-8 w-8 text-primary" />
              MediTrack Reminder
            </h1>
            <p className="text-muted-foreground mt-2">
              Stay on track with your medication schedule
            </p>
          </div>
          <ThemeToggle />
        </header>

        {showAddForm ? (
          <AddMedicineForm
            onAddMedicine={handleAddMedicine}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Today
              </TabsTrigger>
              <TabsTrigger value="medicines" className="flex items-center gap-2">
                <Pill className="h-4 w-4" />
                Medicines
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-6">
              <DailyTimeline 
                medicines={medicines}
                intakes={intakes}
                onRecordIntake={recordIntake}
              />
            </TabsContent>

            <TabsContent value="medicines" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your Medicines</h2>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medicine
                </Button>
              </div>
              <MedicineList 
                medicines={medicines}
                onDeleteMedicine={deleteMedicine}
              />
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              <StatsDashboard medicines={medicines} intakes={intakes} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Index;
