'use client'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { GoBackButton } from '@/components/ui/go-back-button'
import { Progress } from '@/components/ui/progress'
import {
	AlertTriangleIcon,
	CalendarIcon,
	CarIcon,
	CheckIcon,
	ChevronDownIcon,
	ChevronsUpDownIcon,
	ChevronUpIcon,
	CircleArrowOutUpRightIcon,
	HandshakeIcon,
	HouseIcon,
	MailIcon,
	SmartphoneIcon,
	Undo2Icon,
	UserRoundIcon,
	WalletIcon,
	XIcon,
} from 'lucide-react'
import Link from 'next/link'
import React, { use, useContext, useEffect, useState } from 'react'
import { CatalogCardViva } from './cards'
import { Theme, ThemeContext } from '@/components/theme-provider'

function OfferProfile({ uid, token }: { uid: string; token: string }) {
	const themeContext = useContext(ThemeContext)

	const [offerProfileData, setOfferProfileData] = useState<any>(null)

	useEffect(() => {
		themeContext.setTheme(Theme.Bradesco)
	}, [themeContext])

	return (
		<div className="p-5">
			<div className="px-7 py-7 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<GoBackButton className="pl-0">
					<Undo2Icon className="mr-2" />
					Voltar
				</GoBackButton>

				<div className="px-3 flex justify-between gap-5 mb-7">
					<div>
						<h5 className="text-xl my-4">
							Fulano de Tal da Silva de Oliveira Junior
						</h5>

						<div className="flex gap-5">
							<div className="flex flex-nowrap gap-2">
								<CalendarIcon className="text-bradesco" />
								<span className="text-muted-foreground">01/01/1980</span>
							</div>
							<div className="flex flex-nowrap gap-2">
								<UserRoundIcon className="text-bradesco" />
								<span className="text-muted-foreground">154.254.878-98</span>
							</div>
							<div className="flex flex-nowrap gap-2">
								<CircleArrowOutUpRightIcon className="text-bradesco" />
								<span className="text-muted-foreground">Masculino</span>
							</div>
						</div>

						<ul className="list-image-rounded-square-red ml-6 mt-6 [&>li]:mb-1">
							<li>
								Profissão:{' '}
								<span className="text-muted-foreground">123305 - Diretor</span>
							</li>
							<li>
								Nome da Mãe:{' '}
								<span className="text-muted-foreground">
									Fulana da Silva de Oliveira
								</span>
							</li>
							<li>
								Estado Civil:{' '}
								<span className="text-muted-foreground">Casado(a)</span>
							</li>
						</ul>
					</div>

					<div className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-muted">
						<h5 className="text-lg">Dados de Contato</h5>
						<div className="flex flex-nowrap gap-2 text-muted-foreground">
							<SmartphoneIcon className="text-bradesco" />
							(99) 9 9999-9999
						</div>
						<div className="flex flex-nowrap gap-2 text-muted-foreground">
							<MailIcon className="text-bradesco" />
							emaildofulano@gmail.com
						</div>
					</div>
				</div>

				<PerfilConsumo />

				<PerfilCompra />

				<PerfilCompliance />

				<PerfilRisco />
			</div>
		</div>
	)
}

export default OfferProfile

function ProgressCard({
	icon,
	title,
	progress,
	href,
}: {
	icon: React.ReactNode
	title: string
	progress: number
	href?: string
}) {
	if (progress > 100) progress = 100
	if (progress < 0) progress = 0

	const labelList = ['Baixíssimo', 'Baixo', 'Médio', 'Alto', 'Altíssimo']
	const colorList = ['#E45B5E', '#E45B5E', '#EEC232', '#55E47B', '#55E47B']

	const labelIndex = Math.floor((progress / 100) * 5)

	return (
		<div className="p-4 rounded-xl border border-muted">
			<div className="flex gap-2 items-center">
				{icon}
				<span className="ml-2">{title}</span>
			</div>
			<Progress
				className="mt-4 mb-2"
				value={progress}
				color={colorList[labelIndex]}
			/>
			<div className={`flex ${href ? 'justify-between' : 'justify-center'}`}>
				<span className="text-sm font-semibold">{labelList[labelIndex]}</span>
				{href && <Link href={href}>+ info</Link>}
			</div>
		</div>
	)
}

function CheckListItem({
	check,
	children,
}: {
	check?: boolean
	children: React.ReactNode
}) {
	return (
		<div className="flex items-center gap-3">
			{check ? (
				<CheckIcon size={26} className="text-green-600" />
			) : (
				<XIcon size={26} className="text-red-500" />
			)}
			<div>{children}</div>
		</div>
	)
}

function PerfilConsumo() {
	const [isOpen, setIsOpen] = useState(true)
	return (
		<Collapsible
			open={isOpen}
			onOpenChange={open => setIsOpen(open)}
			className="p-5 mx-3 mt-5 rounded-2xl border border-muted"
		>
			<CollapsibleTrigger className="w-full">
				<div className="flex justify-between items-center">
					<h3 className="text-xl font-medium">Perfil de Consumo</h3>
					{isOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
				</div>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					<ProgressCard
						icon={
							<div className="p-2 bg-green-600/10 text-green-700 rounded-lg">
								<AlertTriangleIcon size={18} />
							</div>
						}
						title="Propensão de compra"
						progress={20}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-green-600/10 text-green-700 rounded-lg">
								<AlertTriangleIcon size={18} />
							</div>
						}
						title="Perfil do cliente"
						progress={50}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-green-600/10 text-green-700 rounded-lg">
								<AlertTriangleIcon size={18} />
							</div>
						}
						title="Capacidade de pagamento"
						progress={95}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-green-600/10 text-green-700 rounded-lg">
								<AlertTriangleIcon size={18} />
							</div>
						}
						title="Indicação de produto"
						progress={33}
					/>
				</div>
			</CollapsibleContent>
		</Collapsible>
	)
}

