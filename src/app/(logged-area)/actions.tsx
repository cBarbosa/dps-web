'use server'
import axios from '../../lib/axios'
import { redirect } from 'next/navigation'

/*
export async function getNotifications(
	token: string,
	page = 1,
	size = 10
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
	return Promise.resolve({
		message: 'Informações carregadas com sucesso',
		success: true,
		data: {
			totalItems: 0,
			page: 1,
			size: 10,
			items: [
				{
					id: 84,
					message:
						'Proposta nro:2025119,\nSLA aguardando análise do laudo DFI (48 horas)',
					created: '2025-01-14T13:56:30.8033333',
				},
				{
					id: 83,
					message:
						'Proposta nro:2025147,\nSLA aguardando análise do laudo DFI (48 horas)',
					created: '2025-01-14T13:56:28.5933333',
				},
				{
					id: 82,
					message:
						'Proposta nro:2025152,\nSLA aguardando inclusão de laudo DFI (48 horas)',
					created: '2025-01-14T13:56:26.3033333',
				},
				{
					id: 81,
					message:
						'Proposta nro:2025135,\nCANCELADO - SLA aguardando assinatura do DPS(48 horas)',
					created: '2025-01-14T13:56:24.06',
				},
				{
					id: 80,
					message:
						'Proposta nro:2025145,\nCANCELADO - SLA aguardando assinatura do DPS(48 horas)',
					created: '2025-01-14T13:56:21.76',
				},
				{
					id: 79,
					message:
						'Proposta nro:2025133,\nCANCELADO - SLA aguardando assinatura do DPS(48 horas)',
					created: '2025-01-14T13:56:19.4',
				},
				{
					id: 78,
					message:
						'Proposta nro:202580,\nCANCELADO - SLA aguardando assinatura do DPS(48 horas)',
					created: '2025-01-14T13:56:16.9266667',
				},
				{
					id: 77,
					message:
						'Proposta nro:202579,\nCANCELADO - SLA aguardando assinatura do DPS(48 horas)',
					created: '2025-01-14T13:56:14.6966667',
				},
				{
					id: 76,
					message:
						'Proposta nro:202574,\nCANCELADO - SLA aguardando assinatura do DPS(48 horas)',
					created: '2025-01-14T13:56:12.4533333',
				},
				{
					id: 75,
					message:
						'Proposta nro:2025109,\nCANCELADO - SLA aguardando assinatura do DPS(48 horas)',
					created: '2025-01-14T13:56:10.2133333',
				},
			],
		},
	})
}
*/
export async function getNotifications(
	token: string,
	page = 1,
	size = 10
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

export async function setNotificationsRead(token: string, idList: number[]) {
	try {
		const responseBatch = await Promise.allSettled(
			idList.map(id => {
				return axios.put(`v1/notify/${id}`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})
			})
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
				return responseBatch.map(response => (response as any).value)

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
