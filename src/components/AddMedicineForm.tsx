import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Medicine, FrequencyType } from '@/types/medicine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';

interface AddMedicineFormProps {
  onAddMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

type FormData = {
  name: string;
  dosage: string;
  frequency: FrequencyType;
  startDate: string;
  endDate: string;
  notes: string;
  currentStock: number;
  lowStockAlert: number;
  takeWithFood: boolean;
  intervalHours: number;
};

export const AddMedicineForm = ({ onAddMedicine, onCancel }: AddMedicineFormProps) => {
  const [customTimes, setCustomTimes] = useState<string[]>(['']);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      takeWithFood: false,
      currentStock: 30,
      lowStockAlert: 7,
      intervalHours: 8
    }
  });

  const frequency = watch('frequency');

  const addCustomTime = () => {
    setCustomTimes([...customTimes, '']);
  };

  const removeCustomTime = (index: number) => {
    setCustomTimes(customTimes.filter((_, i) => i !== index));
  };

  const updateCustomTime = (index: number, value: string) => {
    const updated = [...customTimes];
    updated[index] = value;
    setCustomTimes(updated);
  };

  const onSubmit = (data: FormData) => {
    const medicine: Omit<Medicine, 'id' | 'createdAt'> = {
      name: data.name,
      dosage: data.dosage,
      frequency: data.frequency,
      startDate: data.startDate,
      endDate: data.endDate || undefined,
      notes: data.notes || undefined,
      currentStock: data.currentStock,
      lowStockAlert: data.lowStockAlert,
      takeWithFood: data.takeWithFood,
      customTimes: frequency === 'custom-times' ? customTimes.filter(time => time) : undefined,
      intervalHours: frequency === 'interval-hours' ? data.intervalHours : undefined
    };
    onAddMedicine(medicine);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Medicine</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Medicine Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Medicine name is required' })}
                placeholder="e.g., Aspirin"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage *</Label>
              <Input
                id="dosage"
                {...register('dosage', { required: 'Dosage is required' })}
                placeholder="e.g., 1 tablet, 5ml"
              />
              {errors.dosage && <p className="text-sm text-destructive">{errors.dosage.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency *</Label>
            <Select onValueChange={(value) => setValue('frequency', value as FrequencyType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once-daily">Once daily</SelectItem>
                <SelectItem value="twice-daily">Twice daily</SelectItem>
                <SelectItem value="three-times-daily">Three times daily</SelectItem>
                <SelectItem value="four-times-daily">Four times daily</SelectItem>
                <SelectItem value="custom-times">Custom times</SelectItem>
                <SelectItem value="interval-hours">Every X hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequency === 'custom-times' && (
            <div className="space-y-2">
              <Label>Custom Times</Label>
              {customTimes.map((time, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => updateCustomTime(index, e.target.value)}
                    className="flex-1"
                  />
                  {customTimes.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeCustomTime(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addCustomTime} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Time
              </Button>
            </div>
          )}

          {frequency === 'interval-hours' && (
            <div className="space-y-2">
              <Label htmlFor="intervalHours">Every X hours</Label>
              <Input
                id="intervalHours"
                type="number"
                min="1"
                max="24"
                {...register('intervalHours', { min: 1, max: 24 })}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate', { required: 'Start date is required' })}
              />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentStock">Current Stock</Label>
              <Input
                id="currentStock"
                type="number"
                min="0"
                {...register('currentStock', { min: 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
              <Input
                id="lowStockAlert"
                type="number"
                min="1"
                {...register('lowStockAlert', { min: 1 })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="takeWithFood"
              {...register('takeWithFood')}
            />
            <Label htmlFor="takeWithFood">Take with food</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional instructions or notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Add Medicine
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};