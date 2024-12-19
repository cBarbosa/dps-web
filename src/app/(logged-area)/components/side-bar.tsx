'use client'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import {
	ArrowLeftFromLineIcon,
	FilesIcon,
	FileTextIcon,
	LayoutDashboardIcon,
	SettingsIcon,
} from 'lucide-react'
import Image from 'next/image'
import React from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useSessionAuthorization from '@/hooks/useSessionAuthorization'
import {
	ApiRoles,
	ApiRoleEnum as Role,
} from '@/hooks/getServerSessionAuthorization'

export default function SideBar() {
	const { session } = useSessionAuthorization()
	const role = session?.data?.role

	return (
		<div className="flex flex-col justify-between w-full h-full p-4">
			<div>
				<div className="w-full flex flex-row justify-between items-center gap-3">
					<Image
						src="/static/images/app-logo.png"
						width="153"
						height="45"
						alt="DPS Inteligente Logo"
					/>
					<ArrowLeftFromLineIcon className="text-primary-dark" />
				</div>

				<h4 className="mt-8 mb-6 mx-3 font-semibold text-sm text-muted-foreground">
					MAIN MENU
				</h4>

				<Accordion type="multiple" defaultValue={['DPS', 'Backup']}>
					<ul>
						<MenuItem href="/dashboard" Icon={LayoutDashboardIcon}>
							Dashboard
						</MenuItem>
						<MenuSection title="DPS" Icon={FileTextIcon}>
							<RoleBasedRender role={role} allowedRoles={[Role.VENDEDOR]}>
								<MenuItem href="/dps/fill-out">Preencher DPS</MenuItem>
							</RoleBasedRender>
							<RoleBasedRender role={role} allowedRoles={[Role.SUBSCRITOR]}>
								<MenuItem href="/dps/subscription">Subscrição</MenuItem>
							</RoleBasedRender>
							<RoleBasedRender role={role} allowedRoles={[Role.SUBSCRITOR_MED]}>
								<MenuItem href="/dps/subscription-med">Subscrição Med</MenuItem>
							</RoleBasedRender>
							<MenuItem href="/dashboard/table">Lista Completa</MenuItem>
						</MenuSection>
						{/* <MenuSection title="Backup" Icon={SaveIcon}>
							<MenuItem href="/">Realizar Backup</MenuItem>
							<MenuItem href="/">Listar Backups</MenuItem>
						</MenuSection>
						<MenuItem href="/" Icon={NotebookPenIcon}>
							Formulários
						</MenuItem> */}
						{/* <MenuItem href="/settings" Icon={SettingsIcon}>
							Configurações
						</MenuItem> */}
					</ul>
				</Accordion>
			</div>
			<div className="font-semibold text-sm text-center text-muted-foreground">
				<Link href="https://techtrailoficial.com.br">
					Techtrail {new Date().getFullYear()}
				</Link>
			</div>
		</div>
	)
}

function MenuSection({
	title,
	children,
	Icon,
}: {
	title: string
	Icon?: React.FC<any>
	children: React.ReactNode
}) {
	return (
		<li className="my-1">
			<AccordionItem value={title} className="border-none">
				<AccordionTrigger className="text-base text-primary py-2 px-4 rounded-3xl font-normal hover:no-underline hover:bg-muted">
					<div className="inline-flex items-center justify-start gap-2">
						{Icon && <Icon size={20} />}
						{title}
					</div>
				</AccordionTrigger>
				<AccordionContent className="ml-7 pb-0">
					<ul>{children}</ul>
				</AccordionContent>
			</AccordionItem>
		</li>
	)
}

function MenuItem({
	children,
	href,
	Icon,
}: {
	href: string
	children: React.ReactNode
	Icon?: React.FC<any>
}) {
	const path = usePathname()

	const isActive = path === href

	return (
		<li className="my-1">
			<Link
				href={href}
				className={cn(
					'inline-flex items-center justify-start gap-2 w-full py-2 px-4 rounded-3xl text-base font-normal text-primary hover:bg-muted',
					isActive ? 'bg-primary/10' : ''
				)}
			>
				{Icon && <Icon size={20} />}
				{children}
			</Link>
		</li>
	)
}

function RoleBasedRender({
	children,
	allowedRoles,
	role,
}: {
	children: React.ReactNode
	allowedRoles: ApiRoles[]
	role: ApiRoles | undefined
}) {
	if (!role) return null

	role = role.toLowerCase() as ApiRoles

	if (role === 'admin' || allowedRoles.includes(role)) {
		return children
	}

	return null
}
