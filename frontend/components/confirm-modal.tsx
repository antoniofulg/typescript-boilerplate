'use client';

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ConfirmModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  requireConfirmation?: boolean;
  confirmationText?: string;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  requireConfirmation = false,
  confirmationText,
  onConfirm,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setConfirmationInput('');
    }
  }, [open]);

  const handleConfirm = async () => {
    if (requireConfirmation && confirmationInput !== confirmationText) {
      return;
    }

    setIsConfirming(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      // Error handling should be done by parent component
      throw error;
    } finally {
      setIsConfirming(false);
    }
  };

  const isConfirmDisabled =
    requireConfirmation && confirmationInput !== confirmationText;

  if (!mounted) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {requireConfirmation && confirmationText && (
          <div className="space-y-2 py-4">
            <Label htmlFor="confirmation-input">
              Digite <strong>{confirmationText}</strong> para confirmar:
            </Label>
            <Input
              id="confirmation-input"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={confirmationText}
              disabled={isConfirming}
              aria-label="Confirmação de texto"
            />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isConfirmDisabled || isConfirming}
            className={variant === 'destructive' ? 'bg-destructive' : ''}
          >
            {isConfirming ? 'Confirmando...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
