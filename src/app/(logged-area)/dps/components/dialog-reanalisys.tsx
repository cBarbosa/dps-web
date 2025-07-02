import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DialogReanalisys = ({
  open = false,
  defaultOpen = false,
  onOpenChange,
  title,
  children,
  onConfirm,
  confirmText = "Continuar",
  hideCancel = false,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  hideCancel?: boolean;
}) => {
  return (
    <AlertDialog
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{children}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!hideCancel && <AlertDialogCancel>Fechar</AlertDialogCancel>}
          {onConfirm ? (
            <AlertDialogAction onClick={onConfirm}>
              {confirmText}
            </AlertDialogAction>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DialogReanalisys;
