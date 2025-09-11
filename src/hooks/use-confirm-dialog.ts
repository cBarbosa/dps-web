import { useState, useCallback } from 'react';

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
}

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<ConfirmDialogOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const showConfirmDialog = useCallback((options: ConfirmDialogOptions) => {
    setDialogConfig(options);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolveRef(() => resolve);
    });
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open && resolveRef) {
      resolveRef(false);
    }
  }, [resolveRef]);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolveRef) {
      resolveRef(true);
    }
  }, [resolveRef]);

  return {
    isOpen,
    dialogConfig,
    showConfirmDialog,
    handleOpenChange,
    handleConfirm,
  };
}