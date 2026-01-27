import { redirect } from 'next/navigation'
import getServerSessionAuthorization from '@/hooks/getServerSessionAuthorization'
import {
	getParticipantsByOperation,
	getProductList,
	getProposalByUid,
	getTipoImovelOptions,
} from '../../../actions'
import OperationEditForm from './components/operation-edit-form'

export const revalidate = 0
export const dynamic = 'force-dynamic'

function toNumber(value: unknown): number | undefined {
	const n = Number(value)
	return Number.isFinite(n) ? n : undefined
}

function parseMoneyToNumber(value: unknown): number {
	if (typeof value === 'number') return Number.isFinite(value) ? value : 0
	if (typeof value !== 'string') return 0

	// Handle values like: "R$ 99.999,99", "99999,99", "99999.99", "99999"
	const raw = value.trim()
	if (!raw) return 0

	const normalized = raw
		.replace(/\s/g, '')
		.replace(/^R\$/i, '')
		// keep digits, dot and comma
		.replace(/[^\d.,-]/g, '')

	// If there's a comma, treat it as decimal separator and remove thousand dots.
	if (normalized.includes(',')) {
		const noThousands = normalized.replace(/\./g, '')
		const decimalDot = noThousands.replace(',', '.')
		const n = Number(decimalDot)
		return Number.isFinite(n) ? n : 0
	}

	// No comma: try parse as-is (may have dot decimal).
	const n = Number(normalized)
	return Number.isFinite(n) ? n : 0
}

function computeAge(birthdate?: string): number | undefined {
	if (!birthdate) return undefined
	const d = new Date(birthdate)
	if (Number.isNaN(d.getTime())) return undefined
	const today = new Date()
	let age = today.getFullYear() - d.getFullYear()
	const m = today.getMonth() - d.getMonth()
	if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
	return age
}

