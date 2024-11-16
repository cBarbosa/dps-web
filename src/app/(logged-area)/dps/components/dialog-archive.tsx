import React from "react";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent
} from "@/components/ui/alert-dialog";

export const createPdfUrlFromBase64 = (base64Data: string): string | undefined => {

    if (!base64Data || base64Data.length % 4 !== 0)
      return;

    try {

          const binaryData = atob(base64Data);
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
