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
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import { postStatus } from '../actions'
import { Textarea } from '@/components/ui/textarea'

export default function NewInteractionDialog({
	token,
	uid,
	status,
	onSubmit: onSubmitProp,
}: {
	token: string
	uid: string
	status: number
	onSubmit?: () => void
}) {
	'use client'
	const [description, setDescription] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isOpen, setIsOpen] = useState(false)

	async function handleSubmit() {
		if (description.length < 0) return

		setIsLoading(true)

		const response = await postStatus(token, uid, status, description, 'MIP')

		console.log('post interaction', response)

		if (response) {
			if (response.success) {
				setIsLoading(false)
				setIsOpen(false)
				setDescription('')
				onSubmitProp?.()
			} else {
				console.error(response.message)
			}
		}
	}

	function toggleDialog() {
		setIsOpen(prev => !prev)
	}
	return (
		<Dialog open={isOpen} onOpenChange={toggleDialog}>
			<Button
				variant="secondary"
				size="sm"
				className="p-2 h-7"
				onClick={toggleDialog}
			>
				<PlusIcon className="mr-2" size={12} /> Nova interação
			</Button>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Solicitar novo complemento</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<Label htmlFor="description">Descreva a nova interação:</Label>
					{/* <Input
						id="description"
						placeholder="Descrição da interação"
						className="col-span-3"
						onChange={e => setDescription(e.target.value)}
					/> */}
					<Textarea
						id="description"
						placeholder="Descrição da interação"
						className="col-span-3 max-h-96"
						onChange={e => setDescription(e.target.value)}
						value={description}
					/>
				</div>
				<DialogFooter>
					<Button
						variant={`outline`}
						type="button"
						onClick={() => setDescription('')}
					>
						Limpar
					</Button>
					<Button
						type="submit"
						disabled={isLoading || description.length <= 0}
						onClick={handleSubmit}
					>
						Adicionar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
