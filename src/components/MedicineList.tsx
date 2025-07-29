import { Medicine } from '@/types/medicine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pill, AlertTriangle, Calendar, Clock } from 'lucide-react';

interface MedicineListProps {
  medicines: Medicine[];
  onEditMedicine?: (medicine: Medicine) => void;
  onDeleteMedicine?: (id: string) => void;
}

export const MedicineList = ({ medicines, onEditMedicine, onDeleteMedicine }: MedicineListProps) => {
  const getFrequencyDisplay = (medicine: Medicine) => {
    switch (medicine.frequency) {
      case 'once-daily':
        return 'Once daily';
      case 'twice-daily':
        return 'Twice daily';
      case 'three-times-daily':
        return 'Three times daily';
      case 'four-times-daily':
        return 'Four times daily';
      case 'custom-times':
        return `At ${medicine.customTimes?.join(', ')}`;
      case 'interval-hours':
        return `Every ${medicine.intervalHours} hours`;
      default:
        return 'Unknown frequency';
    }
  };

  const isLowStock = (medicine: Medicine) => {
    return medicine.currentStock <= medicine.lowStockAlert;
  };

  if (medicines.length === 0) {
    return (
      <div className="text-center py-12">
        <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No medicines added yet</h3>
        <p className="text-muted-foreground">Add your first medicine to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your Medicines</h2>
      <div className="grid gap-4">
        {medicines.map((medicine) => (
          <Card key={medicine.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{medicine.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
                </div>
                {isLowStock(medicine) && (
                  <Badge variant="destructive" className="ml-2">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Low Stock
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{getFrequencyDisplay(medicine)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Since {new Date(medicine.startDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">Stock: </span>
                  <span className={isLowStock(medicine) ? 'text-destructive' : ''}>
                    {medicine.currentStock} pills
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Alert at {medicine.lowStockAlert} pills
                </div>
              </div>

              {medicine.takeWithFood && (
                <Badge variant="secondary">Take with food</Badge>
              )}

              {medicine.notes && (
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {medicine.notes}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                {onEditMedicine && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditMedicine(medicine)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                )}
                {onDeleteMedicine && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteMedicine(medicine.id)}
                    className="flex-1"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};