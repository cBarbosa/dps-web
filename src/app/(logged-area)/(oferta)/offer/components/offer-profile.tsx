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
import { Male, Female } from '@/components/ui/icons'
import Link from 'next/link'
import React, { use, useContext, useEffect, useState } from 'react'
import { CatalogCardViva } from './cards'
import { Theme, ThemeContext } from '@/components/theme-provider'
import { GetOfferDataByUidResponse } from '../../actions'
import { cn, formatCpf } from '@/lib/utils'
import {
	Carousel,
	CarouselApi,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from '@/components/ui/carousel'

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

	console.log(data)

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
			gender: data.sexoDescricao,
			phone: data.telefoneContato,
			email: data.emailContato,
			profession: data.profissaO_DESCRICAO,
			motherName: data.nomE_MAE,
			maritalStatus: data.estadO_CIVIL,
		},
		perfilConsumo: {
			propensaoCompra: data.resultadoPropensaoDeCompraValor * 10,
			perfilCliente: progressStringToNumber(data.resultadoPerfilDoCliente),
			capacidadePagamento: progressStringToNumber(
				data.resultadoCapaCidadePagamento
			),
			indicacaoProduto: progressStringToNumber(
				data.resultadoIndicacaoDeProduto
			),
		},
		perfilCompra: {
			faixaRenda: data.resultadoRendaPfPjFaixa,
			ofertaIdeal: data.resultadoOfertaIdealFaixa,
			ofertaEmpresarial: data.resultadoFaixaDeRendaPj > 0,
			complementar: {
				residencial: progressStringToNumber(data.resultadoResidencial),
				auto: progressStringToNumber(data.resultadoAutomovel),
				previdencia: progressStringToNumber(data.resultadoVida),
				empresarial: progressStringToNumber(
					// data.resultadoEmpresarial
					`ALTO`
				),
			},
			listaProdutos: data.indicacoesProdutosFaixa,
		},
		perfilCompliance: {
			obito: data.resultadoComplianceObito,
			antecedentesCriminais: data.resultadoComplianceAntecedentesCriminais,
			mandatoPrisao: data.resultadoComplianceMandadoDePrisao,
			situacaoCadastral: data.resultadoBigdataCorpSituacaoCadastral,
			aposentado: null,
			aposentadoMotivo: null,
			riscoAposentadoDoenca: null,
		},
		perfilRisco: {
			morteQualquerCausa: progressStringToNumber(data.saudE_DOENCA_FAIXA),
			morteNatural: progressStringToNumber(data.natural),
			morteAcidente: progressStringToNumber(data.acidente),
			doencaCronica: progressStringToNumber(
				data.saudE_DOENCA_CRONICA == `` ? `MÉDIO` : data.saudE_DOENCA_CRONICA
			),
			acidente: progressStringToNumber(data.violencia),
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
										'NADA CONSTA'}
								</span>
							</div>
							<div className="flex flex-nowrap gap-2">
								<UserRoundIcon className="text-bradesco" />
								<span className="text-muted-foreground">
									{formatCpf(offerProfileData.personal.cpf)}
								</span>
							</div>
							<div className="flex flex-nowrap gap-2">
								<Female className="text-bradesco" />
								<span className="text-muted-foreground">
									{offerProfileData.personal.gender ?? 'NADA CONSTA'}
								</span>
							</div>
						</div>

						<ul className="list-image-rounded-square-red ml-6 mt-6 [&>li]:mb-1">
							<li>
								Profissão:{' '}
								<span className="text-muted-foreground">
									{offerProfileData.personal.profession ?? 'NADA CONSTA'}
								</span>
							</li>
							<li>
								Nome da Mãe:{' '}
								<span className="text-muted-foreground">
									{offerProfileData.personal.motherName ?? 'NADA CONSTA'}
								</span>
							</li>
							<li>
								Estado Civil:{' '}
								<span className="text-muted-foreground">
									{offerProfileData.personal.maritalStatus ?? 'NADA CONSTA'}
								</span>
							</li>
						</ul>
					</div>

					<div className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-muted">
						<h5 className="text-lg">Dados de Contato</h5>
						<div className="flex flex-nowrap gap-2 text-muted-foreground">
							<SmartphoneIcon className="text-bradesco" />
							{offerProfileData.personal.phone ?? 'NADA CONSTA'}
						</div>
						<div className="flex flex-nowrap gap-2 text-muted-foreground">
							<MailIcon className="text-bradesco" />
							{offerProfileData.personal.email ?? 'NADA CONSTA'}
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
					{/* <ProgressCard
						icon={
							<div className="p-2 bg-green-600/10 text-green-700 rounded-lg">
								<AlertTriangleIcon size={18} />
							</div>
						}
						title="Perfil do cliente"
						progress={data.perfilCliente}
					/> */}
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
			if (
				v === 'N/A' ||
				v === 'N/D' ||
				v === 'NADA CONSTA' ||
				v === 'REGULAR'
			) {
				return true
			}
			return false
		}
		return true
	}

	function formatValue(v: boolean | string | null | undefined) {
		if (typeof v === 'string') {
			v = v?.toUpperCase()
			if (v === 'N/A' || v === 'N/D') {
				return 'NADA CONSTA'
			}
			return v
		}
		return 'NADA CONSTA'
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
						<span className="text-muted-foreground">
							{formatValue(data.obito) ?? 'NADA CONSTA'}
						</span>
					</CheckListItem>
					<CheckListItem check={checkValue(data.antecedentesCriminais)}>
						Antecedentes Criminais:{' '}
						<span className="text-muted-foreground">
							{formatValue(data.antecedentesCriminais) ?? 'NADA CONSTA'}
						</span>
					</CheckListItem>
					<CheckListItem check={checkValue(data.mandatoPrisao)}>
						Mandado de Prisão:{' '}
						<span className="text-muted-foreground">
							{formatValue(data.mandatoPrisao) ?? 'NADA CONSTA'}
						</span>
					</CheckListItem>
					<CheckListItem check={checkValue(data.situacaoCadastral)}>
						Situação Cadastral:{' '}
						<span className="text-muted-foreground">
							{formatValue(data.situacaoCadastral) ?? 'NADA CONSTA'}
						</span>
					</CheckListItem>
					{/* <CheckListItem check={checkValue(data.aposentado)}>
						Aposentado:{' '}
						<span className="text-muted-foreground">
							{formatValue(data.aposentado) ?? 'NADA CONSTA'}
						</span>
					</CheckListItem> */}
					{/* <CheckListItem check={checkValue(data.aposentadoMotivo)}>
						Aposentado Motivo:{' '}
						<span className="text-muted-foreground">
							{formatValue(data.aposentadoMotivo) ?? 'NADA CONSTA'}
						</span>
					</CheckListItem>
					<CheckListItem check={checkValue(data.riscoAposentadoDoenca)}>
						Risco aposentado por doença:{' '}
						<span className="text-muted-foreground">
							{formatValue(data.riscoAposentadoDoenca) ?? 'NADA CONSTA'}
						</span>
					</CheckListItem> */}
				</div>
				{/* <p className="mt-10 text-muted-foreground">*NADA CONSTA: Nada consta</p> */}
			</CollapsibleContent>
		</Collapsible>
	)
}

