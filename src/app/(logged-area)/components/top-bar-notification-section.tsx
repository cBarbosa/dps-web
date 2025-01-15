import { Button } from '@/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { BellIcon, MessageSquareTextIcon } from 'lucide-react'
import { getNotifications, setNotificationsRead } from '../actions'
import { useSession } from 'next-auth/react'

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
		messages: News[] | null
	}>({
		news: [],
		messages: [],
	})

	const fetchNotifications = useCallback(async () => {
		const notifications = await getNotifications(token, 1, 10)

		if (notifications?.success === false) {
			return setNotifications({
				news: [],
				messages: [],
			})
		}

		if (notifications) {
			setNotifications({
				news: notifications.data.items.map(item => {
					const message = item.message
					const title = message.substring(0, message.indexOf(','))
					const description = message.substring(message.indexOf(',') + 1)

					return {
						id: item.id,
						title,
						description,
						date: new Date(item.created),
					}
				}),
				messages: [],
			})
		}
	}, [token])

	useEffect(() => {
		if (enablePooling) {
			const poolingInterval = 60 * 1000 // 60 seconds

			const interval = setInterval(() => {
				fetchNotifications()
			}, poolingInterval)

			return () => clearInterval(interval)
		}

		fetchNotifications()
	}, [enablePooling, fetchNotifications])

	function onNewsClose() {
		setNotificationsRead(
			token,
			notifications.news?.map(item => item.id) ?? []
		).then(() => {
			fetchNotifications()
		})
	}

	return (
		<>
			<NotificationButton
				icon={<BellIcon />}
				onClose={onNewsClose}
				newsList={notifications.news}
			/>
			<NotificationButton
				icon={<MessageSquareTextIcon />}
				newsList={notifications.messages}
			/>
		</>
	)
}

function NotificationButton({
	icon,
	newsList,
	onClose,
}: {
	icon: ReactNode
	newsList?: News[] | null
	onClose?: () => void
}) {
	'use client'

	const newsCount = newsList?.length

	return (
		<div className="relative">
			<Popover onOpenChange={open => !open && onClose?.()}>
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
				<PopoverContent
					className="p-1 rounded-lg max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar"
					collisionPadding={10}
				>
					{newsList != null && newsList.length > 0 ? (
						<ul className="divide-y">
							{newsList.map((n, i) => (
								<li
									key={i + n.title + n.date.toString()}
									className=" *:first:rounded-t-md *:last:rounded-b-md"
								>
									<Button
										variant="ghost"
										className="w-full h-auto p-1 rounded-none active:ring-1 active:ring-primary/20"
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
		</div>
	)
}
