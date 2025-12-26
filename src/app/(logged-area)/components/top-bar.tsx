'use client'
import { Input } from '@/components/ui/input'
import { ListFilterIcon, SearchIcon } from 'lucide-react'
import React, { useState } from 'react'
import { Session } from 'next-auth'
import AccountSection from './top-bar-account-section'
import { useRouter } from 'next/navigation'
import { NotificationSection } from './top-bar-notification-section'
import { Button } from '@/components/ui/button'
import { 
	Popover,
	PopoverContent,
	PopoverTrigger 
} from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

export type UserData = {
	name: string
	email: string
	image?: string | null
	role: string
}

export function TopBar({ session }: { session: Session | null }) {
	const router = useRouter()
	const [searchType, setSearchType] = useState<'cpf' | 'operation'>('cpf')

	if (!session) return // redirect('/login')

	const userData: UserData = {
		name: session.user!.name!,
		email: session.user!.email!,
		image: session.user!.image,
		role: (session as any).role,
	}

	function searchCpf(formData: FormData) {
		const searchValue = formData.get('searchValue')?.toString() || ''
		const searchTypeValue = formData.get('searchType')?.toString() || 'cpf'

		if (searchTypeValue === 'cpf') {
			const cpf = searchValue.replace(/[^\d]/g, '')
			if (cpf && cpf.length < 11) {
				return
			}
			router.push(`/dashboard/table?cpf=${cpf}&view=participacoes`)
		} else if (searchTypeValue === 'operation') {
			if (!searchValue) {
				return
			}
			router.push(`/dashboard/table?operation=${encodeURIComponent(searchValue)}&view=operacoes`)
		}
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
			<div className="grow flex items-center gap-3">
				<form action={searchCpf} className="flex items-center gap-3">
					<Input
						name="searchValue"
						className="px-8 py-6 rounded-2xl max-w-[530px]"
						placeholder={searchType === 'cpf' ? "Pesquisar CPF" : "Pesquisar Nº Operação"}
						icon={<SearchIcon className="text-primary" />}
						iconOffset={12}
						mask={searchType === 'cpf' ? "999.999.999-99" : undefined}
						maxLength={searchType === 'operation' ? 20 : undefined}
						type={searchType === 'operation' ? 'number' : 'text'}
					/>
					<input type="hidden" name="searchType" value={searchType} />
					<Popover>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="round"
								className="w-10 h-10 p-0 text-muted-foreground bg-gray-150 hover:bg-gray-200"
							>
								<ListFilterIcon size={20} />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80">
							<div className="space-y-2">
								<h4 className="font-medium leading-none">Tipo de Pesquisa</h4>
								<RadioGroup 
									defaultValue="cpf" 
									className="gap-2"
									value={searchType}
									onValueChange={(value) => setSearchType(value as 'cpf' | 'operation')}
								>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="cpf" id="cpf-topbar" />
										<Label htmlFor="cpf-topbar">CPF</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="operation" id="operation-topbar" />
										<Label htmlFor="operation-topbar">Número de Operação</Label>
									</div>
								</RadioGroup>
							</div>
						</PopoverContent>
					</Popover>
				</form>
			</div>
			<div className="basis-auto flex gap-3">
				<NotificationSection />
				<AccountSection userData={userData} />
			</div>
		</div>
	)
}
