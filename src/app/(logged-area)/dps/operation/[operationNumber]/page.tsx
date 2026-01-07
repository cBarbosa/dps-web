import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options'
import { Button } from '@/components/ui/button'
import { GoBackButton } from '@/components/ui/go-back-button'
import { Badge } from '@/components/ui/badge'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getParticipantsByOperation, getProposalByUid } from '../../actions'
import { formatCpf } from '@/lib/utils'
import { computeOperationStatus } from '@/utils/operation-aggregation'
import { SquareArrowUpRightIcon, Undo2Icon, UsersIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export const revalidate = 0
export const dynamic = 'force-dynamic'

function operationStatusProps(status: ReturnType<typeof computeOperationStatus>): {
	label: string
	variant: 'success' | 'warn' | 'destructive'
} {
	switch (status) {
		case 'APPROVED':
			return { label: 'Aprovado', variant: 'success' }
		case 'REJECTED':
			return { label: 'Reprovado', variant: 'destructive' }
		default:
			return { label: 'Em andamento', variant: 'warn' }
	}
}

function formatPercent(value?: number | null): string {
	if (value == null || Number.isNaN(Number(value))) return '-'
	return `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
}

function formatMoneyBRL(value?: number | null): string {
	if (value == null || Number.isNaN(Number(value))) return '-'
	return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}

function computeFinancingValueBRL(participant: any): string {
	const capitalMIP = Number(participant?.capitalMIP)
	const financingPct = Number(participant?.financingParticipation)
	if (!Number.isFinite(capitalMIP) || !Number.isFinite(financingPct)) return '-'
	return formatMoneyBRL((capitalMIP * financingPct) / 100)
}

function participantTypeLabel(participantType?: string | null): string {
	if (participantType === 'P') return 'Principal'
	if (participantType) return 'Coparticipante'
	return '-'
}

function operationStatusHelpText(statusLabel: string): string {
	if (statusLabel === 'Aprovado') return 'Todas as participações foram aprovadas.'
	if (statusLabel === 'Reprovado') return 'Ao menos uma participação terminou com recusa/cancelamento.'
	return 'Ainda existem participações pendentes ou em revisão.'
}

// Mesma regra de badge usada no detalhe de DPS (por statusId)
function getStatusBadgeVariantById(
	statusCode: number | undefined
): 'success' | 'warn' | 'destructive' | 'outline' {
	if (!statusCode) return 'warn'

	switch (statusCode) {
		case 6:
		case 19: // DPS Cadastrada
		case 21: // DPS Assinada
		case 30: // DPS Avaliada
		case 32: // Complemento enviado
		case 33: // Enviado para subscrição
		case 34: // DFI Avaliada
		case 35:
		case 38: // Processo finalizado
		case 41: // Processo reanalisado
		case 42: // MIP Avaliada
		case 53: // Processo revisado
		case 56: // Processo excluído
			return 'success'
		case 22: // DPS Recusada
		case 24:
		case 36:
		case 37:
			return 'destructive'
		default:
			return 'warn'
	}
}

export default async function OperationParticipantsPage({
	params,
}: {
	params: { operationNumber: string }
}) {
	const session = await getServerSession(authOptions)
	const token = (session as any)?.accessToken as string | undefined
	if (!token) redirect('/logout')

	const operationNumber = decodeURIComponent(params.operationNumber)

	const participantsResponse = await getParticipantsByOperation(token, operationNumber)
	const participants = participantsResponse?.data ?? []

	const participantsEnriched = await Promise.all(
		participants.map(async (p: any) => {
			const detail = await getProposalByUid(token, p.uid)
			return {
				...p,
				status: detail?.data?.status,
				dfiStatus: detail?.data?.dfiStatus,
				riskStatus: detail?.data?.riskStatus ?? p?.riskStatus,
			}
		})
	)

	participantsEnriched.sort((a: any, b: any) => {
		if (a.participantType === 'P' && b.participantType !== 'P') return -1
		if (b.participantType === 'P' && a.participantType !== 'P') return 1
		return 0
	})

	const operationStatus = computeOperationStatus(participantsEnriched.map((p: any) => p.riskStatus))
	const operationStatusUi = operationStatusProps(operationStatus)
	const operationStatusHint = operationStatusHelpText(operationStatusUi.label)

	return (
		<div className="flex flex-col gap-5 p-5">
			<div className="px-5 py-7 w-full max-w-7xl mx-auto bg-white rounded-3xl shadow-sm">
				<div className="w-full flex justify-between items-center">
					<GoBackButton>
						<Undo2Icon className="mr-2" size={18} />
						Voltar
					</GoBackButton>
					<div />
				</div>

				<div className="mx-5 mt-6">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="text-center md:text-left">
							<h2 className="text-primary text-xl font-semibold">Detalhes da Operação</h2>
							<div className="mt-1 text-sm text-muted-foreground">
								<span className="mr-2">Nº Operação:</span>
								<span className="font-mono text-gray-700">{operationNumber}</span>
							</div>
							<p className="mt-2 text-sm text-muted-foreground">
								Acompanhe abaixo as participações e a situação de MIP/DFI por participante.
							</p>
						</div>

						<div className="flex flex-col items-center md:items-end gap-2">
							<div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
								<Badge variant={operationStatusUi.variant} shape="pill" className="text-sm">
									{operationStatusUi.label}
								</Badge>
								<Badge variant="outline" shape="pill" className="text-sm text-muted-foreground">
									<UsersIcon className="mr-2" size={16} />
									{participantsEnriched.length} participantes
								</Badge>
							</div>
							<p className="text-xs text-muted-foreground text-center md:text-right">
								{operationStatusHint}
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="px-5 py-7 w-full max-w-7xl mx-auto bg-white rounded-3xl shadow-sm">
				<div className="mx-5 mt-2 flex flex-col gap-3">
					{participantsEnriched.length === 0 ? (
						<div className="text-sm text-muted-foreground">Sem participantes encontrados para esta operação.</div>
					) : (
						participantsEnriched.map((p: any) => (
							<div
								key={p.uid}
								className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
							>
								<div className="flex items-start justify-between gap-4">
									<div className="flex flex-col gap-1">
										<div className="flex flex-wrap items-center gap-2">
											<div className="font-medium text-base">{p.customer?.name ?? '-'}</div>
											<Badge variant="outline" shape="pill" className="text-xs">
												{participantTypeLabel(p.participantType)}
											</Badge>
										</div>
										<div className="text-sm text-muted-foreground">
											CPF: {formatCpf(p.customer?.document) || '-'}
										</div>
									</div>

									<div className="flex gap-2">
										<Button variant="outline" asChild>
											<Link href={`/dps/details/${p.uid}`}>
												<SquareArrowUpRightIcon className="mr-2" size={16} />
												Ver detalhe
											</Link>
										</Button>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
									<div className="rounded-lg bg-gray-50 p-3">
										<div className="text-xs text-muted-foreground">Participação</div>
										<div className="font-medium">{formatPercent(p.percentageParticipation)}</div>
										<div className="text-xs text-muted-foreground mt-1">
											Financiamento: {computeFinancingValueBRL(p)}
										</div>
									</div>
									<div className="rounded-lg bg-gray-50 p-3">
										<div className="text-xs text-muted-foreground">Valor MIP (capital)</div>
										<div className="font-medium">{formatMoneyBRL(p.capitalMIP)}</div>
										<div className="text-xs text-muted-foreground mt-2 flex flex-wrap items-center gap-2">
											<span>Situação MIP:</span>
											<Badge
												variant={getStatusBadgeVariantById(p.status?.id)}
												shape="pill"
												className={cn(
													'text-xs',
													!p.status?.id ? 'text-muted-foreground bg-white' : ''
												)}
											>
												{p.status?.description ?? '-'}
											</Badge>
										</div>
									</div>
									<div className="rounded-lg bg-gray-50 p-3">
										<div className="text-xs text-muted-foreground">Valor DFI (capital)</div>
										<div className="font-medium">{formatMoneyBRL(p.capitalDFI)}</div>
										{p.participantType === 'P' ? (
											(() => {
												const desc = (p.dfiStatus?.description ?? '') as string
												const isNotApplicable =
													p.capitalDFI === 0 || /nao\s+aplic|não\s+aplic/i.test(desc)

												return (
													<div className="text-xs text-muted-foreground mt-2 flex flex-wrap items-center gap-2">
														<span>Situação DFI:</span>
														<Badge
															variant={
																isNotApplicable
																	? 'outline'
																	: getStatusBadgeVariantById(p.dfiStatus?.id)
															}
															shape="pill"
															className={cn(
																'text-xs',
																!p.dfiStatus?.id
																	? 'text-muted-foreground bg-white'
																	: '',
																isNotApplicable ? 'text-gray-400 border-gray-200 bg-gray-50' : ''
															)}
														>
															{p.dfiStatus?.description ?? '-'}
														</Badge>
													</div>
												)
											})()
										) : (
											<div className="text-xs text-muted-foreground mt-2">Situação DFI: -</div>
										)}
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	)
}


