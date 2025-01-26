'use client'
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
import { GetOfferDataByUidResponse } from '../../actions'
import { formatCpf } from '@/lib/utils'

function OfferProfile({
	uid,
	token,
	data,
}: {
	uid: string
	token: string
	data: Exclude<GetOfferDataByUidResponse['data'], undefined>
}) {
	const themeContext = useContext(ThemeContext)

	const [offerProfileData, setOfferProfileData] = useState<{
		personal: {
			name: string | null | undefined
			birthdate: Date | null | undefined
			cpf: string | null | undefined
			gender: string | null | undefined
			phone: string | null | undefined
			email: string | null | undefined
			profession: string | null | undefined
			motherName: string | null | undefined
			maritalStatus: string | null | undefined
		}
		perfilConsumo: PerfilConsumo
		perfilCompra: PerfilCompra
		perfilCompliance: PerfilCompliance
		perfilRisco: PerfilRisco
	}>({
		personal: {
			name: data.nome,
			birthdate: new Date(data.dT_NASCIMENTO),
			cpf: data.cpf,
			gender: null,
			phone: null,
			email: null,
			profession: null,
			motherName: null,
			maritalStatus: null,
		},
		perfilConsumo: {
			propensaoCompra: data.resultadoPropensaoDeCompraValor * 10,
			perfilCliente: null,
			capacidadePagamento: progressStringToNumber(
				data.resultadoCapaCidadePagamento
			),
			indicacaoProduto: progressStringToNumber(
				data.resultadoIndicacaoDeProduto
			),
		},
		perfilCompra: {
			faixaRenda: data.rendA_FAIXA,
			complementar: {
				propensaoCompra: null,
				perfilCliente: null,
				capacidadePagamento: null,
				indicacaoProduto: null,
			},
		},
		perfilCompliance: {
			obito: data.resultadoComplianceObito,
			antecedentesCriminais: data.resultadoComplianceAntecedentesCriminais,
			mandatoPrisao: data.resultadoComplianceMandadoDePrisao,
			situacaoCadastral: null,
			aposentado: null,
			aposentadoMotivo: null,
			riscoAposentadoDoenca: null,
		},
		perfilRisco: {
			morteQualquerCausa: null,
			morteNatural: null,
			morteAcidente: null,
			doencaCronica: null,
			acidente: null,
		},
	})

	console.log('>>>>', offerProfileData)

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
						<h5 className="text-xl my-4">{offerProfileData.personal.name}</h5>

						<div className="flex gap-5">
							<div className="flex flex-nowrap gap-2">
								<CalendarIcon className="text-bradesco" />
								<span className="text-muted-foreground">
									{offerProfileData.personal.birthdate?.toLocaleDateString() ??
										'N/A'}
								</span>
							</div>
							<div className="flex flex-nowrap gap-2">
								<UserRoundIcon className="text-bradesco" />
								<span className="text-muted-foreground">
									{formatCpf(offerProfileData.personal.cpf)}
								</span>
							</div>
							<div className="flex flex-nowrap gap-2">
								<CircleArrowOutUpRightIcon className="text-bradesco" />
								<span className="text-muted-foreground">
									{offerProfileData.personal.gender ?? 'N/A'}
								</span>
							</div>
						</div>

						<ul className="list-image-rounded-square-red ml-6 mt-6 [&>li]:mb-1">
							<li>
								Profissão:{' '}
								<span className="text-muted-foreground">
									{offerProfileData.personal.profession ?? 'N/A'}
								</span>
							</li>
							<li>
								Nome da Mãe:{' '}
								<span className="text-muted-foreground">
									{offerProfileData.personal.motherName ?? 'N/A'}
								</span>
							</li>
							<li>
								Estado Civil:{' '}
								<span className="text-muted-foreground">
									{offerProfileData.personal.maritalStatus ?? 'N/A'}
								</span>
							</li>
						</ul>
					</div>

					<div className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-muted">
						<h5 className="text-lg">Dados de Contato</h5>
						<div className="flex flex-nowrap gap-2 text-muted-foreground">
							<SmartphoneIcon className="text-bradesco" />
							{offerProfileData.personal.phone ?? 'N/A'}
						</div>
						<div className="flex flex-nowrap gap-2 text-muted-foreground">
							<MailIcon className="text-bradesco" />
							{offerProfileData.personal.email ?? 'N/A'}
						</div>
					</div>
				</div>

				<PerfilConsumo data={offerProfileData.perfilConsumo} />

				<PerfilCompra data={offerProfileData.perfilCompra} />

				<PerfilCompliance data={offerProfileData.perfilCompliance} />

				<PerfilRisco data={offerProfileData.perfilRisco} />
			</div>
		</div>
	)
}

