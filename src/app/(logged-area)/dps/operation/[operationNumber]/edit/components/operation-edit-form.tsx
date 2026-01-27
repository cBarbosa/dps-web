'use client'

import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import { GoBackButton } from '@/components/ui/go-back-button'
import { Input } from '@/components/ui/input'
import SelectComp from '@/components/ui/select-comp'
import ShareLine from '@/components/ui/share-line'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

import {
	getAddressByZipcode,
	putProposalOperationUpdate,
	putProposalParticipantUpdate,
} from '../../../../actions'
import { cn, formatCpf, maskToBrlCurrency } from '@/lib/utils'
import { isMagHabitacionalProduct } from '@/constants'
import { convertCapitalValue } from '../../../../fill-out/components/dps-product-form'
import {
	AlertTriangleIcon,
	CheckCircle,
	Loader2Icon,
	PencilIcon,
	Undo2Icon,
	XCircle,
} from 'lucide-react'
import DpsAddressForm, { DpsAddressFormType } from '../../../../fill-out/components/dps-address-form'
import { Product } from '@/types/product'
import {
	getCapitalErrorMessageHybrid,
	getFinalAgeErrorMessageHybrid,
	validateCapitalLimitHybrid,
	validateFinalAgeLimitHybrid,
} from '@/utils/product-validation'

type Option = { value: string; label: string }

type OperationEditValues = {
	productId: string
	deadlineMonths: string
	propertyTypeId: string
	capitalMIP: string
	capitalDFI: string
	address: DpsAddressFormType
}

