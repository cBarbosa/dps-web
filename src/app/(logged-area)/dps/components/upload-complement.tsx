'use client'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SendIcon } from 'lucide-react'
import {
	postAttachmentFile,
	postStatus
} from '../actions';
import { getBase64 } from '@/lib/utils'
import FileInput from '@/components/ui/file-input'
import { Textarea } from '@/components/ui/textarea'

const UploadComplement = ({
	token,
	proposalUid,
	interactionDescription,
	onSubmit: onSubmitProp,
}: {
	token: string
	proposalUid: string
	interactionDescription: string
	onSubmit?: () => void
}) => {
	const [isLoading, setIsLoading] = useState(false)
	const [isOpen, setIsOpen] = useState(false)
	const [message, setMessage] = useState<string>('')
	const [file, setFile] = useState<File | undefined>(undefined)
	const [error, setError] = useState<string | undefined>(undefined)

	function handleSelectFile(file: File) {
		if (file) {
			setFile(file)
		}
	}

	async function handleSubmit() {
		if (message === '') return

		setIsLoading(true)

		const postMessageData = {
			statusId: 4,
			Description: 'Complemento: ' + interactionDescription + '. \n' + message,
		}

		if (file) {
			const fileBase64 = (await getBase64(file)) as string

			const postFileData = {
				documentName: file.name,
				description: 'Complemento: ' + interactionDescription,
				stringBase64: fileBase64.split(',')[1],
			}

			console.log('uploading', postFileData)

			const [resAttachment, resStatus] = await Promise.all([
				postAttachmentFile(token, proposalUid, postFileData),
				postStatus(
					token,
					proposalUid,
					postMessageData.statusId,
					postMessageData.Description
				),
			])

			console.log('post file', resAttachment)
			console.log('post message', resStatus)

			if (resAttachment && resStatus) {
				if (resAttachment.success && resStatus.success) {
					setIsLoading(false)
					setIsOpen(false)
					setFile(undefined)
					setMessage('')
					onSubmitProp?.()
				} else {
					setIsLoading(false)
					setError(resAttachment.message)
					console.error(resAttachment.message, resStatus.message)
				}
			} else {
				setIsLoading(false)
				let errorMessage = ''
				if (!resAttachment) errorMessage += 'Upload falhou\n'
				if (!resStatus) errorMessage += 'Mudança de status falhou'
				setError(errorMessage)
			}
		} else {
			const response = await postStatus(
				token,
				proposalUid,
				postMessageData.statusId,
				postMessageData.Description
			)

			console.log('post message', response)

			if (response) {
				if (response.success) {
					setIsLoading(false)
					setIsOpen(false)
					setFile(undefined)
					setMessage('')
					onSubmitProp?.()
				} else {
					setIsLoading(false)
					setError(response.message)
					console.error(response.message)
				}
			} else {
				setIsLoading(false)
				setError('Upload falhou')
			}
		}
	}

	function toggleDialog() {
		setIsOpen(prev => !prev)
	}

	return (
		<Dialog open={isOpen} onOpenChange={toggleDialog}>
			<Button size="sm" onClick={toggleDialog}>
				<SendIcon size={14} className="mr-2" />
				Enviar complemento
			</Button>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Envio de complemento</DialogTitle>
				</DialogHeader>
				<div>
					<Label htmlFor="description">Descreva o complemento:</Label>
					<Textarea
						id="description"
						placeholder="Descrição da interação"
						className="col-span-3 max-h-96"
						onChange={e => setMessage(e.target.value)}
						value={message}
					/>
				</div>
				<div>
					<Label>
						Anexe o complemento:{' '}
						<span className="text-xs text-muted-foreground">(opcional)</span>
					</Label>
					<FileInput
						id="complement"
						accept="application/pdf"
						wrapperClassName=" w-full"
						disabled={isLoading}
						onChange={handleSelectFile as any}
						value={file}
						// afterChange={handleAttachmentAfterChange}
					/>
					{error && <p className="text-sm text-red-500">{error}</p>}
				</div>
				<DialogFooter>
					<Button
						variant={`outline`}
						type="button"
						onClick={() => [setFile(undefined), setMessage('')]}
					>
						Limpar
					</Button>
					<Button
						type="submit"
						disabled={isLoading || message === ''}
						onClick={handleSubmit}
					>
						Adicionar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default UploadComplement
