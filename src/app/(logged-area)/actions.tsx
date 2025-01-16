'use server'
import axios from '../../lib/axios'
import { redirect } from 'next/navigation'

export async function getNotifications(
	token: string,
	page = 1,
	size = 100
): Promise<{
	message: string
	success: boolean
	data: {
		totalItems: number
		page: number
		size: number
		items: { id: number; message: string; created: string }[]
	}
} | null> {
	try {
		const response = await axios.get('v1/Notify', {
			params: {
				page: page,
				size: size,
			},
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		console.log('>>>>>>>>>>>>>>>>>>>>>> ~~~~ ~~~~ ~~', response)
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

async function setNotificationReadById(token: string, id: number) {
	return axios.put(`v1/notify/${id}`, '', {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
}

export async function setNotificationsRead(token: string, idList: number[]) {
	try {
		const responseBatch = await Promise.allSettled(
			idList.map(id => setNotificationReadById(token, id))
		).catch(err => {
			if (err.status === 401) {
				redirect('/logout')
			}
		})

		console.log(responseBatch)

		if (responseBatch?.some(response => response.status === 'rejected')) {
			throw new Error(
				'Unsuccessful request. Some notifications could not be marked as read.\nFailed IDs: ' +
					responseBatch.reduce(
						(acc, response, i) =>
							response.status === 'rejected' ? acc + idList[i] + ', ' : acc,
						''
					) +
					'\n\n' +
					responseBatch
			)
		} else {
			if (responseBatch)
				return responseBatch.map(response => (response as any).value.data)

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
