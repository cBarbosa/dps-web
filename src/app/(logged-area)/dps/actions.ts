'use server';

import axios from '../../../lib/axios'
import { redirect } from 'next/navigation'

export type ProposalByUid = {
	uid: string;
	code: string;
  contractNumber?: string;
	capitalMIP: number;
	capitalDFI: number;
  uploadMIP?: boolean;
  uploadDFI?: boolean;
  uploadReturnMIP?: boolean;
	customer: {
	  uid: string;
	  document: string;
	  name: string;
    socialName?: string;
	  email: string;
	  cellphone: string;
    profession?: string;
	  gender: string;
	  birthdate: string;
	};
	product: {
	  uid: string;
	  name: string;
    description?: string;
	};
	type: {
	  id: number;
	  description: string;
	};
  statusId?: number;
	status: {
	  id: number;
	  description: string;
	};
  dfiStatus?: {
	  id: number;
	  description: string;
	};
  propertyTypeId?: number;
  deadLineId?: number;
  deadlineMonths?: number;
	deadLine?: {
	  id: number;
	  description: string;
  };
	created: string;
  addressZipcode?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
	history: {
	  description: string;
	  statusId: number;
	  created: string;
	}[];
  riskStatus?: string;
  closed?: string;
  refused?: string;
};

export type PagedResponse<T> = {
  totalItems: number
  items: T[]
}

