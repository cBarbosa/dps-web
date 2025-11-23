'use server'

import axios from '@/lib/axios'
import { redirect } from 'next/navigation'
import { ChangeChannelResponse, AuthResponse } from '@/types/sales-channel'

export async function changeSalesChannel(
	token: string,
	salesChannelUid: string
): Promise<ChangeChannelResponse | null> {
	try {
		console.log('Chamando endpoint change-channel com:', { salesChannelUid })
		
		const response = await axios.post(
			'v1/Auth/change-channel',
			{ salesChannelUid },
			{
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			}
		)

		console.log('Resposta do endpoint change-channel:', response.data)

		if (response.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err: any) {
		console.error('Erro detalhado ao trocar canal:', {
			message: err?.message,
			status: err?.response?.status,
			statusText: err?.response?.statusText,
			data: err?.response?.data,
			url: err?.config?.url,
			method: err?.config?.method,
		})

		if (err?.response?.status === 401) {
			redirect('/logout')
		}

		// Retornar erro mais específico
		if (err?.response?.data) {
			return err.response.data
		}

		return {
			message: err?.message || 'Erro desconhecido ao trocar canal',
			success: false,
			data: null,
		}
	}
}

