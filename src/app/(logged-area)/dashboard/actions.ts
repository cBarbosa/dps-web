'use server'
import axios from '../../../lib/axios'

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
		console.log('--->>', response.data)

		if (response.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)
	}

	return null
}
