'use server'
import axios from '../../../lib/axios'
import { redirect } from 'next/navigation'

export async function getOfferBasicDataByCpf(
	token: string,
	cpf: string
): Promise<{
	message: string
	success: boolean
	data?: {
		uid: string
		cpf: string
		nome: string
		idade: number
		dataNascimento: string
	}
} | null> {
	try {
		const response = await axios.get(`v1/leadcustomer/${cpf}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

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

export type GetOfferDataByUidResponse = {
	message: string
	success: boolean
	data?: {
		uid: string
		dT_CONSULTA: string
		protocolo: string
		tp: string
		doc: string
		status: string
		risco: string
		natural: string
		saude: string
		violencia: string
		acidente: string
		saudE_DOENCA_FAIXA: string
		cpf: string
		nome: string
		nomE_MAE: string
		sexoDescricao: string
		aposentadO_MOTIVO: string
		dT_NASCIMENTO: string
		idade: number
		rendA_FAIXA: string
		escolaridade: string
		estadO_CIVIL: string
		profissaO_DESCRICAO: string
		creditO_RISCO_FAIXA: string
		mandatO_PRISAO: string
		casA_PROPRIA: boolean
		interneT_HIGH_USER: boolean
		clientE_PREMIUM: boolean
		luxo: boolean
		turismo: boolean
		investidor: boolean
		consignado: boolean
		previdenciA_PRIVADA: boolean
		segurO_VIDA: boolean
		segurO_RESIDENCIAL: boolean
		saudE_DOENCA_CRONICA: string
		resultadoPerfilDoCliente: string
		resultadoComplianceAposentado: string
		resultadoComplianceRiscoAposentadoDoenca: string
		resultadoIndicacaoDeProduto: string
		resultadoVida: string
		resultadoAutomovel: string
		resultadoResidencial: string
		resultadoComplianceObito: string
		resultadoComplianceAntecedentesCriminais: string
		resultadoComplianceMandadoDePrisao: string
		resultadoCreditoRiscoFaixaValor: number
		resultadoEscolaridadeValor: number
		resultadoRendaFaixaValor: number
		resultadoTurismoValor: number
		resultadoSeguroVidaValor: number
		resultadoSeguroResidencialValor: number
		resultadoPrevidenciaPrivadaValor: number
		resultadoLuxoValor: number
		resultadoInvestidorValor: number
		resultadoConsignadoValor: number
		resultadoClientePremiumValor: number
		resultadoCasaPropriaValor: number
		resultadoInternetHighUserValor: number
		resultadoPropensaoDeCompraValor: number
		resultadoPropensaoDeCompraClassificacao: string
		resultadoSPCTotalDasDividas: number
		resultadoNovavidatiRenda: number
		resultadoCapaCidadePagamento: string
		resultadoOfertaIdeal: number
		resultadoFaixaDeRendaPf: number
		emailContato: string
		telefoneContato: string
		resultadoFaixaDeRendaPj: number
		resultadoRendaPfPjFaixa: string
		resultadoOfertaIdealFaixa: string
		resultadoBigdataCorpSituacaoCadastral: string
		resultadoEmpresarial: string
	}
}

export async function getOfferDataByUid(
	token: string,
	uid: string
): Promise<GetOfferDataByUidResponse | null> {
	try {
		const response = await axios.get(`v1/leadcustomer/${uid}/offer`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

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

export async function postContactInfo(
	token: string,
	data: {
		Uid: string
		Document: string
		Phone: string
		Email: string
	}
) {
	try {
		const response = await axios.post('v1/leadcustomer', data, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

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
