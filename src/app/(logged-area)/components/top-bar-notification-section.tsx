import { Button } from '@/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { BellIcon, MessageSquareTextIcon } from 'lucide-react'
import { getNotifications, setNotificationRead } from '../actions'
import { useSession } from 'next-auth/react'
import DialogAlertComp from '@/components/ui/alert-dialog-comp'

type News = { id: number; title: string; date: Date; description?: string }

export function NotificationSection({
	enablePooling = false,
}: {
	enablePooling?: boolean
}) {
	const session = useSession()
	const token = (session.data as any)?.accessToken

	const [notifications, setNotifications] = useState<{
		news: News[] | null
		newsTotal: number
		messages: News[] | null
		messagesTotal: number
	}>({
		news: [],
		newsTotal: 0,
		messages: [],
		messagesTotal: 0,
	})

	const [dialogControl, setDialogControl] = useState<{
		open: boolean
		title: string
		body: ReactNode
	}>({
		open: false,
		title: '',
		body: '',
	})

	function setDialogOpen(open: boolean) {
		setDialogControl(prev => ({
			...prev,
			open,
		}))
	}

	function setDialogContent(title: string, body: ReactNode) {
		setDialogControl(prev => ({
			...prev,
			title,
			body,
		}))
	}

	const fetchNotifications = useCallback(async () => {
		// Não faz requisição se o token não estiver disponível
		if (!token) {
			return
		}

		try {
			const notifications = await getNotifications(token)

			if (notifications?.success === false) {
				return setNotifications({
					news: [],
					newsTotal: 0,
					messages: [],
					messagesTotal: 0,
				})
			}

			if (notifications) {
				const newsItems = notifications.data.items.map(item => {
					const message = item.message
					const title = message.substring(0, message.indexOf(','))
					const description = message.substring(message.indexOf(',') + 1)

					return {
						id: item.id,
						title,
						description,
						date: new Date(item.created),
					}
				})
				
				setNotifications({
					news: newsItems,
					newsTotal: notifications.data.totalItems,
					messages: [],
					messagesTotal: 0,
				})
			}
		} catch (error) {
			console.error('Erro ao buscar notificações:', error)
			// Mantém o estado atual em caso de erro
		}
	}, [token])

	useEffect(() => {
		// Só executa se o token estiver disponível e a sessão estiver carregada
		if (session.status === 'loading' || !token) {
			return
		}

		if (enablePooling) {
			const poolingInterval = 60 * 1000 // 60 seconds

			const interval = setInterval(() => {
				fetchNotifications()
			}, poolingInterval)

			return () => clearInterval(interval)
		}

		fetchNotifications()
	}, [enablePooling, fetchNotifications, session.status, token])

	async function onNewsRead(
		id: number,
		date: Date,
		title: string,
		description?: string
	) {
		// Não faz nada se o token não estiver disponível
		if (!token) {
			console.error('Token não disponível para marcar notificação como lida')
			return
		}

		const body = (
			<div className="flex flex-col gap-2">
				<p className="text-gray-500">{description}</p>
				<p>{date.toLocaleString('pt-BR')}</p>
			</div>
		)

		setDialogControl({
			open: true,
			title,
			body,
		})

		try {
			const result = await setNotificationRead(token, id)
			
			// Sempre atualiza a lista após tentar marcar como lida
			// A API deve retornar apenas notificações não lidas
			await fetchNotifications()
		} catch (error) {
			console.error('Erro ao marcar notificação como lida:', error)
			// Tenta atualizar mesmo assim para sincronizar
			fetchNotifications()
		}
	}

	async function onMessageRead(
		id: number,
		date: Date,
		title: string,
		description?: string
	) {
		// Não faz nada se o token não estiver disponível
		if (!token) {
			console.error('Token não disponível para marcar notificação como lida')
			return
		}

		const body = (
			<div className="flex flex-col gap-2">
				<p className="text-gray-500">{description}</p>
				<p>{date.toLocaleString('pt-BR')}</p>
			</div>
		)

		setDialogControl({
			open: true,
			title,
			body,
		})

		try {
			const result = await setNotificationRead(token, id)
			
			// Sempre atualiza a lista após tentar marcar como lida
			// A API deve retornar apenas notificações não lidas
			await fetchNotifications()
		} catch (error) {
			console.error('Erro ao marcar notificação como lida:', error)
			// Tenta atualizar mesmo assim para sincronizar
			fetchNotifications()
		}
	}

	return (
		<>
			<NotificationButton
				icon={<BellIcon />}
				newsList={notifications.news}
				newsTotal={notifications.newsTotal}
				onClose={fetchNotifications}
				onRead={onNewsRead}
			/>
			<NotificationButton
				icon={<MessageSquareTextIcon />}
				newsList={notifications.messages}
				newsTotal={notifications.messagesTotal}
				onClose={fetchNotifications}
				onRead={onMessageRead}
			/>
			<DialogAlertComp
				open={dialogControl.open}
				onOpenChange={setDialogOpen}
				title={dialogControl.title}
			>
				{dialogControl.body}
			</DialogAlertComp>
		</>
	)
}

function NotificationButton({
	icon,
	newsList,
	newsTotal,
	onClose,
	onRead,
}: {
	icon: ReactNode
	newsList?: News[] | null
	newsTotal?: number
	onClose?: () => void
	onRead?: (id: number, date: Date, title: string, description?: string) => void
}) {
	'use client'

	const newsCount = newsTotal ?? newsList?.length


	const tooltipText = newsCount != null && newsCount > 0 
		? `${newsCount} ${newsCount === 1 ? 'notificação' : 'notificações'}`
		: 'Sem notificações'

	return (
		<div className="relative">
			<TooltipProvider>
				<Tooltip>
					<Popover onOpenChange={open => !open && onClose?.()}>
						<TooltipTrigger asChild>
							<PopoverTrigger asChild>
								<Button
									variant="ghost"
									className="relative rounded-full w-12 h-12 p-1 text-primary hover:text-primary active:ring-1 active:ring-primary/30"
								>
									{newsCount != null && newsCount > 0 && (
										<div className="absolute -top-1 -right-1 flex h-7 w-7 border-2 border-white items-center justify-center rounded-full bg-primary-dark text-xs font-base text-white">
											{newsCount < 100 ? newsCount : '99+'}
										</div>
									)}
									{icon}
									<span className="sr-only">View notifications</span>
								</Button>
							</PopoverTrigger>
						</TooltipTrigger>
						<TooltipContent>
							<p>{tooltipText}</p>
						</TooltipContent>
						<PopoverContent
							className="p-1 rounded-lg max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar"
							collisionPadding={10}
						>
							{newsList != null && newsList.length > 0 ? (
								<ul className="divide-y">
									{newsList.map((n, i) => (
										<li
											key={n.id + i + n.title + n.date.toString()}
											className=" *:first:rounded-t-md *:last:rounded-b-md"
										>
											<Button
												variant="ghost"
												className="w-full h-auto p-1 rounded-none active:ring-1 active:ring-primary/20"
												onClick={
													onRead
														? () => onRead(n.id, n.date, n.title, n.description)
														: undefined
												}
											>
												<div className="w-full text-left">
													<div className="font-semibold text-primary-dark text-wrap">
														{n.title}
													</div>
													<div className="text-sm text-gray-600 text-wrap">
														{n.description}
													</div>
												</div>
											</Button>
										</li>
									))}
								</ul>
							) : (
								<div className="text-center text-sm text-muted-foreground">
									Sem notificações
								</div>
							)}
						</PopoverContent>
					</Popover>
				</Tooltip>
			</TooltipProvider>
		</div>
	)
}
