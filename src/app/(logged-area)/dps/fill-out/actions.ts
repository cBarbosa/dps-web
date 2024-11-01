'use server'
import axios from '../../../../lib/axios'
import { redirect } from 'next/navigation'

export async function getProposals(
	token: string,
	cpf = '',
	lmi = '',
	produto = '',
	page = 1,
	size = 10
) {
	try {
		const response = await axios.get('v1/Proposal/all', {
			params: {
				page: page,
				size: size,
				document: cpf,
				lmiRange: lmi,
				productUid: produto,
			},
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

export async function postProposal(
	token: string,
	data: {
		document: string
		name: string
		socialName: string | null
		email: string
		birthDate: string
		productId: string
		typeId: string
		lmiRange: string
	}
) {
	try {
		const response = await axios.post('v1/Proposal', data, {
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
