import Link from 'next/link'
import ForgotPasswordForm from '../components/forgot-password-form'
import checkAuth from '@/lib/checkAuth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ForgotPasswordPage() {
	await checkAuth()
	return <ForgotPasswordForm />
}
