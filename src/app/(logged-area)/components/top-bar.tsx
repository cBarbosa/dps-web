'use client'
import { Input } from '@/components/ui/input'
import { SearchIcon } from 'lucide-react'
import React from 'react'
import { Session } from 'next-auth'
import AccountSection from './top-bar-account-section'
import { useRouter } from 'next/navigation'
import { NotificationSection } from './top-bar-notification-section'

export type UserData = {
	name: string
	email: string
	image?: string | null
	role: string
}

export function TopBar({ session }: { session: Session | null }) {
	const router = useRouter()

	if (!session) return // redirect('/login')

	const userData: UserData = {
		name: session.user!.name!,
		email: session.user!.email!,
		image: session.user!.image,
		role: (session as any).role,
	}

	function searchCpf(formData: FormData) {
		const cpfRaw = formData.get('cpf')

		//remove special characters
		const cpf = cpfRaw?.toString().replace(/[^\d]/g, '')

		if (cpf && cpf?.length < 11) {
			return
		}

		router.push(`/dashboard/table?cpf=${cpf}`)

		console.log(cpf)
	}

	const notifications = undefined

	return (
		<div className="relative flex h-[90px] w-full px-5 py-2 gap-8 justify-between items-center">
			<div className="basis-auto">
				<div className="text-xl font-black text-primary-dark">
					Olá, {userData.name}
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
				<form action={searchCpf}>
					<Input
						name="cpf"
						className="px-8 py-6 rounded-2xl max-w-[530px]"
						placeholder="Pesquisar CPF"
						icon={<SearchIcon className="text-primary" />}
						iconOffset={12}
						mask="999.999.999-99"
					/>
				</form>
			</div>
			<div className="basis-auto flex gap-3">
				<NotificationSection />
				<AccountSection userData={userData} />
			</div>
		</div>
	)
}
