export function setDragData(e: React.DragEvent, id: string) {
  e.dataTransfer.setData('text/plain', id);
  e.dataTransfer.effectAllowed = 'move';
}

export function getDragData(e: React.DragEvent): string | null {
  try {
    return e.dataTransfer.getData('text/plain') || null;
  } catch {
    return null;
  }
}