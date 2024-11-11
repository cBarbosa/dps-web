'use server'
import axios from '../../../lib/axios'
import { redirect } from 'next/navigation'

export async function getProposals(
	token: string,
	cpf = '',
	lmi?: number,
	produto?: string,
	status?: number,
	page = 1,
	size = 10
) {
	try {
		const response = await axios.get('v1/Proposal/all', {
			params: {
				page: page,
				size: size,
				document: cpf ?? '',
				lmiRange: lmi ?? '',
				status: status ?? '',
				productUid: produto ?? '',
			},
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (response.data) {
			return response.data as {
				totalItems: number
				page: number
				size: number
				items: {
					uid: string
					code: string
					customer: {
						uid: string
						document: string
						name: string
						email: string
						birthdate: string
					}
					product: {
						uid: string
						name: string
					}
					type: {
						id: number
						description: string
					}
					status: {
						id: number
						description: string
					}
					lmi: {
						code: number
						description: string
					}
					createdAt: string
				}[]
			}
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
		typeId: number
		lmiRangeId: number
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

export async function getLmiOptions(token: string): Promise<{
	success: boolean
	message: string
	data: { id: number; description: string }[]
} | null> {
	try {
		const response = await axios.get('v1/Domain/group/ValoresLMI', {
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

export async function getProposalSituations(token: string): Promise<{
	success: boolean
	message: string
	data: { id: number; description: string }[]
} | null> {
	try {
		const response = await axios.get('v1/Domain/group/SituacaoProposta', {
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

export async function getProposalTypes(token: string): Promise<{
	success: boolean
	message: string
	data: { id: number; description: string }[]
} | null> {
	try {
		const response = await axios.get('v1/Domain/group/TipoProposta', {
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

export async function getProductList(token: string): Promise<{
	success: boolean
	message: string
	data: {
		uid: string
		name: string
		status: string
	}[]
} | null> {
	try {
		const response = await axios.get('v1/Product/all', {
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

export async function getProposalByUid(
	token: string,
	uid: string
): Promise<{
	success: boolean
	message: string
	data: {
		uid: string
		code: string
		customer: {
			uid: string
			document: string
			name: string
			email: string
			birthdate: string
		}
		product: {
			uid: string
			name: string
		}
		type: { id: number; description: string }
		lmi: { id: number; description: string }
		created: string
		history: {
			description: string
			status: {
				id: number
				description: string
			}
			created: string
		}[]
	}
} | null> {
	try {
		const response = await axios.get('v1/Proposal/' + uid, {
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
		updated: string
	}[]
} | null> {
	try {
		const response = await axios.get('v1/Proposal/' + uid + '/questions', {
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

export async function postHealthDataByUid(
	token: string,
	uid: string,
	data: {
		code: string
		question: string
		exists: boolean
		created: string
	}[]
) {
	try {
		const response = await axios.post(`v1/Proposal/${uid}/questions`, data, {
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

export async function postAttachmentFile(
	token: string,
	uid: string,
	data: {
		documentName: string
		description: string
		stringBase64: string
	}
) {
	try {
		if (data.stringBase64.startsWith('data:'))
			data.stringBase64 = data.stringBase64.split(',')[1]

		const response = await axios.post(`v1/Proposal/${uid}/document`, data, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (response.data) {
			return response.data as {
				message: string
				success: boolean
				data: number
			}
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

export async function signProposal(token: string, uid: string) {
	try {
		const response = await axios.post(`v1/Proposal/${uid}/sign`, null, {
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

export async function postStatus(
	token: string,
	uid: string,
	statusId: number,
	description: string
) {
	const requestData = {
		statusId,
		Description: description,
	}
	try {
		const response = await axios.post(
			`v1/Proposal/${uid}/status`,
			requestData,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
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

	return null
}

export async function getProposalDocumentsByUid(
	token: string,
	uid: string
): Promise<
	Promise<{
		message: string
		success: boolean
		data: {
			uid: string
			documentName: string
			documentUrl: string
			description: string
			created: Date | string
			updated?: Date | string
		}[]
	} | null>
> {
	try {
		const response = await axios.get(`v1/Proposal/${uid}/document`, {
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
