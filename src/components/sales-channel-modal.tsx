'use client'

import { useState, useEffect } from 'react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SalesChannel } from '@/types/sales-channel'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type SalesChannelModalProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	channels: SalesChannel[]
	currentChannel: SalesChannel | null
	onSelectChannel: (channelUid: string) => Promise<void>
	isLoading?: boolean
	title?: string
	description?: string
	required?: boolean // Se true, não permite fechar sem selecionar
}

export function SalesChannelModal({
	open,
	onOpenChange,
	channels,
	currentChannel,
	onSelectChannel,
	isLoading = false,
	title = 'Selecione o Canal de Venda',
	description = 'Escolha o canal de venda que deseja acessar:',
	required = false,
}: SalesChannelModalProps) {
	const [selectedChannelUid, setSelectedChannelUid] = useState<string>(
		currentChannel?.uid || ''
	)
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Garantir z-index alto quando required
	useEffect(() => {
		if (required && open) {
			// Adicionar estilos globais para garantir z-index alto
			const style = document.createElement('style')
			style.textContent = `
				[data-radix-dialog-overlay] {
					z-index: 9998 !important;
				}
				[data-radix-dialog-content] {
					z-index: 9999 !important;
				}
			`
			document.head.appendChild(style)
			return () => {
				document.head.removeChild(style)
			}
		}
	}, [required, open])

	const handleConfirm = async () => {
		if (!selectedChannelUid) return

		setIsSubmitting(true)
		try {
			await onSelectChannel(selectedChannelUid)
			onOpenChange(false)
		} catch (error) {
			console.error('Erro ao selecionar canal:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleCancel = () => {
		if (!required) {
			onOpenChange(false)
		}
	}

	// Se required, não permite fechar clicando fora ou no X
	const handleOpenChange = (newOpen: boolean) => {
		if (!required || !newOpen) {
			onOpenChange(newOpen)
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
			<DialogContent 
				className={cn(
					"sm:max-w-[500px]",
					required && "[&>button]:hidden" // Esconde o botão X quando required
				)}
				onInteractOutside={(e) => {
					if (required) {
						e.preventDefault()
					}
				}}
				onEscapeKeyDown={(e) => {
					if (required) {
						e.preventDefault()
					}
				}}
			>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					<RadioGroup
						value={selectedChannelUid}
						onValueChange={setSelectedChannelUid}
						className="space-y-3"
					>
						{channels.map((channel) => (
							<div
								key={channel.uid}
								className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent"
							>
								<RadioGroupItem
									value={channel.uid}
									id={channel.uid}
								/>
								<Label
									htmlFor={channel.uid}
									className="flex-1 cursor-pointer font-normal"
								>
									<div className="font-medium">{channel.name}</div>
									{channel.description && (
										<div className="text-sm text-muted-foreground">
											{channel.description}
										</div>
									)}
									{currentChannel?.uid === channel.uid && (
										<div className="text-xs text-primary font-medium mt-1">
											Canal atual
										</div>
									)}
								</Label>
							</div>
						))}
					</RadioGroup>
				</div>

				<DialogFooter>
					{!required && (
						<Button
							variant="outline"
							onClick={handleCancel}
							disabled={isSubmitting || isLoading}
						>
							Cancelar
						</Button>
					)}
					<Button
						onClick={handleConfirm}
						disabled={!selectedChannelUid || isSubmitting || isLoading}
						className={required ? "w-full" : ""}
					>
						{isSubmitting || isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Carregando...
							</>
						) : (
							'Confirmar'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

