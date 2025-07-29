import { useMemo } from 'react';
import { Medicine, ScheduledMedicine } from '@/types/medicine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, AlertTriangle } from 'lucide-react';

interface DailyTimelineProps {
  medicines: Medicine[];
  onRecordIntake: (medicineId: string, scheduledTime: string, status: 'taken' | 'skipped' | 'delayed') => void;
}

export const DailyTimeline = ({ medicines, onRecordIntake }: DailyTimelineProps) => {
  const generateTimesForMedicine = (medicine: Medicine): string[] => {
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
      case 'interval-hours':
        // For interval-based, calculate times starting from 8 AM
        const times: string[] = [];
        let startHour = 8;
        const interval = medicine.intervalHours || 8;
        while (startHour < 24) {
          times.push(`${startHour.toString().padStart(2, '0')}:00`);
          startHour += interval;
        }
        return times;
      default:
        return [];
    }
  };

  const todaySchedule = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const schedule: ScheduledMedicine[] = [];

    medicines.forEach(medicine => {
      const times = generateTimesForMedicine(medicine);
      times.forEach(time => {
        schedule.push({
          medicineId: medicine.id,
          medicine,
          scheduledTime: time,
          status: 'pending'
        });
      });
    });

    // Sort by time
    return schedule.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [medicines]);

  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const isOverdue = (scheduledTime: string) => {
    const currentTime = getCurrentTime();
    return currentTime > scheduledTime;
  };

  const getStatusBadge = (item: ScheduledMedicine) => {
    switch (item.status) {
      case 'taken':
        return <Badge className="bg-green-100 text-green-800">Taken</Badge>;
      case 'skipped':
        return <Badge variant="destructive">Skipped</Badge>;
      case 'delayed':
        return <Badge variant="secondary">Delayed</Badge>;
      case 'pending':
        return isOverdue(item.scheduledTime) ? 
          <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Overdue</Badge> :
          <Badge variant="outline">Pending</Badge>;
      default:
        return null;
    }
  };

  if (todaySchedule.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No medicines scheduled for today</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Schedule</CardTitle>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {todaySchedule.map((item, index) => (
            <div key={`${item.medicineId}-${item.scheduledTime}`} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-medium">{item.scheduledTime}</div>
                  <div>
                    <h3 className="font-medium">{item.medicine.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.medicine.dosage}</p>
                    {item.medicine.takeWithFood && (
                      <p className="text-xs text-muted-foreground">Take with food</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusBadge(item)}
                {item.status === 'pending' && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => onRecordIntake(item.medicineId, item.scheduledTime, 'taken')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onRecordIntake(item.medicineId, item.scheduledTime, 'skipped')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};