export default function OperationEditForm({
	operationNumber,
	principalUid,
	initialOperation,
	products,
	proponentAge,
	proponentBirthdate,
	productOptions,
	propertyTypeOptions,
	participantsCount,
	hasAnySigned,
	canEditCommonFields,
	commonFieldsLockSummary,
	participants,
}: {
	operationNumber: string
	principalUid: string
	initialOperation: {
		productId: string
		deadlineMonths?: number
		propertyTypeId?: number
		capitalMIP?: number
		capitalDFI?: number
		totalParticipantsExpected?: number
		address?: Partial<DpsAddressFormType>
	}
	products: Product[]
	proponentAge?: number
	proponentBirthdate?: string
	productOptions: Option[]
	propertyTypeOptions: Option[]
	participantsCount: number
	hasAnySigned: boolean
	canEditCommonFields: boolean
	commonFieldsLockSummary?: string
	participants: Array<{
		uid?: string
		participantType?: 'P' | 'C' | string
		name?: string
		socialName?: string
		document?: string
		birthdate?: string
		profession?: string
		email?: string
		cellphone?: string
		gender?: string
		percentageParticipation?: number
		financingParticipation?: number
		statusId?: number
		statusDescription?: string
		dfiStatusId?: number
		dfiStatusDescription?: string
	}>
}) {
	const router = useRouter()
	const session = useSession()

	const [submitError, setSubmitError] = React.useState<string | null>(null)
	const [submitSuccess, setSubmitSuccess] = React.useState<string | null>(null)
	const [highlightMissing, setHighlightMissing] = React.useState(false)
	const [confirmOperationOpen, setConfirmOperationOpen] = React.useState(false)
	const [operationResultOpen, setOperationResultOpen] = React.useState(false)
	const [operationResultTitle, setOperationResultTitle] = React.useState<string>('')
	const [operationResultMessage, setOperationResultMessage] = React.useState<string>('')
	const [operationResultSuccess, setOperationResultSuccess] = React.useState<boolean>(false)

	const isCommonFieldsLocked = hasAnySigned || !canEditCommonFields
	const shouldNavigateAfterSuccessRef = React.useRef(false)

	const [participantsState, setParticipantsState] = React.useState(participants)
	React.useEffect(() => {
		setParticipantsState(participants)
	}, [participants])

	const [editOpen, setEditOpen] = React.useState(false)
	const [editingUid, setEditingUid] = React.useState<string | undefined>(undefined)
	const [participantError, setParticipantError] = React.useState<string | null>(null)
	const [isSavingParticipant, setIsSavingParticipant] = React.useState(false)
	const [participantResultOpen, setParticipantResultOpen] = React.useState(false)
	const [participantResultTitle, setParticipantResultTitle] = React.useState<string>('')
	const [participantResultMessage, setParticipantResultMessage] = React.useState<string>('')
	const [participantResultSuccess, setParticipantResultSuccess] = React.useState<boolean>(false)

	const participantForm = useForm<{
		socialName: string
		profession: string
		email: string
		cellphone: string
		gender: string
	}>({
		defaultValues: {
			socialName: '',
			profession: '',
			email: '',
			cellphone: '',
			gender: '',
		},
	})

	const editingParticipant = React.useMemo(() => {
		if (!editingUid) return undefined
		return participantsState.find(p => p.uid === editingUid)
	}, [editingUid, participantsState])

	const formatMoneyBRL = React.useCallback((value?: number | null) => {
		if (value == null || Number.isNaN(Number(value))) return '-'
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(Number(value))
	}, [])

	const formatPercent = React.useCallback((value?: number | null) => {
		if (value == null || Number.isNaN(Number(value))) return '-'
		return `${Number(value).toLocaleString('pt-BR', {
			maximumFractionDigits: 2,
		})}%`
	}, [])

	const totals = React.useMemo(() => {
		// Totais exibidos no topo são informativos (dados carregados/atuais)
		const mip = participantsState.reduce((acc, p: any) => acc + (Number((p as any).capitalMIP) || 0), 0)
		const dfi = participantsState.reduce((acc, p: any) => acc + (Number((p as any).capitalDFI) || 0), 0)
		return { mip, dfi }
	}, [participantsState])

	function roundToCents(value: number): number {
		return Math.round(value * 100) / 100
	}

	function getParticipantKey(p: any): string {
		return (p?.uid as string | undefined) ?? `${p?.document ?? ''}-${p?.participantType ?? ''}-${p?.name ?? ''}`
	}

	function computeParticipationValueFromMip(mipTotal: number | undefined, pctRaw: any): number | undefined {
		const pct = Number(pctRaw)
		if (mipTotal == null) return undefined
		if (!Number.isFinite(pct) || pct <= 0) return undefined
		return roundToCents(mipTotal * (pct / 100))
	}

	function formatParticipationValue(p: any): string {
		const pct = Number(p?.percentageParticipation)

		// Quando o usuário edita o MIP (valor total da operação), recalcular automaticamente
		if (mipTotalFromForm != null && Number.isFinite(pct) && pct > 0) {
			const value = mipTotalFromForm * (pct / 100)
			return formatMoneyBRL(value)
		}

		// Fallback: usar valor retornado pelo backend (quando disponível)
		const v = Number(p?.financingParticipation)
		if (Number.isFinite(v) && v > 0) return formatMoneyBRL(v)
		return '-'
	}

	function openEditParticipant(p: any) {
		if (!p?.uid) return
		setParticipantError(null)
		setEditingUid(p.uid)
		participantForm.reset({
			socialName: p.socialName ?? '',
			profession: p.profession ?? '',
			email: p.email ?? '',
			cellphone: p.cellphone ?? '',
			gender: p.gender ?? '',
		})
		setEditOpen(true)
	}

	function validateParticipant(values: {
		socialName: string
		profession: string
		email: string
		cellphone: string
		gender: string
	}): string | null {
		if (!values.profession?.trim()) return 'Atividade profissional é obrigatória.'
		if (!values.email?.trim()) return 'Email é obrigatório.'
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
			return 'Email inválido.'
		if (!values.cellphone?.trim()) return 'Telefone é obrigatório.'
		const digits = values.cellphone.replace(/\D/g, '')
		if (digits.length < 10 || digits.length > 11)
			return 'Telefone deve ter entre 10 e 11 dígitos.'
		return null
	}

	async function handleSaveParticipant() {
		if (!editingUid) return
		setParticipantError(null)
		setIsSavingParticipant(true)
		try {
			const values = participantForm.getValues()
			const err = validateParticipant(values)
			if (err) {
				setParticipantError(err)
				return
			}

			const token = (session?.data as any)?.accessToken as string | undefined
			if (!token) {
				setParticipantResultSuccess(false)
				setParticipantResultTitle('Falha ao salvar')
				setParticipantResultMessage('Sessão expirada. Faça login novamente.')
				setEditOpen(false)
				setParticipantResultOpen(true)
				return
			}

			const response = await putProposalParticipantUpdate(token, editingUid, {
				socialName: values.socialName?.trim() ? values.socialName.trim() : null,
				profession: values.profession.trim(),
				email: values.email.trim(),
				cellphone: values.cellphone,
				gender: values.gender,
			})

			const ok = !!response && response.success !== false

			// Atualiza UI local (independente do backend retornar payload atualizado)
			if (ok) {
				setParticipantsState(prev =>
					prev.map(p =>
						p.uid === editingUid
							? {
									...p,
									socialName: values.socialName || '',
									profession: values.profession,
									email: values.email,
									cellphone: values.cellphone,
									gender: values.gender,
							  }
							: p
					)
				)
			}

			setParticipantResultSuccess(ok)
			setParticipantResultTitle(ok ? 'Dados atualizados' : 'Falha ao salvar')
			setParticipantResultMessage(
				response?.message ||
					(ok ? 'Dados do participante atualizados com sucesso.' : 'Não foi possível salvar. Tente novamente.')
			)

			// Fecha modal de edição e abre modal de resultado (mensagem do backend)
			setEditOpen(false)
			setParticipantResultOpen(true)

			if (ok) setEditingUid(undefined)
		} finally {
			setIsSavingParticipant(false)
		}
	}

	function formatMoneyInput(value?: number): string {
		if (value == null || !Number.isFinite(Number(value))) return ''
		return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
			.format(Number(value))
			.replace(/\u00A0/g, ' ')
	}

	const form = useForm<OperationEditValues>({
		defaultValues: {
			productId: initialOperation.productId ?? '',
			deadlineMonths:
				initialOperation.deadlineMonths != null ? String(initialOperation.deadlineMonths) : '',
			propertyTypeId:
				initialOperation.propertyTypeId != null ? String(initialOperation.propertyTypeId) : '',
			capitalMIP:
				initialOperation.capitalMIP != null ? formatMoneyInput(initialOperation.capitalMIP) : '',
			capitalDFI:
				initialOperation.capitalDFI != null ? formatMoneyInput(initialOperation.capitalDFI) : '',
			address: {
				zipcode: initialOperation.address?.zipcode ?? '',
				state: initialOperation.address?.state ?? '',
				city: initialOperation.address?.city ?? '',
				district: initialOperation.address?.district ?? '',
				street: initialOperation.address?.street ?? '',
				number: initialOperation.address?.number ?? '',
				complement: initialOperation.address?.complement ?? '',
			},
		},
	})

	const watchedMip = form.watch('capitalMIP')
	const mipTotalFromForm = React.useMemo(() => {
		const parsed = convertCapitalValue(watchedMip)
		return parsed != null && Number.isFinite(Number(parsed)) ? Number(parsed) : undefined
	}, [watchedMip])

	// Base para comparação (valor original ao abrir a tela)
	const baseMipTotalRef = React.useRef<number | undefined>(mipTotalFromForm)

	function isParticipationChangedFromBase(p: any): boolean {
		const base = computeParticipationValueFromMip(baseMipTotalRef.current, p?.percentageParticipation)
		const current = computeParticipationValueFromMip(mipTotalFromForm, p?.percentageParticipation)
		if (base == null || current == null) return false
		return base !== current
	}

	// Pulsar o container "Participação" por 10s quando o MIP mudar
	const [pulseParticipationKeys, setPulseParticipationKeys] = React.useState<Set<string>>(
		() => new Set()
	)
	const pulseTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
	const lastMipRef = React.useRef<number | undefined>(undefined)

	React.useEffect(() => {
		// Capturar base na primeira vez que tivermos um MIP válido
		if (baseMipTotalRef.current == null && mipTotalFromForm != null) {
			baseMipTotalRef.current = mipTotalFromForm
		}

		// Primeira carga: não pulsar
		if (lastMipRef.current == null) {
			lastMipRef.current = mipTotalFromForm
			return
		}

		// MIP não mudou de verdade
		if (mipTotalFromForm === lastMipRef.current) return
		lastMipRef.current = mipTotalFromForm

		const changedKeys = participantsState
			.filter(p => isParticipationChangedFromBase(p))
			.map(p => getParticipantKey(p))

		setPulseParticipationKeys(new Set(changedKeys))

		if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current)
		pulseTimeoutRef.current = setTimeout(() => {
			setPulseParticipationKeys(new Set())
		}, 10_000)
	}, [mipTotalFromForm, participantsState])

	const errors = form.formState.errors
	const watchedProductId = form.watch('productId')

	const cepDataLoader = React.useCallback(
		async (cep: string) => {
			const data = await getAddressByZipcode(cep)
			if (!data) return
			form.setValue('address.street', data.logradouro ?? '')
			form.setValue('address.district', data.bairro ?? '')
			form.setValue('address.city', data.localidade ?? '')
			form.setValue('address.state', data.uf ?? '')
			// complemento do viacep não deve sobrescrever complemento digitado
		},
		[form]
	)

	const selectedProductName = React.useMemo(() => {
		return productOptions.find(p => p.value === watchedProductId)?.label ?? ''
	}, [productOptions, watchedProductId])

	const maxDeadlineMonths = React.useMemo(() => {
		return selectedProductName && isMagHabitacionalProduct(selectedProductName) ? 240 : 420
	}, [selectedProductName])

	function parseDatePtBrOrIso(value?: string): Date | undefined {
		if (!value) return undefined
		// Try native parse first (ISO-like strings)
		const iso = new Date(value)
		if (!Number.isNaN(iso.getTime())) return iso

		// Try pt-BR dd/MM/yyyy
		const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim())
		if (!m) return undefined
		const day = Number(m[1])
		const month = Number(m[2])
		const year = Number(m[3])
		if (!day || !month || !year) return undefined
		const d = new Date(year, month - 1, day)
		return Number.isNaN(d.getTime()) ? undefined : d
	}

	async function onSubmit(values: OperationEditValues) {
		setSubmitError(null)
		setSubmitSuccess(null)
		form.clearErrors()
		setHighlightMissing(true)

		if (hasAnySigned) {
			setSubmitError('Não é possível editar a operação: existe participante com DPS assinada.')
			return
		}
		if (!canEditCommonFields) {
			setSubmitError(
				'Os campos comuns da operação não podem ser editados porque há participantes fora do status "Aguardando preenchimento da DPS".'
			)
			return
		}

		const token = (session.data as any)?.accessToken as string | undefined
		if (!token) {
			router.push('/logout')
			return
		}

		const deadlineMonths = Number(values.deadlineMonths)
		const propertyTypeId = Number(values.propertyTypeId)
		const mipValue = convertCapitalValue(values.capitalMIP)
		const dfiValue = convertCapitalValue(values.capitalDFI)
		// Quantidade configurada da operação (não editável na tela)
		const totalParticipantsExpected = Number(initialOperation.totalParticipantsExpected)

		let hasFieldErrors = false

		const selectedProduct = (products ?? []).find(p => p.uid === values.productId)
		const selectedProductNameForFallback =
			selectedProduct?.name || selectedProductName || values.productId
		const selectedProductKeyForValidation =
			selectedProduct?.configuration != null ? values.productId : selectedProductNameForFallback

		// Produto (mesma regra do cadastro: obrigatório)
		if (!values.productId) {
			form.setError('productId', { type: 'manual', message: 'Campo obrigatório.' })
			hasFieldErrors = true
		}

		// Prazo (mesma regra do cadastro: 1..420; MAG 1..240)
		if (!Number.isFinite(deadlineMonths) || deadlineMonths <= 0) {
			form.setError('deadlineMonths', { type: 'manual', message: 'Campo obrigatório.' })
			hasFieldErrors = true
		} else if (deadlineMonths > maxDeadlineMonths) {
			form.setError('deadlineMonths', {
				type: 'manual',
				message: `Prazo deve ser entre 1 e ${maxDeadlineMonths} meses.`,
			})
			hasFieldErrors = true
		}

		// Idade final (mesma regra do cadastro: produto + prazo)
		if (values.productId && Number.isFinite(deadlineMonths) && deadlineMonths > 0) {
			const birth = parseDatePtBrOrIso(proponentBirthdate)
			if (!birth) {
				form.setError('deadlineMonths', {
					type: 'manual',
					message: 'Não foi possível validar a idade final do proponente (data de nascimento inválida).',
				})
				hasFieldErrors = true
			} else {
				// Preferir o nome (como no cadastro), pois o fallback por constantes depende do nome.
				// Usa UID quando há configuração; caso contrário, usa nome (fallback por constantes depende do nome)
				const productKeyForAge = selectedProductKeyForValidation
				const ok = validateFinalAgeLimitHybrid(
					products ?? [],
					productKeyForAge,
					birth,
					deadlineMonths
				)
				if (!ok) {
					form.setError('deadlineMonths', {
						type: 'manual',
						message: getFinalAgeErrorMessageHybrid(
							products ?? [],
							productKeyForAge,
							'proponente'
						),
					})
					hasFieldErrors = true
				} else {
					// Se antes havia erro de idade final no prazo, remover ao validar novamente
					form.clearErrors('deadlineMonths')
				}
			}
		}

		// Tipo de imóvel (obrigatório)
		if (!Number.isFinite(propertyTypeId) || propertyTypeId <= 0) {
			form.setError('propertyTypeId', { type: 'manual', message: 'Campo obrigatório.' })
			hasFieldErrors = true
		}

		// Capitais (usar regras híbridas do cadastro: produto + idade)
		// Usa UID quando há configuração; caso contrário, usa nome (fallback por constantes depende do nome)
		const productKey = selectedProductKeyForValidation

		if (mipValue == null || !Number.isFinite(Number(mipValue)) || Number(mipValue) <= 0) {
			form.setError('capitalMIP', { type: 'manual', message: 'Campo obrigatório.' })
			hasFieldErrors = true
		} else {
			const mipValidation = validateCapitalLimitHybrid(
				products ?? [],
				productKey,
				Number(mipValue),
				proponentAge,
				'MIP'
			)
			if (!mipValidation.valid) {
				form.setError('capitalMIP', {
					type: 'manual',
					message:
						mipValidation.message ??
						getCapitalErrorMessageHybrid(products ?? [], productKey, proponentAge, 'MIP'),
				})
				hasFieldErrors = true
			}
		}

		if (dfiValue == null || !Number.isFinite(Number(dfiValue)) || Number(dfiValue) <= 0) {
			form.setError('capitalDFI', { type: 'manual', message: 'Campo obrigatório.' })
			hasFieldErrors = true
		} else {
			const dfiValidation = validateCapitalLimitHybrid(
				products ?? [],
				productKey,
				Number(dfiValue),
				proponentAge,
				'DFI'
			)
			if (!dfiValidation.valid) {
				form.setError('capitalDFI', {
					type: 'manual',
					message:
						dfiValidation.message ??
						getCapitalErrorMessageHybrid(products ?? [], productKey, proponentAge, 'DFI'),
				})
				hasFieldErrors = true
			}
		}

		// DFI não pode exceder MIP (regra do cadastro)
		if (
			mipValue != null &&
			dfiValue != null &&
			Number.isFinite(Number(mipValue)) &&
			Number.isFinite(Number(dfiValue)) &&
			Number(dfiValue) < Number(mipValue)
		) {
			form.setError('capitalDFI', {
				type: 'manual',
				message: 'Capital DFI deve ser maior que o Capital MIP.',
			})
			hasFieldErrors = true
		}

		// Endereço (mesma regra do cadastro: campos obrigatórios)
		const addr = values.address
		const cepDigits = (addr?.zipcode ?? '').replace(/\D/g, '')
		if (!cepDigits || cepDigits.length !== 8) {
			form.setError('address.zipcode' as any, { type: 'manual', message: 'Campo obrigatório.' })
			hasFieldErrors = true
		}
		if (!addr?.state) {
			form.setError('address.state' as any, { type: 'manual', message: 'Campo obrigatório.' })
			hasFieldErrors = true
		}
		if (!addr?.city) {
			form.setError('address.city' as any, { type: 'manual', message: 'Campo obrigatório.' })
			hasFieldErrors = true
		}
		if (!addr?.district) {
			form.setError('address.district' as any, { type: 'manual', message: 'Campo obrigatório.' })
			hasFieldErrors = true
		}
		if (!addr?.street) {
			form.setError('address.street' as any, { type: 'manual', message: 'Campo obrigatório.' })
			hasFieldErrors = true
		}
		if (!addr?.number) {
			form.setError('address.number' as any, { type: 'manual', message: 'Campo obrigatório.' })
			hasFieldErrors = true
		} else if (String(addr.number).length > 10) {
			form.setError('address.number' as any, {
				type: 'manual',
				message: 'Máximo de 10 caracteres permitidos.',
			})
			hasFieldErrors = true
		}

		if (!Number.isFinite(totalParticipantsExpected) || totalParticipantsExpected < 1) {
			setSubmitError(
				'Não foi possível identificar a quantidade de participantes configurada da operação. Atualize a página e tente novamente.'
			)
			return
		}

		if (hasFieldErrors) {
			setSubmitError('Verifique os campos destacados.')
			return
		}

		const payload = {
			totalParticipantsExpected,
			productId: values.productId,
			typeId: 2,
			deadlineId: null as number | null,
			deadlineMonths,
			propertyTypeId,
			operationValue: Number(mipValue),
			capitalMIP: Number(mipValue),
			capitalDFI: Number(dfiValue),
			address: {
				zipCode: (values.address?.zipcode ?? '').replace(/\D/g, ''),
				street: values.address?.street ?? '',
				number: values.address?.number ?? '',
				complement: values.address?.complement ?? '',
				neighborhood: values.address?.district ?? '',
				city: values.address?.city ?? '',
				state: values.address?.state ?? '',
			},
		}

		const response = await putProposalOperationUpdate(token, operationNumber, payload)
		if (!response) {
			const msg = 'Não foi possível salvar. Tente novamente.'
			setSubmitError(msg)
			setOperationResultSuccess(false)
			setOperationResultTitle('Falha ao salvar')
			setOperationResultMessage(msg)
			setOperationResultOpen(true)
			return
		}

		if (response.success === false) {
			const msg = response.message || 'Erro ao salvar a operação.'
			setSubmitError(msg)
			setOperationResultSuccess(false)
			setOperationResultTitle('Falha ao salvar')
			setOperationResultMessage(msg)
			setOperationResultOpen(true)
			return
		}

		const okMsg = response.message || 'Operação atualizada com sucesso.'
		setSubmitSuccess(okMsg)
		setOperationResultSuccess(true)
		setOperationResultTitle('Operação atualizada')
		setOperationResultMessage(okMsg)
		setOperationResultOpen(true)
		shouldNavigateAfterSuccessRef.current = true
	}

	return (
		<div className="flex flex-col gap-5 p-5">
			<div className="px-5 py-7 w-full max-w-7xl mx-auto bg-white rounded-3xl shadow-sm">
				<div className="w-full flex justify-between items-center">
					<GoBackButton>
						<Undo2Icon className="mr-2" size={18} />
						Voltar
					</GoBackButton>
					<div className="text-sm text-muted-foreground font-mono">
						{operationNumber}
					</div>
				</div>

				<div className="mx-5 mt-6">
					<h2 className="text-primary text-xl font-semibold">Editar operação</h2>
					<p className="mt-2 text-sm text-muted-foreground">
						Atualiza atributos comuns para {participantsCount} participantes.
					</p>

					{isCommonFieldsLocked && (
						<Alert className="mt-4">
							<AlertDescription>
								Esta operação possui algum DPS já iniciado (há participante em status diferente de
								{' '}&quot;Aguardando preenchimento da DPS&quot;
								{commonFieldsLockSummary ? ` (${commonFieldsLockSummary}).` : '.'}
								{' '}Por isso, os campos comuns (produto, prazo, capitais, tipo de imóvel e endereço) não podem mais ser editados.
								{' '}Você ainda pode editar os dados dos participantes.
							</AlertDescription>
						</Alert>
					)}
					{/* Feedback de erro/sucesso é exibido nos modais de resultado ao salvar */}
				</div>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault()
					// Confirmação antes de aplicar mudanças em todos os participantes
					setConfirmOperationOpen(true)
				}}
				className={isCommonFieldsLocked ? 'opacity-60' : ''}
			>
				<div className="px-5 py-7 w-full max-w-7xl mx-auto bg-white rounded-3xl shadow-sm">
					<div className="mx-5 mt-2">
						<h3 className="text-primary text-lg font-semibold">Dados do Produto</h3>
						<div className="mt-4 flex flex-col gap-6">
							<ShareLine>
								<Controller
									control={form.control}
									name="productId"
									render={({ field: { onChange, value } }) => (
										<label className="w-full">
											<div className="text-gray-500">
												Produto <span className="text-red-500">*</span>
											</div>
											<SelectComp
												placeholder="Selecione"
												options={productOptions}
												triggerClassName={cn(
													"p-4 h-12 rounded-lg",
													errors.productId && 'border-red-500 focus-visible:border-red-500',
													highlightMissing && !value && 'border-orange-400 bg-orange-50'
												)}
												onValueChange={(val) => {
													onChange(val)
													form.clearErrors('productId')
													// ao trocar o produto, limpar erro anterior do prazo (revalida no Salvar)
													form.clearErrors('deadlineMonths')
													if (submitError) setSubmitError(null)
													setTimeout(() => setHighlightMissing(true), 0)
												}}
												value={value}
												disabled={isCommonFieldsLocked || form.formState.isSubmitting}
											/>
											<div className="text-xs text-red-500">
												{errors.productId?.message as any}
											</div>
										</label>
									)}
								/>
							</ShareLine>

							<ShareLine>
								<label className="w-full">
									<div className="text-gray-500">
										Prazo (meses) <span className="text-red-500">*</span>
									</div>
									<Input
										placeholder="Ex: 60"
										className={cn(
											'w-full px-4 py-6 rounded-lg',
											errors.deadlineMonths && 'border-red-500 focus-visible:border-red-500',
											highlightMissing && !form.watch('deadlineMonths') && 'border-orange-400 bg-orange-50'
										)}
										disabled={isCommonFieldsLocked || form.formState.isSubmitting}
										onChange={e => {
											// ao editar, limpar erro anterior do prazo (revalida no Salvar)
											form.clearErrors('deadlineMonths')
											if (submitError) setSubmitError(null)

											const numericValue = e.target.value.replace(/\D/g, '')
											const limitedValue = numericValue.slice(0, 3)
											const numValue = parseInt(limitedValue, 10)
											if (!isNaN(numValue) && numValue > maxDeadlineMonths) {
												form.setValue('deadlineMonths', String(maxDeadlineMonths))
											} else {
												form.setValue('deadlineMonths', limitedValue)
											}
										}}
										onBlur={() => setHighlightMissing(true)}
										value={form.watch('deadlineMonths') || ''}
									/>
									<div className="text-xs text-red-500">
										{errors.deadlineMonths?.message as any}
									</div>
								</label>

								<Controller
									control={form.control}
									name="propertyTypeId"
									render={({ field: { onChange, value } }) => (
										<label className="w-full">
											<div className="text-gray-500">
												Tipo de imóvel <span className="text-red-500">*</span>
											</div>
											<SelectComp
												placeholder="Selecione"
												options={propertyTypeOptions}
												triggerClassName={cn(
													"p-4 h-12 rounded-lg",
													errors.propertyTypeId && 'border-red-500 focus-visible:border-red-500',
													highlightMissing && !value && 'border-orange-400 bg-orange-50'
												)}
												onValueChange={(val) => {
													onChange(val)
													form.clearErrors('propertyTypeId')
													setTimeout(() => setHighlightMissing(true), 0)
												}}
												value={value}
											disabled={isCommonFieldsLocked || form.formState.isSubmitting}
											/>
											<div className="text-xs text-red-500">
												{errors.propertyTypeId?.message as any}
											</div>
										</label>
									)}
								/>
							</ShareLine>

							<ShareLine>
								<Controller
									control={form.control}
									name="capitalMIP"
									defaultValue={form.getValues('capitalMIP') ?? ''}
									render={({ field: { onChange, onBlur, value, ref } }) => (
										<label className="w-full">
											<div className="text-gray-500">
												Capital MIP (Valor Total da Operação) <span className="text-red-500">*</span>
											</div>
											<Input
												placeholder="R$ 99.999,99"
												mask="R$ 9999999999999"
												beforeMaskedStateChange={maskToBrlCurrency}
												onChange={onChange}
												onBlur={(e) => {
													onBlur()
													setHighlightMissing(true)
												}}
												value={value ?? ''}
												ref={ref}
												className={cn(
													'w-full px-4 py-6 rounded-lg',
													errors.capitalMIP && 'border-red-500 focus-visible:border-red-500',
													highlightMissing && !value && 'border-orange-400 bg-orange-50'
												)}
												disabled={isCommonFieldsLocked || form.formState.isSubmitting}
											/>
											<div className="text-xs text-red-500">
												{errors.capitalMIP?.message as any}
											</div>
										</label>
									)}
								/>

								<Controller
									control={form.control}
									name="capitalDFI"
									defaultValue={form.getValues('capitalDFI') ?? ''}
									render={({ field: { onChange, onBlur, value, ref } }) => (
										<label className="w-full">
											<div className="text-gray-500">
												Capital DFI <span className="text-red-500">*</span>
											</div>
											<Input
												placeholder="R$ 99.999,99"
												mask="R$ 9999999999999"
												beforeMaskedStateChange={maskToBrlCurrency}
												onChange={onChange}
												onBlur={(e) => {
													onBlur()
													setHighlightMissing(true)
												}}
												value={value ?? ''}
												ref={ref}
												className={cn(
													'w-full px-4 py-6 rounded-lg',
													errors.capitalDFI && 'border-red-500 focus-visible:border-red-500',
													highlightMissing && !value && 'border-orange-400 bg-orange-50'
												)}
												disabled={isCommonFieldsLocked || form.formState.isSubmitting}
											/>
											<div className="text-xs text-red-500">
												{errors.capitalDFI?.message as any}
											</div>
										</label>
									)}
								/>
							</ShareLine>
						</div>
					</div>
				</div>

				<div className="mt-5 px-5 py-7 w-full max-w-7xl mx-auto bg-white rounded-3xl shadow-sm">
					<div className="mx-5 mt-2">
						<DpsAddressForm
							control={form.control}
							formState={form.formState as any}
							cepDataLoader={cepDataLoader}
							disabled={isCommonFieldsLocked || form.formState.isSubmitting}
						/>
					</div>
				</div>

				<div className="px-5 py-2 w-full max-w-7xl mx-auto">
					<div className="flex gap-2 justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
							disabled={form.formState.isSubmitting}
						>
							Cancelar
						</Button>
						<Button
							type="button"
							onClick={() => setConfirmOperationOpen(true)}
							disabled={form.formState.isSubmitting || isCommonFieldsLocked}
						>
							{form.formState.isSubmitting ? (
								<>
									Salvando
									<Loader2Icon className="ml-2 h-4 w-4 animate-spin" />
								</>
							) : (
								'Salvar'
							)}
						</Button>
					</div>
				</div>
			</form>

			<Dialog open={confirmOperationOpen} onOpenChange={setConfirmOperationOpen}>
				<DialogContent className="sm:max-w-[650px] p-0 overflow-hidden">
					<DialogHeader className="p-6 bg-gray-50 border-b">
						<div className="flex items-start gap-3">
							<div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
								<AlertTriangleIcon className="h-5 w-5" />
							</div>
							<div className="space-y-1">
								<DialogTitle>Confirmar alteração da operação</DialogTitle>
								<DialogDescription>
									Esta ação atualizará os campos comuns e afetará <strong>todos</strong> os participantes da operação.
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="p-6 space-y-4">
						<div className="rounded-xl border border-gray-200 bg-white p-4">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
								<div>
									<div className="text-xs text-muted-foreground">Operação</div>
									<div className="font-mono font-medium">{operationNumber}</div>
								</div>
								<div>
									<div className="text-xs text-muted-foreground">Participantes</div>
									<div className="font-medium">{participantsCount}</div>
								</div>
							</div>

							<div className="mt-4 text-sm text-muted-foreground">Campos que serão aplicados para todos:</div>
							<ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
								<li>Produto</li>
								<li>Prazo</li>
								<li>Capital MIP</li>
								<li>Capital DFI</li>
								<li>Tipo de imóvel</li>
								<li>Endereço</li>
							</ul>
						</div>

						<div className="text-sm text-muted-foreground">
							Confirme apenas se você tem certeza de que deseja aplicar as alterações para toda a operação.
						</div>
					</div>

					<div className="p-6 pt-0">
						<DialogFooter className="gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setConfirmOperationOpen(false)}
								disabled={form.formState.isSubmitting}
							>
								Voltar
							</Button>
							<Button
								type="button"
								onClick={() => {
									setConfirmOperationOpen(false)
									form.handleSubmit(onSubmit)()
								}}
								disabled={form.formState.isSubmitting}
							>
								{form.formState.isSubmitting ? (
									<>
										Salvando
										<Loader2Icon className="ml-2 h-4 w-4 animate-spin" />
									</>
								) : (
									'Confirmar e salvar'
								)}
							</Button>
						</DialogFooter>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={operationResultOpen}
				onOpenChange={(open) => {
					setOperationResultOpen(open)
					if (!open && operationResultSuccess && shouldNavigateAfterSuccessRef.current) {
						shouldNavigateAfterSuccessRef.current = false
						router.push(`/dps/details/${principalUid}`)
						router.refresh()
					}
				}}
			>
				<DialogContent className="sm:max-w-[650px] p-0 overflow-hidden">
					<DialogHeader className="p-6 bg-gray-50 border-b">
						<div className="flex items-start gap-3">
							<div
								className={cn(
									'mt-0.5 flex h-9 w-9 items-center justify-center rounded-full',
									operationResultSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
								)}
							>
								{operationResultSuccess ? (
									<CheckCircle className="h-5 w-5" />
								) : (
									<XCircle className="h-5 w-5" />
								)}
							</div>
							<div className="space-y-1">
								<DialogTitle>{operationResultTitle || 'Resultado'}</DialogTitle>
								<DialogDescription>Operação: <span className="font-mono">{operationNumber}</span></DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="p-6">
						<div
							className={cn(
								'rounded-xl border p-4 text-sm',
								operationResultSuccess
									? 'border-emerald-200 bg-emerald-50 text-emerald-900'
									: 'border-red-200 bg-red-50 text-red-900'
							)}
						>
							<div className="font-medium">
								{operationResultSuccess ? 'Alterações aplicadas.' : 'Não foi possível aplicar as alterações.'}
							</div>
							<div className="mt-1">{operationResultMessage}</div>
						</div>
					</div>

					<div className="p-6 pt-0">
						<DialogFooter>
							<Button type="button" onClick={() => setOperationResultOpen(false)}>
								Fechar
							</Button>
						</DialogFooter>
					</div>
				</DialogContent>
			</Dialog>

			<div className="px-5 py-7 w-full max-w-7xl mx-auto bg-white rounded-3xl shadow-sm">
				<div className="mx-5 mt-2">
					<h3 className="text-primary text-lg font-semibold">Participantes</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						Dados exibidos para conferência (a atualização continua sendo por operação).
					</p>

					<div className="mt-4 flex flex-col gap-3">
						{participantsState.map(p => (
							<div
								key={p.uid ?? `${p.document ?? ''}-${p.participantType ?? ''}-${p.name ?? ''}`}
								className="relative rounded-2xl border border-gray-200 p-4"
							>
								<Button
									className="absolute top-4 right-4"
									variant="outline"
									type="button"
									onClick={() => openEditParticipant(p)}
									disabled={!p.uid}
								>
									<PencilIcon className="mr-2" size={16} />
									Editar
								</Button>

								<div className="flex flex-col gap-1">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<div className="font-medium">
											{p.name ?? '-'}{' '}
											<span className="text-xs text-muted-foreground">
												({p.participantType === 'P' ? 'Principal' : 'Coparticipante'})
											</span>
										</div>
										<div className="text-xs text-muted-foreground pr-28">
											Status: {p.statusDescription ?? '-'}
										</div>
									</div>
									<div className="text-sm text-muted-foreground">
										CPF: {formatCpf(p.document) || '-'}
									</div>
								</div>

								<div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
									<div
										className={cn(
											'rounded-lg p-3 border border-transparent',
											pulseParticipationKeys.has(getParticipantKey(p))
												? 'border-blue-400 bg-blue-50 animate-pulse'
												: 'bg-gray-50'
										)}
									>
										<div className="text-xs text-muted-foreground">Participação</div>
										<div className="font-medium flex flex-wrap items-center gap-2">
											<span>{formatPercent(p.percentageParticipation)}</span>
											<span className="text-muted-foreground">
												({formatParticipationValue(p)})
											</span>
										</div>
									</div>
									<div className="rounded-lg bg-gray-50 p-3 min-w-0">
										<div className="text-xs text-muted-foreground">Contato</div>
										<div className="font-medium truncate" title={p.email ?? ''}>
											{p.email ?? '-'}
										</div>
										<div className="text-xs text-muted-foreground mt-1">
											{p.cellphone ?? '-'}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			<Dialog
				open={editOpen}
				onOpenChange={open => {
					setEditOpen(open)
					if (!open) {
						setEditingUid(undefined)
						setParticipantError(null)
					}
				}}
			>
				<DialogContent className="sm:max-w-[650px]">
					<DialogHeader>
						<DialogTitle>Editar participante</DialogTitle>
						<DialogDescription>
							Atualize os dados do participante selecionado.
						</DialogDescription>
					</DialogHeader>

					{editingParticipant && (
						<div className="space-y-6">
							<div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
									<div>
										<div className="text-xs text-muted-foreground">Nome</div>
										<div className="font-medium">{editingParticipant.name ?? '-'}</div>
									</div>
									<div>
										<div className="text-xs text-muted-foreground">CPF</div>
										<div className="font-medium">{formatCpf(editingParticipant.document) || '-'}</div>
									</div>
									<div>
										<div className="text-xs text-muted-foreground">Nascimento</div>
										<div className="font-medium">
											{editingParticipant.birthdate
												? new Date(editingParticipant.birthdate).toLocaleDateString('pt-BR')
												: '-'}
										</div>
									</div>
								</div>
							</div>

							{/* Ordem: Email; Nome social; Sexo | Atividade profissional; Telefone | (em branco) */}
							<label className="w-full p-4">
								<div className="text-gray-500">
									Email <span className="text-red-500">*</span>
								</div>
								<Input
									{...participantForm.register('email')}
									type="email"
									placeholder="email@exemplo.com"
									className="w-full"
								/>
							</label>

							<label className="w-full">
								<div className="text-gray-500">Nome social</div>
								<Input {...participantForm.register('socialName')} placeholder="(opcional)" />
							</label>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<label className="w-full">
									<div className="text-gray-500">Sexo</div>
									<Controller
										control={participantForm.control}
										name="gender"
										render={({ field: { onChange, value } }) => (
											<SelectComp
												placeholder="Selecione"
												options={[
													{ value: 'M', label: 'Masculino' },
													{ value: 'F', label: 'Feminino' },
												]}
												onValueChange={onChange}
												value={value ?? ''}
												allowClear
											/>
										)}
									/>
								</label>

								<label className="w-full">
									<div className="text-gray-500">
										Atividade profissional <span className="text-red-500">*</span>
									</div>
									<Input {...participantForm.register('profession')} placeholder="Ex: Engenheiro" />
								</label>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<label className="w-full">
									<div className="text-gray-500">
										Telefone <span className="text-red-500">*</span>
									</div>
									<Controller
										control={participantForm.control}
										name="cellphone"
										render={({ field: { onChange, onBlur, value, ref } }) => (
											<Input
												placeholder="(99) 99999-9999"
												mask="(99) 99999-99999"
												autoComplete="tel"
												onChange={onChange}
												onBlur={onBlur}
												value={typeof value === 'string' ? value : ''}
												ref={ref}
											/>
										)}
									/>
								</label>
								<div className="hidden md:block" />
							</div>

							{participantError && (
								<Alert variant="destructive">
									<AlertDescription>{participantError}</AlertDescription>
								</Alert>
							)}
						</div>
					)}

					<DialogFooter className="p-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setEditOpen(false)}
							disabled={isSavingParticipant}
						>
							Cancelar
						</Button>
						<Button
							type="button"
							onClick={handleSaveParticipant}
							disabled={!editingParticipant || isSavingParticipant}
						>
							{isSavingParticipant ? (
								<>
									Salvando
									<Loader2Icon className="ml-2 h-4 w-4 animate-spin" />
								</>
							) : (
								'Salvar alterações'
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={participantResultOpen} onOpenChange={setParticipantResultOpen}>
				<DialogContent className="sm:max-w-[650px] p-0 overflow-hidden">
					<DialogHeader className="p-6 bg-gray-50 border-b">
						<div className="flex items-start gap-3">
							<div
								className={cn(
									'mt-0.5 flex h-9 w-9 items-center justify-center rounded-full',
									participantResultSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
								)}
							>
								{participantResultSuccess ? (
									<CheckCircle className="h-5 w-5" />
								) : (
									<XCircle className="h-5 w-5" />
								)}
							</div>
							<div className="space-y-1">
								<DialogTitle>{participantResultTitle || 'Resultado'}</DialogTitle>
								<DialogDescription>{participantResultSuccess ? 'Dados do participante atualizados.' : 'Falha ao salvar dados do participante.'}</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="p-6">
						<div
							className={cn(
								'rounded-xl border p-4 text-sm',
								participantResultSuccess
									? 'border-emerald-200 bg-emerald-50 text-emerald-900'
									: 'border-red-200 bg-red-50 text-red-900'
							)}
						>
							<div className="mt-1">{participantResultMessage}</div>
						</div>
					</div>

					<div className="p-6 pt-0">
						<DialogFooter>
							<Button type="button" onClick={() => setParticipantResultOpen(false)}>
								Fechar
							</Button>
						</DialogFooter>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}

