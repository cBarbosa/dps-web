import React from "react";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Root as VisuallyHidden } from '@radix-ui/react-visually-hidden'

export const createPdfUrlFromBase64 = (base64Data: string): string | undefined => {

    if (!base64Data) return

    try {
          // Normaliza base64: remove prefixos e padding/URL-safe
          const normalized = base64Data
            .replace(/^data:application\/pdf;base64,/, '')
            .replace(/\s/g, '')
            .replace(/-/g, '+')
            .replace(/_/g, '/')
          const pad = normalized.length % 4
          const padded = pad ? normalized + '='.repeat(4 - pad) : normalized

          const binaryData = atob(padded);
          const arrayBuffer = new Uint8Array(binaryData.length);
          for (let i = 0; i < binaryData.length; i++) {
            arrayBuffer[i] = binaryData.charCodeAt(i);
        }

        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });

        return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Erro ao criar URL do PDF:', error);
    }
};

export const downloadItem = (
    data: string,
    filename: string = 'archive.pdf'
): void => {
    const link = document.createElement('a')

    link.href = `data:application/pdf;base64,${data}`
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
}

export const DialogShowArchive = ({
    isModalOpen,
    setIsModalOpen,
    pdfUrl
}: {
    isModalOpen: boolean,
    setIsModalOpen: (open: boolean) => void,
    pdfUrl?: string
}) => {

    const [isLoadingReport, setIsLoadingReport] = React.useState(false);

    return (
        <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <AlertDialogContent className="p-2 m-0 max-w-[90%] w-full h-auto">
                <VisuallyHidden>
                    <AlertDialogTitle>Visualização de relatório em PDF</AlertDialogTitle>
                </VisuallyHidden>

                <div className="flex justify-center items-center w-full h-[80vh]">
                    {!pdfUrl ? (
                        <div className="flex items-center justify-center h-full w-full">
                            <span>Carregando Arquivo...</span>
                        </div>
                    ) : (
                        <iframe
                            src={`${pdfUrl}#zoom=90`}
                            title="Relatório em PDF"
                            className="w-full max-w-full h-full"
                            referrerPolicy="no-referrer"
                            allow="fullscreen"
                        ></iframe>
                    )}
                </div>
                <AlertDialogCancel className="mt-4 text-center">
                    Fechar
                </AlertDialogCancel>
            </AlertDialogContent>
        </AlertDialog>
    );
};
