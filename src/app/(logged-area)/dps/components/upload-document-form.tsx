import { useState } from 'react';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import DialogAlertComp from '@/components/ui/alert-dialog-comp';
import { postProposalDocumentsByUid } from '../actions';
import { toast } from 'sonner';

interface UploadDocumentFormProps {
  token: string;
  uid: string;
}

export function UploadDocumentForm({ token, uid }: UploadDocumentFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const {
    isOpen,
    dialogConfig,
    showConfirmDialog,
    handleOpenChange,
    handleConfirm,
  } = useConfirmDialog();

  // Estado para armazenar dados do arquivo que precisa de confirmação
  const [pendingUpload, setPendingUpload] = useState<{
    compressedFile?: Uint8Array;
    originalData?: {
      documentName: string;
      description: string;
      type: 'MIP' | 'DFI';
    };
  } | null>(null);

  const handleUpload = async (formData: FormData) => {
    try {
      setIsUploading(true);

      const result = await postProposalDocumentsByUid(token, uid, {
        documentName: formData.get('documentName') as string,
        description: formData.get('description') as string,
        stringBase64: formData.get('file') as string,
        type: formData.get('type') as 'MIP' | 'DFI'
      });

      if (!result) {
        toast.error('Falha no envio do arquivo.');
        return;
      }

      if (result.needsConfirmation) {
        // Armazena os dados para uso após confirmação
        setPendingUpload({
          compressedFile: result.compressedFile,
          originalData: result.originalData
        });

        // Mostra diálogo de confirmação
        const confirmed = await showConfirmDialog({
          title: 'Arquivo Grande',
          message: result.message,
          confirmText: 'Sim, continuar'
        });

        if (confirmed && pendingUpload) {
          const toBase64 = (bytes: Uint8Array) => {
            let binary = ''
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i])
            }
            return btoa(binary)
          }

          // Chama novamente com flag de forceUpload
          const uploadResult = await postProposalDocumentsByUid(token, uid, {
            ...pendingUpload.originalData!,
            stringBase64: toBase64(pendingUpload.compressedFile!),
            forceUpload: true
          });

          if (uploadResult) {
            if (uploadResult.success) {
              toast.success(uploadResult.message);
            } else {
              toast.error(uploadResult.message);
            }
          } else {
            toast.error('Falha ao confirmar envio do arquivo.');
          }
        }
      } else if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erro ao processar upload: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
      setPendingUpload(null);
    }
  };

  return (
    <>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        handleUpload(formData);
      }}>
        {/* Seus campos de formulário aqui */}
      </form>

      {dialogConfig && (
        <DialogAlertComp
          open={isOpen}
          onOpenChange={handleOpenChange}
          title={dialogConfig.title}
          onConfirm={handleConfirm}
          confirmText={dialogConfig.confirmText}
        >
          {dialogConfig.message}
        </DialogAlertComp>
      )}
    </>
  );
}