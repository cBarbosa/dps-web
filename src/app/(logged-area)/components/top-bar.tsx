import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { BellIcon, MessageSquareTextIcon, SearchIcon } from 'lucide-react'
import React, { ReactNode } from 'react'
import { Session } from 'next-auth'
import AccountSection from './top-bar-account-section'
import { redirect } from 'next/navigation'

export type UserData = {
	name: string
	email: string
	image?: string | null
}

export function TopBar({ session }: { session: Session | null }) {
	if (!session) return // redirect('/login')

	const userData: UserData = {
		name: session.user!.name!,
		email: session.user!.email!,
		image: session.user!.image,
	}

	const notifications = [
		{
			title: 'Notificação 1',
			date: new Date(),
			description: 'Descrição da notificação 1',
		},
		{
			title: 'Notificação 2',
			date: new Date(),
			description: 'Descrição da notificação 2',
		},
	]

	return (
		<div className="flex h-[90px] w-full px-5 py-2 gap-8 justify-between items-center">
			<div className="basis-auto">
				<div className="text-xl font-black text-primary-dark">
					Bom dia, {userData.name}
				</div>
				<div className="text-sm text-muted-foreground capitalize">
					{new Date()
						.toLocaleDateString('pt-br', {
							weekday: 'short',
							day: 'numeric',
							month: 'short',
							year: 'numeric',
						})
						.replace('.', '')}
				</div>
			</div>
			<div className="grow">
				<Input
					className="px-8 py-6 rounded-2xl max-w-[530px]"
					placeholder="Pesquisar algo"
					icon={<SearchIcon className="text-primary" />}
					iconOffset={12}
				/>
			</div>
			<div className="basis-auto flex gap-3">
				<NewsButton icon={<BellIcon />} newsList={notifications} />
				<NewsButton icon={<MessageSquareTextIcon />} newsList={notifications} />
				<AccountSection userData={userData} />
			</div>
		</div>
	)
}

type News = { title: string; date: Date; description?: string }

function NewsButton({
	icon,
	newsList,
}: {
	icon: ReactNode
	newsList?: News[] | null
}) {
	'use client'

	return (
		<div className="relative">
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						className="relative rounded-full w-12 h-12 p-1 text-primary hover:text-primary active:ring-1 active:ring-primary/30"
					>
						{newsList != null && newsList.length > 0 && (
							<div className="absolute -top-1 -right-1 flex h-7 w-7 border-2 border-white items-center justify-center rounded-full bg-primary-dark text-xs font-base text-white">
								{newsList.length < 100 ? newsList.length : '99+'}
							</div>
						)}
						{icon}
						<span className="sr-only">View notifications</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="py-1 px-1.5 rounded-lg"
					collisionPadding={10}
				>
					{newsList != null && newsList.length > 0 ? (
						<ul className="divide-y">
							{newsList.map((n, i) => (
								<li key={i + n.title + n.date.toString()}>
									<Button
										variant="ghost"
										className="w-full h-auto py-1 px-2 my-0.5 active:ring-1 active:ring-primary/20"
									>
										<div className="w-full text-left">
											<div className="font-semibold text-primary-dark">
												{n.title}
											</div>
											<div className="text-sm text-muted-foreground">
												{n.description}
											</div>
										</div>
									</Button>
								</li>
							))}
						</ul>
					) : (
						'Sem notificações'
					)}
				</PopoverContent>
			</Popover>
		</div>
	)
}
