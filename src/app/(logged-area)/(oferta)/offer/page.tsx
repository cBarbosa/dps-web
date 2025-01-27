import React from 'react'
import OfferSearchForm from './components/search-form'
import getServerSessionAuthorization, {
	ApiRoles,
} from '@/hooks/getServerSessionAuthorization'
import { redirect } from 'next/navigation'

async function OfferPage() {
	const session = await getServerSessionAuthorization()
	const role = (session as any)?.role?.toLowerCase() as
		| Lowercase<ApiRoles>
		| undefined

	if (role !== 'oferta') {
		redirect('/dashboard')
	}

	return (
		<div>
			<OfferSearchForm />
		</div>
	)
}

export default OfferPage
