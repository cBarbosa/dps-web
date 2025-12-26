export type ProposalListItemForOperation = {
	uid: string
	contractNumber?: string | null
	created?: string | null
	riskStatus?: string | null
}

export type OperationAggregateStatus = 'IN_PROGRESS' | 'APPROVED' | 'REJECTED'

export type OperationRow = {
	operationNumber: string
	createdAt?: Date
	participantsCount: number
	status: OperationAggregateStatus
}

const FINISHED_STATUSES = new Set(['APPROVED', 'REFUSED', 'CANCELED'])

function isFinishedRiskStatus(riskStatus: string): boolean {
	return FINISHED_STATUSES.has(riskStatus)
}

/**
 * Regras (documentação):
 * - Em andamento: existe null/undefined OU algum REVIEW
 * - Aprovado: todos APPROVED
 * - Reprovado: todos terminaram (sem null/REVIEW) e existe >=1 != APPROVED
 *
 * Observação de compatibilidade:
 * - Status não mapeados (ex.: REOPENED) são tratados como "Em andamento".
 */
export function computeOperationStatus(
	riskStatuses: Array<string | null | undefined>
): OperationAggregateStatus {
	const normalized = riskStatuses.map(s => (s ?? null ? String(s) : null))

	// Em andamento se existir indefinido/nulo
	if (normalized.some(s => s == null)) return 'IN_PROGRESS'

	// Em andamento se algum está em REVIEW
	if (normalized.some(s => s === 'REVIEW')) return 'IN_PROGRESS'

	// Se existir qualquer status fora do conjunto de "finalizados", tratamos como em andamento (ex.: REOPENED)
	if (normalized.some(s => (s ? !isFinishedRiskStatus(s) : false))) return 'IN_PROGRESS'

	// Aprovado se todos APPROVED
	if (normalized.every(s => s === 'APPROVED')) return 'APPROVED'

	// Reprovado: todos finalizados e existe pelo menos um != APPROVED (ex.: REFUSED/CANCELED)
	return 'REJECTED'
}

export function groupProposalsByOperation(
	items: ProposalListItemForOperation[]
): OperationRow[] {
	const map = new Map<string, ProposalListItemForOperation[]>()

	for (const item of items) {
		const operationNumber = item.contractNumber ?? undefined
		if (!operationNumber) continue // visão de operação só faz sentido com ContractNumber

		const bucket = map.get(operationNumber)
		if (bucket) bucket.push(item)
		else map.set(operationNumber, [item])
	}

	const rows: OperationRow[] = []

	map.forEach((proposals, operationNumber) => {
		let createdAt: Date | undefined = undefined
		for (const p of proposals) {
			if (!p.created) continue
			const dt = new Date(p.created)
			if (Number.isNaN(dt.getTime())) continue
			if (!createdAt || dt.getTime() < createdAt.getTime()) createdAt = dt
		}

		rows.push({
			operationNumber,
			createdAt,
			participantsCount: proposals.length,
			status: computeOperationStatus(proposals.map(p => p.riskStatus)),
		})
	})

	// Ordenar mais recentes primeiro
	rows.sort((a, b) => {
		const at = a.createdAt?.getTime() ?? 0
		const bt = b.createdAt?.getTime() ?? 0
		return bt - at
	})

	return rows
}


