import React from "react";
import { FileTextIcon } from 'lucide-react'

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Root as VisuallyHidden } from '@radix-ui/react-visually-hidden'

export const createPdfUrlFromBase64 = (base64Data: string | null): string | undefined => {
	// Trata explicitamente o caso de data null
	if (!base64Data || base64Data === null) {
		console.warn('Dados base64 são null ou não fornecidos para criar PDF')
		return undefined
	}

	try {
		// Normaliza base64: remove prefixos e padding/URL-safe
		const normalized = base64Data
			.replace(/^data:application\/pdf;base64,/, '')
			.replace(/\s/g, '')
			.replace(/-/g, '+')
			.replace(/_/g, '/')
		
		const pad = normalized.length % 4
		const padded = pad ? normalized + '='.repeat(4 - pad) : normalized

		// Valida se é um base64 válido
		if (padded.length === 0) {
			console.error('Dados base64 vazios após normalização')
			return undefined
		}

		const binaryData = atob(padded)
		const arrayBuffer = new Uint8Array(binaryData.length)
		
		for (let i = 0; i < binaryData.length; i++) {
			arrayBuffer[i] = binaryData.charCodeAt(i)
		}

		// Valida se o arquivo tem conteúdo
		if (arrayBuffer.length === 0) {
			console.error('Arquivo PDF vazio após decodificação')
			return undefined
		}

		const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
		return URL.createObjectURL(blob)
	} catch (error) {
		console.error('Erro ao criar URL do PDF:', error)
		return undefined
	}
}

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
    const [isLoadingReport, setIsLoadingReport] = React.useState(false)
    const [hasError, setHasError] = React.useState(false)

    // Reset error state when modal opens
    React.useEffect(() => {
        if (isModalOpen) {
            setHasError(false)
            setIsLoadingReport(true)
        }
    }, [isModalOpen])

    const handleIframeError = () => {
        setHasError(true)
        setIsLoadingReport(false)
    }

    const handleIframeLoad = () => {
        setIsLoadingReport(false)
        setHasError(false)
    }

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
                    ) : hasError ? (
                        <div className="flex flex-col items-center justify-center h-full w-full text-center p-4">
                            <div className="text-red-500 mb-2">
                                <FileTextIcon className="w-12 h-12 mx-auto mb-2" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Erro ao carregar PDF</h3>
                            <p className="text-gray-600 mb-4">
                                Não foi possível exibir o arquivo PDF. O arquivo pode estar corrompido ou em formato inválido.
                            </p>
                            <button 
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Fechar
                            </button>
                        </div>
                    ) : (
                        <div className="relative w-full h-full">
                            {isLoadingReport && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                                    <span>Carregando PDF...</span>
                                </div>
                            )}
                            <iframe
                                src={`${pdfUrl}#zoom=90`}
                                title="Relatório em PDF"
                                className="w-full max-w-full h-full"
                                referrerPolicy="no-referrer"
                                allow="fullscreen"
                                onError={handleIframeError}
                                onLoad={handleIframeLoad}
                            />
                        </div>
                    )}
                </div>
                <AlertDialogCancel className="mt-4 text-center">
                    Fechar
                </AlertDialogCancel>
            </AlertDialogContent>
        </AlertDialog>
    )
}
