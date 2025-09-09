import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface DeleteConfirmButtonProps {
  onDelete: () => Promise<void>;
  itemName?: string;
  description?: string;
  disabled?: boolean;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  isDeleting?: boolean;
}

export function DeleteConfirmButton({
  onDelete,
  itemName = "item",
  description = "This action cannot be undone.",
  disabled = false,
  size = "sm",
  variant = "ghost",
  className = "",
  isDeleting = false
}: DeleteConfirmButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete();
      setShowDialog(false);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size={size}
        variant={variant}
        onClick={() => setShowDialog(true)}
        disabled={disabled || loading || isDeleting}
        className={`text-muted-foreground hover:text-destructive ${className}`}
      >
        {(loading || isDeleting) ? (
          <div className="h-4 w-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>

      <ConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title={`Delete ${itemName}`}
        description={`Are you sure you want to delete this ${itemName}? ${description}`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}