'use server'
import axios from '../../../lib/axios'
import { redirect } from 'next/navigation'

export async function getProposals(token: string, page = 1, size = 10) {
	try {
		const response = await axios.get('v1/Proposal/all', {
			params: {
				page: page,
				size: size,
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
