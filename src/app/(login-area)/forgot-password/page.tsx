import Link from 'next/link'
import ForgotPasswordForm from '../components/forgot-password-form'
import checkAuth from '@/lib/checkAuth'

export default async function ForgotPasswordPage() {
	await checkAuth()
	return <ForgotPasswordForm />
}
