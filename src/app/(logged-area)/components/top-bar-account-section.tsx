'use client'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { AvatarFallback } from '@radix-ui/react-avatar'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { UserData } from './top-bar'
import { Button } from '@/components/ui/button'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import { SalesChannelModal } from '@/components/sales-channel-modal'
import { SalesChannel } from '@/types/sales-channel'
import { changeSalesChannel } from '@/app/(login-area)/actions'
import { useRouter } from 'next/navigation'

export default function AccountSection({ userData }: { userData: UserData }) {
	const { data: session, update } = useSession()
	const router = useRouter()
	const [showChannelModal, setShowChannelModal] = useState(false)
	const [isChangingChannel, setIsChangingChannel] = useState(false)

	const sessionWithToken = session as any
	const sessionChannels: SalesChannel[] = sessionWithToken?.channels || []
	const currentChannel: SalesChannel | null = sessionWithToken?.lastChannel || null
	const isAdmin = (userData?.role ?? '').toLowerCase() === 'admin'

	// Se channels tem itens, significa múltiplos canais (lastChannel + channels)
	// Se channels está vazio mas lastChannel existe, significa apenas 1 canal
	const hasMultipleChannels = sessionChannels.length > 0
	
	// Combinar canais para mostrar no modal (se houver múltiplos)
	const allChannels = hasMultipleChannels && currentChannel
		? [currentChannel, ...sessionChannels.filter(c => c.uid !== currentChannel.uid)]
		: sessionChannels

	const mustSelectChannel = useMemo(() => {
		// Para ADMIN, canal deve estar selecionado para evitar consultas “por empresa” sem restrição de canal
		return isAdmin && !currentChannel && allChannels.length > 0
	}, [isAdmin, currentChannel, allChannels.length])

	useEffect(() => {
		if (mustSelectChannel) {
			setShowChannelModal(true)
		}
	}, [mustSelectChannel])

	async function handleSelectChannel(channelUid: string) {
		if (!sessionWithToken?.accessToken) {
			console.error('Token não encontrado na sessão')
			return
		}

		// Verificar se o canal selecionado é diferente do atual
		if (currentChannel?.uid === channelUid) {
			setShowChannelModal(false)
			return
		}

		setIsChangingChannel(true)
		try {
			console.log('Trocando canal para:', channelUid)
			const result = await changeSalesChannel(sessionWithToken.accessToken, channelUid)
			console.log('Resposta do changeSalesChannel:', result)

			if (result?.success && result.data) {
				// Atualizar sessão com os novos dados retornados pelo backend
				// Isso inclui o novo accessToken, expires, role, channels e lastChannel
				await update({
					accessToken: result.data.accessToken,
					expires: result.data.expires,
					role: result.data.role,
					channels: result.data.userData.channels || [],
					lastChannel: result.data.userData.lastChannel || null,
				})
				// Aguardar um pouco para garantir que a sessão foi atualizada
				await new Promise(resolve => setTimeout(resolve, 100))
				// Fechar modal
				setShowChannelModal(false)
				// Redirecionar para dashboard e recarregar página completamente
				window.location.href = '/dashboard'
			} else {
				// Mostrar erro ao usuário
				console.error('Erro ao trocar canal:', result?.message || 'Erro desconhecido')
				alert(result?.message || 'Não foi possível trocar o canal. Tente novamente.')
			}
		} catch (error) {
			console.error('Erro ao trocar canal:', error)
			alert('Ocorreu um erro ao trocar o canal. Tente novamente.')
		} finally {
			setIsChangingChannel(false)
		}
	}

	return (
		<>
			<div className="flex ml-10 gap-3 items-center">
				<div className="text-right">
					<div className="text-sm font-bold text-primary-dark">
						{userData.name}
					</div>
					<div className="text-xs text-muted-foreground capitalize">
						{userData.role.toLowerCase()}
					</div>
					{currentChannel && (
						<div className="text-xs text-muted-foreground mt-1">
							Canal: {currentChannel.name}
						</div>
					)}
				</div>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="ghost"
							className="p-0 hover:cursor-pointer hover:ring-2 hover:ring-ring"
							asChild
						>
							<Avatar className="h-12 w-12 rounded-xl">
								<AvatarImage src="/static/images/avatar-pic.jpg" />
								<AvatarFallback>FS</AvatarFallback>
							</Avatar>
						</Button>
					</PopoverTrigger>

					<PopoverContent
						className="py-1 px-1.5 rounded-lg flex flex-col gap-1"
						sideOffset={10}
						collisionPadding={10}
						onInteractOutside={(e) => {
							// Não fechar se o modal de canal estiver aberto
							if (showChannelModal) {
								e.preventDefault()
							}
						}}
					>
						{hasMultipleChannels && (
							<Button
								variant="ghost"
								className="justify-start"
								onClick={(e) => {
									e.preventDefault()
									e.stopPropagation()
									setShowChannelModal(true)
								}}
							>
								Trocar Canal de Venda
							</Button>
						)}
						<Button
							className={userData.role === 'OFERTA' ? 'bg-bradesco' : ''}
							onClick={() => signOut()}
						>
							Sair
						</Button>
					</PopoverContent>
				</Popover>
			</div>

			<SalesChannelModal
				open={showChannelModal}
				onOpenChange={setShowChannelModal}
				channels={allChannels}
				currentChannel={currentChannel}
				onSelectChannel={handleSelectChannel}
				isLoading={isChangingChannel}
				title="Trocar Canal de Venda"
				description="Selecione o canal de venda que deseja acessar:"
				required={mustSelectChannel}
			/>
		</>
	)
}
