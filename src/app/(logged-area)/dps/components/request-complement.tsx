'use client'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import { postStatus } from '../actions'
import { Textarea } from '@/components/ui/textarea'

const RequestComplement = ({
	token,
	proposalUid,
	onSubmit: onSubmitProp,
}: {
	token: string
	proposalUid: string
	onSubmit?: () => void
}) => {
	const [isLoading, setIsLoading] = useState(false)
	const [isOpen, setIsOpen] = useState(false)
	const [message, setMessage] = useState<string>('')
	const [error, setError] = useState<string | undefined>(undefined)

	async function handleSubmit() {
		if (message === '') {
			setError('Preencha o campo de descrição')
			return
		}

		setIsLoading(true)

		const resStatus = await postStatus(
			token,
			proposalUid,
			5,
			'Solicitação: ' + message,
			'MIP'
		)
		console.log('request complement', resStatus)

		if (resStatus) {
			if (resStatus.success) {
				setIsOpen(false)
				setMessage('')
				setError(undefined)
				onSubmitProp?.()
			} else {
				setError(resStatus.message)
				console.error(resStatus.message)
			}
		} else {
			let errorMessage = ''
			if (!resStatus) errorMessage += 'Envio falhou\n'
			setError(errorMessage)
		}

		setIsLoading(false)
	}

	function toggleDialog() {
		setIsOpen(prev => !prev)
	}

	return (
		<Dialog open={isOpen} onOpenChange={toggleDialog}>
			<Button variant="outline" onClick={toggleDialog}>
				<PlusIcon size={14} className="mr-2" />
				Solicitar complementos
			</Button>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Solicitar complementos</DialogTitle>
				</DialogHeader>
				<div>
					<Label htmlFor="description">Informe o complemento solicitado:</Label>
					<Textarea
						id="description"
						placeholder="Descrição da solicitação"
						className="col-span-3 max-h-96"
						onChange={e => setMessage(e.target.value)}
						value={message}
					/>{' '}
					{error && <p className="text-sm text-red-500">{error}</p>}
				</div>
				<DialogFooter>
					<Button
						variant={`outline`}
						type="button"
						onClick={() => setMessage('')}
					>
						Limpar
					</Button>
					<Button
						type="submit"
						disabled={isLoading || message === ''}
						onClick={handleSubmit}
					>
						Solicitar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default RequestComplement