export default OfferProfile

function ProgressCard({
	icon,
	title,
	progress: progressProp,
	href,
}: {
	icon: React.ReactNode
	title: string
	progress: number | null
	href?: string
}) {
	let progress = progressProp

	if (progress === null) progress = 0
	if (progress > 100) progress = 100
	if (progress < 0) progress = 0

	const labelList = ['Baixíssimo', 'Baixo', 'Médio', 'Alto', 'Altíssimo']
	const colorList = ['#E45B5E', '#E45B5E', '#EEC232', '#55E47B', '#55E47B']

	const labelIndex = progress === 100 ? 4 : Math.floor((progress / 100) * 5)
	console.log(title, labelIndex)

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
				<span className="text-sm font-semibold">
					{progressProp !== null ? (
						labelList[labelIndex]
					) : (
						<span className="text-muted-foreground font-normal italic">
							Sem dados
						</span>
					)}
				</span>

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

type PerfilConsumo = {
	propensaoCompra: number | null
	perfilCliente: number | null
	capacidadePagamento: number | null
	indicacaoProduto: number | null
}
function PerfilConsumo({ data }: { data: PerfilConsumo }) {
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
						progress={data.propensaoCompra}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-green-600/10 text-green-700 rounded-lg">
								<AlertTriangleIcon size={18} />
							</div>
						}
						title="Perfil do cliente"
						progress={data.perfilCliente}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-green-600/10 text-green-700 rounded-lg">
								<AlertTriangleIcon size={18} />
							</div>
						}
						title="Capacidade de pagamento"
						progress={data.capacidadePagamento}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-green-600/10 text-green-700 rounded-lg">
								<AlertTriangleIcon size={18} />
							</div>
						}
						title="Indicação de produto"
						progress={data.indicacaoProduto}
					/>
				</div>
			</CollapsibleContent>
		</Collapsible>
	)
}

type PerfilRisco = {
	morteQualquerCausa: number | null
	morteNatural: number | null
	morteAcidente: number | null
	doencaCronica: number | null
	acidente: number | null
}
function PerfilRisco({ data }: { data: PerfilRisco }) {
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
						progress={data.morteQualquerCausa}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-green-600/10 text-green-700 rounded-lg">
								<AlertTriangleIcon size={18} />
							</div>
						}
						title="Risco de morte natural"
						progress={data.morteNatural}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-green-600/10 text-green-700 rounded-lg">
								<AlertTriangleIcon size={18} />
							</div>
						}
						title="Risco de morte por acidente"
						progress={data.morteAcidente}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-green-600/10 text-green-700 rounded-lg">
								<AlertTriangleIcon size={18} />
							</div>
						}
						title="Risco de doenças crônicas"
						progress={data.doencaCronica}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-green-600/10 text-green-700 rounded-lg">
								<AlertTriangleIcon size={18} />
							</div>
						}
						title="Risco de acidente"
						progress={data.acidente}
					/>
				</div>
			</CollapsibleContent>
		</Collapsible>
	)
}

