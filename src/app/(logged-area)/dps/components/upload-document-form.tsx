import { useState } from 'react';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import DialogAlertComp from '@/components/ui/alert-dialog-comp';
import { postProposalDocumentLinkByUid } from '../actions';
import { getSasUrl, sanitizeBlobName } from '@/lib/azure-upload'
import { BlockBlobClient } from '@azure/storage-blob'
import { toast } from 'react-hot-toast';

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

      const documentName = (formData.get('documentName') as string) || 'documento'
      const description = (formData.get('description') as string) || ''
      const type = formData.get('type') as 'MIP' | 'DFI'

      let blobUrl = ''
      const safeName = sanitizeBlobName(documentName)
      const blobName = `waiting/${uid}/${safeName}`
      const { uploadUrl, blobUrl: finalBlobUrl } = await getSasUrl(blobName, 'smart-dps')

      if (typeof window === 'undefined') throw new Error('Upload inválido no servidor')

      const inputEl = (document.querySelector('input[type="file"]') as HTMLInputElement | null)
      const file = inputEl?.files?.[0]
      if (!file) {
        toast.error('Selecione um arquivo para enviar')
        return
      }

      const client = new BlockBlobClient(uploadUrl)
      await client.uploadData(file, {
        blobHTTPHeaders: { blobContentType: file.type || 'application/octet-stream' },
      })
      blobUrl = finalBlobUrl

      const res = await postProposalDocumentLinkByUid(token, uid, {
        documentName: file.name || documentName,
        description,
        documentUrl: blobUrl,
        type,
      })

      if (res && res.success) {
        toast.success(res.message)
      } else {
        toast.error(res?.message || 'Falha ao registrar documento')
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