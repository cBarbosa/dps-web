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
	HandshakeIcon,
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
	const role = session?.data?.role?.toLowerCase() as Lowercase<ApiRoles>

	return (
		<div className="flex flex-col justify-between w-full h-full p-4">
			<div>
				<div className="w-full flex flex-row justify-between items-center gap-3">
					<Image
						src={`/static/images/${
							// role === Role.OFERTA ? 'bradesco-logo' : 'app-logo-green' //TODO trocar em breve
							'app-logo-green'
						}.png`}
						width={role === Role.OFERTA ? '221' : '153'}
						height={role === Role.OFERTA ? '42' : '45'}
						alt="Subscrição Inteligente Logo"
					/>
					<ArrowLeftFromLineIcon className="text-primary-dark" />
				</div>

				<h4 className="mt-8 mb-6 mx-3 font-semibold text-sm text-muted-foreground">
					MAIN MENU
				</h4>

				<Accordion type="multiple" defaultValue={['DPS', 'Backup']}>
					<ul>
						<RoleBasedRender role={role} disallowedRoles={[Role.OFERTA]}>
							<MenuItem href="/dashboard" Icon={LayoutDashboardIcon}>
								Dashboard
							</MenuItem>
						</RoleBasedRender>
						<RoleBasedRender role={role} allowedRoles={[Role.OFERTA]}>
							<MenuItem href="/home" Icon={LayoutDashboardIcon}>
								Home
							</MenuItem>
						</RoleBasedRender>
						<RoleBasedRender role={role} allowedRoles={[Role.OFERTA]}>
							<MenuItem href="/offer" Icon={HandshakeIcon}>
								Oferta Personalizada
							</MenuItem>
						</RoleBasedRender>
						<RoleBasedRender role={role} disallowedRoles={[Role.OFERTA]}>
							<MenuSection title="Seg. Habitacional" Icon={FileTextIcon}>
								<RoleBasedRender role={role} allowedRoles={[Role.VENDEDOR]}>
									<MenuItem href="/dps/fill-out">Preencher DPS</MenuItem>
								</RoleBasedRender>
								<RoleBasedRender role={role} allowedRoles={[Role.SUBSCRITOR]}>
									<MenuItem href="/dps/subscription">Subscrição</MenuItem>
								</RoleBasedRender>
								<RoleBasedRender
									role={role}
									allowedRoles={[Role.SUBSCRITOR_MED]}
								>
									<MenuItem href="/dps/subscription-med">
										Subscrição Med
									</MenuItem>
								</RoleBasedRender>
								<RoleBasedRender role={role} allowedRoles={[Role.VENDEDOR_SUP]}>
									<MenuItem href="/dps/saler-sup">Reanálise Vendedor</MenuItem>
								</RoleBasedRender>
								<RoleBasedRender
									role={role}
									allowedRoles={[Role.SUBSCRITOR_SUP]}
								>
									<MenuItem href="/dps/subscription-review">Revisão do processo</MenuItem>
									<MenuItem href="/dps/subscription-sup">Reanálise Subscritor</MenuItem>
								</RoleBasedRender>
								<MenuItem href="/dashboard/table">Lista Completa</MenuItem>
							</MenuSection>
						</RoleBasedRender>
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
	disallowedRoles,
	role,
}:
	| {
			children: React.ReactNode
			allowedRoles: ApiRoles[]
			disallowedRoles?: never
			role: ApiRoles | undefined
	  }
	| {
			children: React.ReactNode
			allowedRoles?: never
			disallowedRoles: ApiRoles[]
			role: ApiRoles | undefined
	  }) {
	if (!role) return null

	role = role.toLowerCase() as ApiRoles

	if (
		allowedRoles &&
		allowedRoles.includes(Role.OFERTA) &&
		role !== Role.OFERTA
	) {
		return null
	}

	if (
		role === 'admin' ||
		allowedRoles?.includes(role) ||
		(disallowedRoles && !disallowedRoles.includes(role))
	) {
		return children
	}

	return null
}