function PerfilRisco() {
	const [isOpen, setIsOpen] = useState(true)

	return (
		<Collapsible
			open={isOpen}
			onOpenChange={open => setIsOpen(open)}
			className="p-5 mx-3 mt-5 rounded-2xl border border-muted"
		>
			<CollapsibleTrigger className="w-full">
				<div className="flex justify-between items-center">
					<h3 className="text-xl font-medium">Perfil de Risco</h3>
					{isOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
				</div>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					<ProgressCard
						icon={
							<div className="p-2 bg-green-600/10 text-green-700 rounded-lg">
								<AlertTriangleIcon size={18} />
							</div>
						}
						title="Risco de morte por qualquer causa"
						progress={18}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-green-600/10 text-green-700 rounded-lg">
								<AlertTriangleIcon size={18} />
							</div>
						}
						title="Risco de morte natural"
						progress={50}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-green-600/10 text-green-700 rounded-lg">
								<AlertTriangleIcon size={18} />
							</div>
						}
						title="Risco de morte por acidente"
						progress={95}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-green-600/10 text-green-700 rounded-lg">
								<AlertTriangleIcon size={18} />
							</div>
						}
						title="Risco de doenças crônicas"
						progress={33}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-green-600/10 text-green-700 rounded-lg">
								<AlertTriangleIcon size={18} />
							</div>
						}
						title="Risco de acidente"
						progress={50}
					/>
				</div>
			</CollapsibleContent>
		</Collapsible>
	)
}

function PerfilCompliance() {
	const [isOpen, setIsOpen] = useState(true)
	return (
		<Collapsible
			open={isOpen}
			onOpenChange={open => setIsOpen(open)}
			className="p-5 mx-3 mt-5 rounded-2xl border border-muted"
		>
			<CollapsibleTrigger className="w-full">
				<div className="flex justify-between items-center">
					<h3 className="text-xl font-medium">Perfil de Compliance</h3>
					{isOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
				</div>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
					<CheckListItem check>
						Óbito: <span className="text-muted-foreground">N/A</span>
					</CheckListItem>
					<CheckListItem check>
						Antecedentes Criminais:{' '}
						<span className="text-muted-foreground">N/A</span>
					</CheckListItem>
					<CheckListItem check>
						Mandado de Prisão:{' '}
						<span className="text-muted-foreground">N/A</span>
					</CheckListItem>
					<CheckListItem check>
						Situação Cadastral:{' '}
						<span className="text-muted-foreground">N/A</span>
					</CheckListItem>
					<CheckListItem check>
						Aposentado: <span className="text-muted-foreground">N/A</span>
					</CheckListItem>
					<CheckListItem check>
						Aposentado Motivo:{' '}
						<span className="text-muted-foreground">N/A</span>
					</CheckListItem>
					<CheckListItem>
						Risco aposentado por doença:{' '}
						<span className="text-muted-foreground">Crítica aqui</span>
					</CheckListItem>
				</div>
				<p className="mt-10 text-muted-foreground">*N/A: Nada consta</p>
			</CollapsibleContent>
		</Collapsible>
	)
}

function PerfilCompra() {
	return (
		<div className="flex gap-1 mx-3">
			<div className="grow p-5 mt-5 rounded-2xl border border-muted">
				<h3 className="text-xl font-medium">Perfil de Compra</h3>

				<p className="mt-6 text-muted-foreground">
					Faixa de Renda:{' '}
					<span className="text-bradesco font-semibold">PF + PJ</span>
				</p>
				<p className="text-2xl font-semibold">
					<span className="text-nowrap">R$ 10.000,00</span> a{' '}
					<span className="text-nowrap">R$ 15.000,00</span>
				</p>

				<div className="p-10 mt-4 rounded-4xl shadow-[rgba(149,157,165,0.2)_0px_8px_24px]">
					<div className="flex justify-between items-center gap-5 ">
						<CatalogCardViva outlined />
						<div className="text-center">
							<span className="text-xl text-muted-foreground">
								Oferta Ideal
							</span>
							<p className="text-3xl font-semibold">
								<span className="text-nowrap">R$ 100.000,00</span> a{' '}
								<span className="text-nowrap">R$ 200.000,00</span>
							</p>
						</div>
					</div>
					<div className="text-right -mt-4">
						<Link href="">+ Info</Link>
					</div>
				</div>
			</div>

			<div className="p-5 mx-3 mt-5 rounded-2xl border border-muted">
				<h3 className="text-xl font-medium">Perfil de Compra</h3>
				<div className="mt-4 flex flex-col gap-4">
					<ProgressCard
						icon={
							<div className="p-2 bg-bradesco-accent text-white rounded-lg">
								<HouseIcon size={18} />
							</div>
						}
						title="Propensão de compra"
						progress={90}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-bradesco-accent text-white rounded-lg">
								<CarIcon size={18} />
							</div>
						}
						title="Perfil do cliente"
						progress={40}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-bradesco-accent text-white rounded-lg">
								<WalletIcon size={18} />
							</div>
						}
						title="Capacidade de pagamento"
						progress={15}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-bradesco-accent text-white rounded-lg">
								<HandshakeIcon size={18} />
							</div>
						}
						title="Indicalçai de produto"
						progress={15}
					/>
				</div>
			</div>
		</div>
	)
}
