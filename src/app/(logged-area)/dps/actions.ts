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
    if (cpf != null && cpf !== '') params.cpf = cpf
    if (operation != null && operation !== '') params.operation = operation
    if (typeof dfiStatus === 'number') params.dfiStatus = dfiStatus
    if (product != null && product !== '') params.product = product
    if (typeof status === 'number') params.status = status

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
    const response = await axios.get(`v1/Proposal/${uid}/sign`, {
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
    const response = await axios.delete(`v1/Proposal/document/${archiveUid}`, {
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

export async function postStatus(
  token: string,
  uid: string,
  status: number,
  description: string,
  type: 'MIP' | 'DFI'
): Promise<{ success: boolean; message: string } | null> {
  try {
    const response = await axios.post(
      `v1/Proposal/${uid}/status`,
      { status, description, type },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
    if ((err as any)?.status === 401) redirect('/logout')
  }
  return null
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
    const response = await axios.get('v1/options/prazos', {
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
    const response = await axios.get('v1/options/property-type', {
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
    const response = await axios.get('v1/product', {
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

export async function getProponentDataByCpf(
  cpf: string
): Promise<{ message: string; success: boolean; detalhes: { cpf?: string; nome?: string; nascimento?: string; sexo?: string; profissao?: string } } | null> {
  try {
    const response = await axios.get(`v1/proponent/${cpf}`)
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
  }
  return null
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
  zipcode: string
): Promise<{ success: boolean; message: string; data?: { zipcode: string; street?: string; neighborhood?: string; city?: string; state?: string; logradouro?: string; bairro?: string; localidade?: string; uf?: string } } | null> {
  try {
    const response = await axios.get(`v1/address/${zipcode}`)
    if (response.data) return response.data
    throw new Error('Unsuccessful request')
  } catch (err) {
    console.log(err)
  }
  return null
}

export async function getParticipantsByOperation(
  token: string,
  operation: string
): Promise<{ success: boolean; message: string; data?: Array<any> } | null> {
  try {
    const response = await axios.get(`v1/Proposal/${operation}/participants`, {
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
    if (cpf && cpf !== '') params.cpf = cpf
    const response = await axios.get('v1/Proposal/reopened', {
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

export async function getCanceledProposals(
  token: string,
  cpf?: string,
  page: number = 1,
  size: number = 10
): Promise<PagedResponse<any> | null> {
  try {
    const params: Record<string, any> = { page, size }
    if (cpf && cpf !== '') params.cpf = cpf
    const response = await axios.get('v1/Proposal/canceled', {
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

export async function getReviewProposals(
  token: string,
  cpf?: string,
  page: number = 1,
  size: number = 10
): Promise<PagedResponse<any> | null> {
  try {
    const params: Record<string, any> = { page, size }
    if (cpf && cpf !== '') params.cpf = cpf
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