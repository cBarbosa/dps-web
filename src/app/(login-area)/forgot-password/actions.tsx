import { redirect } from 'next/navigation'
import axios from '../../../lib/axios'
import { pipe, string, email, is } from 'valibot'

export async function sendPasswordRecoveryEmail(
	token: string,
	emailAddr: string
) {
	if (is(pipe(string(), email()), emailAddr) === false) return null

	try {
		const response = await axios.post(
			`v1/Auth/recover-password/${emailAddr}`,
			undefined,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		)

		if (response.data) {
			return response.data as {
				message: string
				success: boolean
				data: string
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

export async function validatePasswordRecoveryCode(
	token: string,
	uid: string,
	code: string
): Promise<
	Promise<{
		message: string
		success: boolean
		data: unknown
	} | null>
> {
	try {
		console.log('sending code', code)
		const response = await axios.post(
			`v1/Auth/validate-usertoken/${uid}`,
			`"${code}"`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			}
		)

		const data = response.data

		console.log('response', data)

		if (data) {
			return data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.error(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export async function updatePassword(
	token: string,
	uid: string,
	data: {
		username: string
		password: string
		code: string
	}
): Promise<
	Promise<{
		message: string
		success: boolean
		data: unknown
	} | null>
> {
	try {
		const response = await axios.put(`v1/Auth/change-password/${uid}`, data, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (response?.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.error(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}
