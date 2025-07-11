'use server'
import axios from '../../../lib/axios'
import { redirect } from 'next/navigation'

// export async function getProposals(token: string, page = 1, size = 10) {
// 	try {
// 		const response = await axios.get('v1/Proposal/all', {
// 			params: {
// 				page: page,
// 				size: size,
// 			},
// 			headers: {
// 				Authorization: `Bearer ${token}`,
// 			},
// 		})

// 		if (response.data) {
// 			return response.data
// 		} else {
// 			throw new Error('Unsuccessful request')
// 		}
// 	} catch (err) {
// 		console.log(err)

// 		if ((err as any)?.status === 401) {
// 			redirect('/logout')
// 		}
// 	}

// 	return null
// }

export type DashboardDataType =
	| 'filledDps'
	| 'pendingSign'
	| 'pendingDocs'
	| 'reanalysis'
	| 'mipSituation'
	| 'dfiSituation'

export async function getFilledDps<T extends DashboardDataType>(
	token: string,
	dataType: T
): Promise<{
	success: boolean
	message: string
	data:
		| (T extends 'filledDps'
				? {
						MesReferencia: string
						TotalMesAtual: number
						TotalMesAnterior: number
						PercentualCrescimento: number
				  }
				: T extends 'pendingSign'
				? {
						MipDescription: string
						Apurado: number
						Total: number
						Percentual: number
				  }
				: T extends 'pendingDocs'
				? {
						Apurado: number
						Total: number
						Percentual: number
				  }
				: T extends 'reanalysis'
				? {
						TotalReanalise: number
						Total: number
						Percentual: number
				  }
				: T extends 'mipSituation'
				? {
						Quantidade: number
						Total: number
						Descricao: string
						MipId: number
						Percentual: number
				  }[]
				: {
						Quantidade: number
						Total: number
						Descricao: string
						DfiId: number
						Percentual: number
				  }[])
		| null
} | null> {
	const config: Record<DashboardDataType, { uri: string }> = {
		filledDps: {
			uri: 'v1/dashboard/dps',
		},
		pendingSign: {
			uri: 'v1/dashboard/mip/assinatura',
		},
		pendingDocs: {
			uri: 'v1/dashboard/mip/documentacao',
		},
		reanalysis: {
			uri: 'v1/dashboard/reanalise',
		},
		mipSituation: {
			uri: 'v1/dashboard/mip/situacoes',
		},
		dfiSituation: {
			uri: 'v1/dashboard/dfi/situacoes',
		},
	}

	try {
		const response = await axios.get(config[dataType].uri, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		console.dir(response.data)

		if (response.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}