export async function getProposals(
  token: string,
  cpf?: string,
  operation?: string,
  dfiStatus?: number,
  product?: string,
  status?: number,
  orderBy: 'asc' | 'desc' = 'desc',
  page: number = 1,
  size: number = 10
): Promise<PagedResponse<any> | null> {
  try {
    const params: Record<string, any> = { orderBy, page, size }
    
    // Usar os nomes corretos dos parâmetros conforme backend
    if (cpf != null && cpf !== '') params.document = cpf
    if (operation != null && operation !== '') params.contractNumber = operation
    if (typeof dfiStatus === 'number') params.dfiStatus = dfiStatus
    if (product != null && product !== '') params.productUid = product
    if (typeof status === 'number') params.status = status

    // Log para debug quando há filtros
    if (cpf || operation) {
      console.log('getProposals - Parâmetros corretos:', { document: cpf, contractNumber: operation })
    }

    const response = await axios.get('v1/Proposal/all', {
      params,
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function getProposalByUid(
  token: string,
  uid: string
): Promise<{
  success: boolean
  message: string
  data: ProposalByUid
} | null> {
  try {
    const response = await axios.get(`v1/Proposal/${uid}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function getProposalSignByUid(
  token: string,
  uid: string
): Promise<{ success: boolean; message: string; data: string } | null> {
  try {
    const response = await axios.get(`v1/Proposal/${uid}/pdf-sign`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function getProposalDocumentsByUid(
  token: string,
  uid: string,
  type: 'MIP' | 'DFI'
): Promise<{
  success: boolean
  message: string
  data: Array<{
    uid: string
    documentName: string
    documentUrl: string
    description: string
    created: string
    updated?: string
  }>
} | null> {
  try {
    const response = await axios.get(`v1/Proposal/${uid}/document`, {
      params: { type },
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function getProposalArchiveByUid(
  token: string,
  uid: string,
  documentUid: string
): Promise<{ success: boolean; message: string; data: string } | null> {
  try {
    const response = await axios.get(`v1/Proposal/${uid}/document/${documentUid}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function postProposalDocumentsByUid(
  token: string,
  uid: string,
  data: {
    documentName: string
    description: string
    stringBase64: string
    type: 'MIP' | 'DFI'
    forceUpload?: boolean
  }
): Promise<{
  success: boolean
  message: string
  needsConfirmation?: boolean
  compressedFile?: Uint8Array
  originalData?: any
} | null> {
  try {
    const response = await axios.post(`v1/Proposal/${uid}/document`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function deleteArchive(
  token: string,
  archiveUid: string
): Promise<{ success: boolean; message: string } | null> {
  try {
    const url = `v1/Proposal/${archiveUid}/document`
    console.log('Fazendo requisição DELETE para:', url)
    console.log('Headers:', { Authorization: `Bearer ${token ? 'presente' : 'ausente'}` })
    console.log('Parâmetros:', { archiveUid })
    
    const response = await axios.delete(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    
    console.log('Resposta da API:', response.data)
    console.log('Status da resposta:', response.status)
    
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err: any) {
    console.error('Erro detalhado ao deletar arquivo:', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      url: err.config?.url,
      method: err.config?.method
    })
    
    if (err?.response?.status === 401) {
      redirect('/logout')
    }
    
    // Retornar erro mais específico
    if (err?.response?.data?.message) {
      return {
        success: false,
        message: err.response.data.message
      }
    }
    
    if (err?.response?.status) {
      return {
        success: false,
        message: `Erro ${err.response.status}: ${err.response.statusText || 'Erro na requisição'}`
      }
    }
    
    return {
      success: false,
      message: err?.message || 'Erro desconhecido ao deletar arquivo'
    }
  }
}

export async function postStatus(
  token: string,
  uid: string,
  status: number,
  description: string,
  type: 'MIP' | 'DFI'
): Promise<{ success: boolean; message: string } | null> {
  try {
    console.log('Fazendo requisição POST para postStatus:', {
      url: `v1/Proposal/${uid}/status`,
      data: { statusId: status, description, type },
      token: token ? 'presente' : 'ausente'
    })
    
    const response = await axios.post(
      `v1/Proposal/${uid}/status`,
      { statusId: status, description, type },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    console.log('Resposta do postStatus:', response.data)
    
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err: any) {
    console.error('Erro detalhado no postStatus:', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      url: err.config?.url,
      method: err.config?.method
    })
    
    if (err?.response?.status === 401) {
      redirect('/logout')
    }
    
    // Retornar erro mais específico
    if (err?.response?.data?.message) {
      return {
        success: false,
        message: err.response.data.message
      }
    }
    
    if (err?.response?.status) {
      return {
        success: false,
        message: `Erro ${err.response.status}: ${err.response.statusText || 'Erro na requisição'}`
      }
    }
    
    return {
      success: false,
      message: err?.message || 'Erro desconhecido ao atualizar status'
    }
  }
}

export async function putProposalAnalysis(
  token: string,
  uid: string,
  body: { Action: 'REOPEN' | 'APPROVE' | 'REFUSE'; IsApproved: boolean }
): Promise<{ success: boolean; message: string } | null> {
  try {
    const response = await axios.put(`v1/Proposal/${uid}/analysis`, body, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function putProposalReview(
  token: string,
  uid: string,
  body: { Action: 'APPROVE' | 'REFUSE'; IsApproved: boolean }
): Promise<{ success: boolean; message: string } | null> {
  try {
    const response = await axios.put(`v1/Proposal/${uid}/review`, body, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function putProposalCancel(
  token: string,
  uid: string,
  body: { Action: 'CANCEL'; IsApproved: boolean }
): Promise<{ success: boolean; message: string } | null> {
  try {
    const response = await axios.put(`v1/Proposal/${uid}/cancel`, body, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function getLmiOptions(
  token: string
): Promise<{ success: boolean; message: string; data: Array<{ id: number; description: string }> } | null> {
  try {
    const response = await axios.get('v1/options/lmi', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function getPrazosOptions(
  token: string
): Promise<{ success: boolean; message: string; data: Array<{ id: number; description: string }> } | null> {
  try {
    const response = await axios.get('v1/Domain/group/Prazos', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function getTipoImovelOptions(
  token: string
): Promise<{ success: boolean; message: string; data: Array<{ id: number; description: string }> } | null> {
  try {
    const response = await axios.get('v1/Domain/group/TipoImovel', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function getProductList(
  token: string
): Promise<{ success: boolean; message: string; data: Array<{ uid: string; name: string; description?: string }> } | null> {
  try {
    const response = await axios.get('v1/product/all', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function getProponentDataByCpf(cpf: string): Promise<{
	detalhes: {
		antecedenteCriminal: string
		nascimento?: string
		riscoAposentadoPorDoenca: string
		aposentado: string
		situacaoCadastral: string
		obitoOnline: string
		profissao: string
		nome: string
		profissaoRisco: string
		renda: string
		idade: string
		riscoAposentadoPorAcidente: string
		cpf: string
		sexo: string
		mandadoPrisao: string
		nomeMae: string
		aposentadoMotivo: string
	}
	mortePorQualquerCausa: {
		score: string
		indicadorDecisao: string
	}
	morteNatural: {
		score: string
		indicadorDecisao: string
	}
	mortePorAcidente: {
		score: string
		indicadorDecisao: string
	}
	acidente: {
		score: string
		indicadorDecisao: string
	}
	doencasCronicas: {
		score: string
		indicadorDecisao: string
	}
} | null> {
	// | {
	// 		codigo: string
	// 		mensagem: string
	// 		parametros: unknown[]
	// 		validacoes: [
	// 			{
	// 				propriedade: string
	// 				mensagem: string
	// 				argumentos: unknown[]
	// 			}
	// 		]
	// 		stacktrace: string
	// 		referencia: string
	//   }
	cpf = cpf.replace(/[^\d]/g, '')
	if (cpf.length !== 11) return null

	try {
		const response = await axios.get(
			'https://apitechtrail.com.br/api/score/pf/' + cpf,
			{
				headers: {
					Authorization:
						'Basic MjJlYWU3ZDQtZjI3Mi00NDJlLTkyZDAtYWZlMjMyMDg4YmFkOjYwYWU0NmE2OGI2ZWY4NTAxYjQ4NWVkMzQ3ZGMzZjI4OGFhYTIyOGYxMWUxZGQyNzMxZDAzY2IyOTI5ZTM3NmY=',
				},
			}
		)

		if (!response.data.codigo) {
			return response.data
		} else {
			throw new Error(
				'Unsuccessful request. Message: "' +
					response.data.mensagem +
					'".\n\n Parametros: ' +
					response.data?.parametros?.join(', ')
			)
		}
	} catch (err) {
		console.error(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}

		return null
	}
}

export async function postProposal(
  token: string,
  data: any
): Promise<{ success: boolean; message: string; data?: any } | null> {
  try {
    const response = await axios.post('v1/Proposal', data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function getAddressByZipcode(
	zipcode: string,
): Promise<{
		logradouro: string
		complemento: string
		unidade: string
		bairro: string
		localidade: string
		uf: string
		estado: string
		regiao: string
		ibge: string
		gia: string
		ddd: string
		siafi: string
	} | null
> {
	try {
		const response = await axios.get(
			`https://viacep.com.br/ws/${zipcode}/json`
		)

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

	return null;
};

export async function getParticipantsByOperation(
  token: string,
  operation: string
): Promise<{ success: boolean; message: string; data?: Array<any> } | null> {
  try {
    const response = await axios.get(`v1/Proposal/participants/${operation}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function getReopenedProposals(
  token: string,
  cpf?: string,
  page: number = 1,
  size: number = 10
): Promise<PagedResponse<any> | null> {
  try {
    const params: Record<string, any> = { page, size }
    if (cpf && cpf !== '') params.document = cpf
    
    console.log('Fazendo requisição para getReopenedProposals:', {
      url: 'v1/Proposal/reopened',
      params,
      token: token ? 'presente' : 'ausente'
    })
    
    const response = await axios.get('v1/Proposal/reopened', {
      params,
      headers: { Authorization: `Bearer ${token}` },
    })
    
    console.log('Resposta do getReopenedProposals:', response.data)
    
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err: any) {
    console.error('Erro detalhado no getReopenedProposals:', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      url: err.config?.url,
      method: err.config?.method
    })
    
    if (err?.response?.status === 401) {
      redirect('/logout')
    }
  }
  return null
}

export async function getCanceledProposals(
  token: string,
  cpf?: string,
  page: number = 1,
  size: number = 10
): Promise<PagedResponse<any> | null> {
  try {
    const params: Record<string, any> = { page, size }
    if (cpf && cpf !== '') params.document = cpf
    
    console.log('Fazendo requisição para getCanceledProposals:', {
      url: 'v1/Proposal/canceled',
      params,
      token: token ? 'presente' : 'ausente'
    })
    
    const response = await axios.get('v1/Proposal/canceled', {
      params,
      headers: { Authorization: `Bearer ${token}` },
    })
    
    console.log('Resposta do getCanceledProposals:', response.data)
    
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err: any) {
    console.error('Erro detalhado no getCanceledProposals:', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      url: err.config?.url,
      method: err.config?.method
    })
    
    if (err?.response?.status === 401) {
      redirect('/logout')
    }
  }
  return null
}

export async function getReviewProposals(
  token: string,
  cpf?: string,
  page: number = 1,
  size: number = 10
): Promise<PagedResponse<any> | null> {
  try {
    const params: Record<string, any> = { page, size }
    if (cpf && cpf !== '') params.document = cpf
    const response = await axios.get('v1/Proposal/review', {
      params,
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function getHealthDataByUid(
  token: string,
  uid: string
): Promise<{
  message: string
  success: boolean
  data: {
    code: string
    question: string
    exists: boolean
    created: string
    updated?: string
    description?: string
  }[]
} | null> {
  try {
    const response = await axios.get(`v1/Proposal/${uid}/dps/questions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function postHealthDataByUid(
  token: string,
  uid: string,
  data: {
    code: string
    question: string
    exists: boolean
    created: string
    description?: string
  }[]
): Promise<{ message: string; success: boolean } | null> {
  try {
    const response = await axios.post(`v1/Proposal/${uid}/dps/questions`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function signProposal(
  token: string,
  uid: string
): Promise<{ success: boolean; message: string } | null> {
  try {
    const response = await axios.post(`v1/Proposal/${uid}/dps/sign`, null, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function postAttachmentFile(
  token: string,
  uid: string,
  data: { documentName: string; description: string; stringBase64: string }
): Promise<{ success: boolean; message: string } | null> {
  try {
    const response = await axios.post(`v1/Proposal/${uid}/dps/attachment`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}

export async function postProposalDocumentLinkByUid(
  token: string,
  uid: string,
  data: { documentName: string; description: string; documentUrl: string; type: 'MIP' | 'DFI' }
): Promise<{ success: boolean; message: string } | null> {
  try {
    const response = await axios.post(`v1/Proposal/${uid}/document-link`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
}