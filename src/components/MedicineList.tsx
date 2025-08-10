import { Medicine } from '@/types/medicine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pill, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';
import { getDragData, setDragData } from './drag';

interface MedicineListProps {
  medicines: Medicine[];
  onEditMedicine?: (medicine: Medicine) => void;
  onDeleteMedicine?: (id: string) => void;
  onReorderMedicines?: (orderedIds: string[]) => void;
}

export const MedicineList = ({ medicines, onEditMedicine, onDeleteMedicine, onReorderMedicines }: MedicineListProps) => {
  const [dragOverId, setDragOverId] = useState<string | null>(null);

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

  const orderedIds = useMemo(() => medicines.map(m => m.id), [medicines]);

  const onDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDragData(e, id);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent, overId: string) => {
    e.preventDefault();
    setDragOverId(overId);
  }, []);

  const onDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = getDragData(e);
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;
    const currentOrder = [...orderedIds];
    const fromIdx = currentOrder.indexOf(sourceId);
    const toIdx = currentOrder.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    currentOrder.splice(toIdx, 0, currentOrder.splice(fromIdx, 1)[0]);
    onReorderMedicines?.(currentOrder);
  }, [onReorderMedicines, orderedIds]);

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
      <motion.div className="grid gap-4" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}>
        {medicines.map((medicine) => (
          <motion.div
            key={medicine.id}
            variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            draggable
            onDragStart={(e) => onDragStart(e, medicine.id)}
            onDragOver={(e) => onDragOver(e, medicine.id)}
            onDrop={(e) => onDrop(e, medicine.id)}
          >
            <Card className={`relative bg-card/60 backdrop-blur-sm ${dragOverId === medicine.id ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="pb-3 cursor-grab active:cursor-grabbing">
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
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};