type PerfilCompliance = {
	obito: string | null | undefined
	antecedentesCriminais: string | null | undefined
	mandatoPrisao: string | null | undefined
	situacaoCadastral: string | null | undefined
	aposentado: string | null | undefined
	aposentadoMotivo: string | null | undefined
	riscoAposentadoDoenca: string | null | undefined
}
function PerfilCompliance({ data }: { data: PerfilCompliance }) {
	const [isOpen, setIsOpen] = useState(true)

	function checkValue(v: boolean | string | null | undefined) {
		if (typeof v === 'string') {
			v = v?.toUpperCase()
			if (v === 'N/A' || v === 'N/D' || v === 'NADA CONSTA') {
				return true
			}
			return false
		}
		return true
	}

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
					<CheckListItem check={checkValue(data.obito)}>
						Óbito:{' '}
						<span className="text-muted-foreground">{data.obito ?? 'N/A'}</span>
					</CheckListItem>
					<CheckListItem check={checkValue(data.antecedentesCriminais)}>
						Antecedentes Criminais:{' '}
						<span className="text-muted-foreground">
							{data.antecedentesCriminais ?? 'N/A'}
						</span>
					</CheckListItem>
					<CheckListItem check={checkValue(data.mandatoPrisao)}>
						Mandado de Prisão:{' '}
						<span className="text-muted-foreground">
							{data.mandatoPrisao ?? 'N/A'}
						</span>
					</CheckListItem>
					<CheckListItem check={checkValue(data.situacaoCadastral)}>
						Situação Cadastral:{' '}
						<span className="text-muted-foreground">
							{data.situacaoCadastral ?? 'N/A'}
						</span>
					</CheckListItem>
					<CheckListItem check={checkValue(data.aposentado)}>
						Aposentado:{' '}
						<span className="text-muted-foreground">
							{data.aposentado ?? 'N/A'}
						</span>
					</CheckListItem>
					<CheckListItem check={checkValue(data.aposentadoMotivo)}>
						Aposentado Motivo:{' '}
						<span className="text-muted-foreground">
							{data.aposentadoMotivo ?? 'N/A'}
						</span>
					</CheckListItem>
					<CheckListItem check={checkValue(data.riscoAposentadoDoenca)}>
						Risco aposentado por doença:{' '}
						<span className="text-muted-foreground">
							{data.riscoAposentadoDoenca ?? 'N/A'}
						</span>
					</CheckListItem>
				</div>
				<p className="mt-10 text-muted-foreground">*N/A: Nada consta</p>
			</CollapsibleContent>
		</Collapsible>
	)
}

type PerfilCompra = {
	faixaRenda: string
	complementar: {
		propensaoCompra: number | null
		perfilCliente: number | null
		capacidadePagamento: number | null
		indicacaoProduto: number | null
	}
}
function PerfilCompra({ data }: { data: PerfilCompra }) {
	return (
		<div className="flex gap-1 mx-3">
			<div className="grow p-5 mt-5 rounded-2xl border border-muted">
				<h3 className="text-xl font-medium">Perfil de Compra</h3>

				<p className="mt-6 text-muted-foreground">
					Faixa de Renda:{' '}
					<span className="text-bradesco font-semibold">PF + PJ</span>
				</p>
				<p className="text-2xl font-semibold">
					{/* <span className="text-nowrap">R$ 10.000,00</span> a{' '}
					<span className="text-nowrap">R$ 15.000,00</span> */}
					{data.faixaRenda}
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
				<h3 className="text-xl font-medium">Oferta Complementar</h3>
				<div className="mt-4 flex flex-col gap-4">
					<ProgressCard
						icon={
							<div className="p-2 bg-bradesco-accent text-white rounded-lg">
								<HouseIcon size={18} />
							</div>
						}
						title="Propensão de compra"
						progress={data.complementar.propensaoCompra}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-bradesco-accent text-white rounded-lg">
								<CarIcon size={18} />
							</div>
						}
						title="Perfil do cliente"
						progress={data.complementar.perfilCliente}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-bradesco-accent text-white rounded-lg">
								<WalletIcon size={18} />
							</div>
						}
						title="Capacidade de pagamento"
						progress={data.complementar.capacidadePagamento}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-bradesco-accent text-white rounded-lg">
								<HandshakeIcon size={18} />
							</div>
						}
						title="Indicação de produto"
						progress={data.complementar.indicacaoProduto}
					/>
				</div>
			</div>
		</div>
	)
}

function progressStringToNumber(str: string) {
	let value

	switch (str.toLowerCase()) {
		case 'baixíssimo':
			value = 0
			break
		case 'baixo':
			value = 25
			break
		case 'médio':
			value = 50
			break
		case 'alto':
			value = 75
			break
		case 'altíssimo':
			value = 100
			break
		default:
			value = null
	}

	return value
}