type PerfilCompra = {
	faixaRenda: string
	ofertaIdeal: string
	ofertaEmpresarial: boolean
	complementar: {
		residencial: number | null
		auto: number | null
		previdencia: number | null
		empresarial: number | null
	}
	listaProdutos: string[]
}
function PerfilCompra({ data }: { data: PerfilCompra }) {
	const [canScrollNext, setCanScrollNext] = useState(false)
	const [canScrollPrev, setCanScrollPrev] = useState(false)

	function handleSideFade(api?: CarouselApi) {
		if (api) {
			setCanScrollNext(api.canScrollNext())
			setCanScrollPrev(api.canScrollPrev())
		}
	}

	function handleCarouselInit(api?: CarouselApi) {
		if (api) {
			handleSideFade(api)
		}
	}

	return (
		<div className="flex gap-1 mx-3">
			<div className="grow p-5 mt-5 rounded-2xl border border-muted">
				<h3 className="text-xl font-medium">Perfil de compra</h3>

				<p className="text-muted-foreground text-2xl font-semibold">
					Primeira Oferta
				</p>

				<p className="mt-6 text-muted-foreground">
					Faixa de Renda:{' '}
					<span
						className={cn(
							`text-bradesco font-semibold`,
							!data.ofertaEmpresarial && `hidden`
						)}
					>
						PF + PJ
					</span>
				</p>
				<p className="mt-6 text-2xl font-semibold">
					{/* <span className="text-nowrap">R$ 10.000,00</span> a{' '}
					<span className="text-nowrap">R$ 15.000,00</span> */}
					{data.faixaRenda}
				</p>

				<div className="py-5 mt-4 rounded-4xl shadow-[rgba(149,157,165,0.2)_0px_8px_24px]">
					<div className="px-10 text-center">
						<span className="text-xl text-muted-foreground">Oferta Ideal</span>
						<p className="text-3xl font-semibold">
							{/* <span className="text-nowrap">R$ 100.000,00</span> a{' '}
								<span className="text-nowrap">R$ 200.000,00</span> */}
							<span className="text-wrap">
								{/* {data.ofertaIdeal
										? `R$ ${data.ofertaIdeal.toLocaleString('pt-BR')},00`
										: 'NADA CONSTA'} */}
								{data.ofertaIdeal}
							</span>
						</p>
					</div>

					<Carousel
						className="mx-8 mt-5"
						onEvent={['scroll', handleSideFade]}
						onInit={handleCarouselInit}
					>
						<CarouselContent className="p-1 justify-evenly">
							{data.listaProdutos.map((produto, index) => (
								<CarouselItem key={index} className="basis-2/5">
									<div className="h-full flex flex-col items-center gap-2">
										<CatalogCardViva outlined productName={produto} />
										<span className="text-muted-foreground text-center">
											{produto}
										</span>
									</div>
								</CarouselItem>
							))}
						</CarouselContent>
						<CarouselPrevious className="ml-7 z-10" />
						<CarouselNext className="mr-7 z-10" />
						<div
							className="absolute left-0 top-0 bg-gradient-to-r from-white w-[10%] h-full pointer-events-none transition-opacity duration-500"
							style={{ opacity: canScrollPrev ? '1' : '0' }}
						></div>
						<div
							className="absolute right-0 top-0 bg-gradient-to-l from-white w-[10%] h-full pointer-events-none transition-opacity duration-500"
							style={{ opacity: canScrollNext ? '1' : '0' }}
						></div>
					</Carousel>
					<div className="text-right px-10">
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
						title="Seguro residencial"
						progress={data.complementar.residencial}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-bradesco-accent text-white rounded-lg">
								<CarIcon size={18} />
							</div>
						}
						title="Seguro auto"
						progress={data.complementar.auto}
					/>
					<ProgressCard
						icon={
							<div className="p-2 bg-bradesco-accent text-white rounded-lg">
								<WalletIcon size={18} />
							</div>
						}
						title="Previdência"
						progress={data.complementar.previdencia}
					/>
					{data.ofertaEmpresarial && (
						<ProgressCard
							icon={
								<div className="p-2 bg-bradesco-accent text-white rounded-lg">
									<HandshakeIcon size={18} />
								</div>
							}
							title="Seguro empresarial"
							progress={data.complementar.empresarial}
						/>
					)}
				</div>
			</div>
		</div>
	)
}

function progressStringToNumber(str: string | null | undefined) {
	let value

	switch (str?.toUpperCase()) {
		case 'BAIXÍSSIMO':
		case 'BAIXISSIMO':
		case 'BAIXÍSSIMO RISCO':
		case 'BAIXISSIMO RISCO':
			value = 0
			break
		case 'BAIXO':
		case 'BAIXO RISCO':
			value = 25
			break
		case 'MÉDIO':
		case 'MEDIO':
		case 'MÉDIO RISCO':
		case 'MEDIO RISCO':
			value = 50
			break
		case 'ALTO':
		case 'ALTO RISCO':
			value = 75
			break
		case 'ALTÍSSIMO':
		case 'ALTISSIMO':
		case 'ALTÍSSIMO RISCO':
		case 'ALTISSIMO RISCO':
			value = 100
			break
		default:
			value = null
	}

	return value
}
