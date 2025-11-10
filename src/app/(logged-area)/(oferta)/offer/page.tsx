'use client'

import React, { useEffect, useState } from 'react'
import OfferSearchForm from './components/search-form'
import TermsOfUseModal from './components/terms-of-use-modal'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

function OfferPage() {
	const { data: session } = useSession()
	const router = useRouter()
	const [showTerms, setShowTerms] = useState(true)
	const [termsAccepted, setTermsAccepted] = useState(false)

	const role = (session as any)?.role?.toLowerCase()

	useEffect(() => {
		if (role && role !== 'oferta') {
			router.push('/dashboard')
		}
	}, [role, router])

	const handleAcceptTerms = () => {
		setTermsAccepted(true)
		setShowTerms(false)
	}

	if (role && role !== 'oferta') {
		return null
	}

	return (
		<div>
			<TermsOfUseModal 
				open={showTerms && !termsAccepted} 
				onAccept={handleAcceptTerms}
			/>
			
			{termsAccepted && <OfferSearchForm />}
		</div>
	)
}

export default OfferPage