export default async function OperationEditPage({
	params,
}: {
	params: { operationNumber: string }
}) {
	const { session, granted } = await getServerSessionAuthorization([
		'vendedor',
		'vendedor-sup',
	])
	if (!granted) redirect('/dashboard')

	const token = session?.accessToken ?? ''
	const operationNumber = decodeURIComponent(params.operationNumber)

	const participantsResponse = await getParticipantsByOperation(
		token,
		operationNumber
	)
	const participantsRaw = participantsResponse?.data ?? []

	if (!Array.isArray(participantsRaw) || participantsRaw.length === 0) {
		redirect(`/dps/operation/${encodeURIComponent(operationNumber)}`)
	}

	const principal = participantsRaw.find(
		(p: any) => p?.participantType === 'P'
	) ?? participantsRaw[0]
	const principalUid = principal?.uid as string | undefined
	if (!principalUid) {
		redirect(`/dps/operation/${encodeURIComponent(operationNumber)}`)
	}

	// Enriquecer participantes com status (para bloquear edição se algum estiver assinado)
	const participantsEnriched = await Promise.all(
		participantsRaw.map(async (p: any) => {
			const detail = p?.uid ? await getProposalByUid(token, p.uid) : null
			return {
				...p,
				status: detail?.data?.status,
				dfiStatus: detail?.data?.dfiStatus,
				customer: detail?.data?.customer ?? p?.customer,
			}
		})
	)

	const hasAnySigned =
		participantsEnriched.some((p: any) => p?.status?.id === 21) ?? false

	const participantsNotAwaitingFillOut = participantsEnriched.filter((p: any) => {
		// 10 = Aguardando preenchimento da DPS
		return p?.status?.id !== 10
	})

	const canEditCommonFields = participantsNotAwaitingFillOut.length === 0

	const commonFieldsLockSummary = Array.from(
		new Set(
			participantsNotAwaitingFillOut
				.map((p: any) => p?.status?.description)
				.filter(Boolean)
		)
	)
		.slice(0, 3)
		.join(', ')

	const [principalProposalRaw, productListRaw, tipoImovelRaw] =
		await Promise.all([
			getProposalByUid(token, principalUid),
			getProductList(token),
			getTipoImovelOptions(token),
		])

	const principalProposal = principalProposalRaw?.data
	if (!principalProposal) redirect(`/dps/details/${principalUid}`)

	const proponentAge = computeAge(principalProposal.customer?.birthdate)
	const proponentBirthdate = principalProposal.customer?.birthdate

	const productOptions =
		productListRaw?.data?.map(item => ({
			value: item.uid,
			label: item.name,
		})) ?? []

	const propertyTypeOptions =
		tipoImovelRaw?.data?.map(item => ({
			value: item.id.toString(),
			label: item.description,
		})) ?? []

	const totals = participantsRaw.reduce(
		(acc: { mip: number; dfi: number }, p: any) => {
			return {
				mip: acc.mip + parseMoneyToNumber(p?.capitalMIP),
				dfi: acc.dfi + parseMoneyToNumber(p?.capitalDFI),
			}
		},
		{ mip: 0, dfi: 0 }
	)

	const initialOperation = {
		productId: principalProposal.product?.uid ?? '',
		deadlineMonths:
			toNumber(principalProposal.deadlineMonths) ??
			toNumber(principal?.deadlineMonths) ??
			undefined,
		propertyTypeId:
			toNumber(principalProposal.propertyTypeId) ??
			toNumber(principal?.propertyTypeId) ??
			undefined,
		operationValue:
			toNumber(principal?.operationValue) ??
			toNumber(principalProposal.capitalMIP) ??
			undefined,
		capitalMIP:
			toNumber(totals.mip) ??
			toNumber(principalProposal.capitalMIP) ??
			toNumber(principal?.capitalMIP) ??
			undefined,
		capitalDFI:
			toNumber(totals.dfi) ??
			toNumber(principalProposal.capitalDFI) ??
			toNumber(principal?.capitalDFI) ??
			undefined,
		totalParticipantsExpected:
			// Quantidade configurada da operação (não editável na tela).
			// Preferir o valor vindo do backend; fallback apenas se ausente.
			toNumber((principal as any)?.totalParticipants) ??
			toNumber((principalProposal as any)?.totalParticipants) ??
			toNumber((principalProposal as any)?.totalParticipantsExpected) ??
			(toNumber(participantsRaw.length) ?? undefined),
		address: {
			zipcode: principalProposal.addressZipcode ?? '',
			state: principalProposal.addressState ?? '',
			city: principalProposal.addressCity ?? '',
			district: principalProposal.addressNeighborhood ?? '',
			street: principalProposal.addressStreet ?? '',
			number: principalProposal.addressNumber ?? '',
			complement: principalProposal.addressComplement ?? '',
		},
	}

	return (
		<OperationEditForm
			operationNumber={operationNumber}
			principalUid={principalUid}
			initialOperation={initialOperation}
			products={productListRaw?.data ?? []}
			proponentAge={proponentAge}
			proponentBirthdate={proponentBirthdate}
			productOptions={productOptions}
			propertyTypeOptions={propertyTypeOptions}
			participantsCount={participantsEnriched.length}
			hasAnySigned={hasAnySigned}
			canEditCommonFields={canEditCommonFields}
			commonFieldsLockSummary={commonFieldsLockSummary}
			participants={participantsEnriched.map((p: any) => ({
				uid: p?.uid,
				participantType: p?.participantType,
				name: p?.customer?.name,
				socialName: p?.customer?.socialName,
				document: p?.customer?.document,
				birthdate: p?.customer?.birthdate,
				profession: p?.customer?.profession,
				email: p?.customer?.email,
				cellphone: p?.customer?.cellphone,
				gender: p?.customer?.gender,
				percentageParticipation: p?.percentageParticipation,
				financingParticipation: p?.financingParticipation,
				statusId: p?.status?.id,
				statusDescription: p?.status?.description,
				dfiStatusId: p?.dfiStatus?.id,
				dfiStatusDescription: p?.dfiStatus?.description,
			}))}
		/>
	)
}

