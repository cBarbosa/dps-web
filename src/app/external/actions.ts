'use server';

import axios from '../../lib/axios'
import { redirect } from 'next/navigation'

export type ProposalByUid = {
  uid: string
  code: string
  contractNumber: string
  capitalMIP: number
  capitalDFI: number
  uploadMIP: boolean
  uploadDFI: boolean
  uploadReturnMIP: boolean
  customer: {
    uid: string
    document: string
    name: string
    socialName: string
    email: string
    cellphone: string
    profession: string
    gender: string
    birthdate: string
  }
  product: {
    uid: string
    name: string
    description: string
  }
  type: {
    id: number
    description: string
  }
  statusId: number
  status: {
    id: number
    description: string
  }
  propertyTypeId: number
  deadLineId: number
  deadLine: {
    id: number
    description: string
  }
  created: string
  addressZipcode: string
  addressStreet: string
  addressNumber: string
  addressComplement: string
  addressCity: string
  addressState: string
  history: {
    description: string
    statusId: number
    created: string
  }[]
}

export async function getProposalDpsByUid(
  uid: string
): Promise<{
  success: boolean
  message: string
  data: ProposalByUid
} | null> {
  try {
    const response = await axios.get(`/v1/Proposal/${uid}/dps`)

    if (response.data) {
      return response.data
    } else {
      throw new Error(response.data.message);
    }
  } catch (err) {
    console.error(err)
  }

  return null
}

export async function getHealthDataByUid(
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
    const response = await axios.get(`/v1/Proposal/${uid}/dps/questions`)

    if (response.data) {
      return response.data
    } else {
      throw new Error(response.data.message);
    }
  } catch (err) {
    console.error(err);
  }

  return null;
}

export async function postHealthDataByUid(
  uid: string,
  data: {
    code: string
    question: string
    exists: boolean
    created: string
  }[]
) {
  try {
    const response = await axios.post(`/v1/Proposal/${uid}/dps/questions`, data);

    if (response.data) {
      return response.data
    } else {
      throw new Error(response.data.message);
    }
  } catch (err) {
    console.error(err);
  }

  return null;
}

export async function signProposal(uid: string) {
  try {
    const response = await axios.post(`/v1/Proposal/${uid}/dps/sign`, null);

    if (response.data) {
      return response.data
    } else {
      throw new Error(response.data.message);
    }
  } catch (err) {
    console.error(err)
  }

  return null;
} 