import getServerSessionAuthorization, {
	ApiRoles,
} from '@/hooks/getServerSessionAuthorization'
import { redirect } from 'next/navigation'
import React from 'react'
import { HomeBanner } from '../components/home-banner'
import { CarIcon, HeartIcon, HouseIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
	CatalogCardAuto,
	CatalogCardResidencial,
	CatalogCardVida,
} from '../offer/components/cards'

export const revalidate = 0
export const dynamic = 'force-dynamic'

async function BradescoHome() {
	const { session, granted } = await getServerSessionAuthorization()
	const role = (session as any)?.role?.toLowerCase() as
		| Lowercase<ApiRoles>
		| undefined
	const token = (session as any)?.accessToken

	if (!granted) {
		redirect('/logout')
	}

	return (
		<div className="p-5">
			<div className="w-full max-w-screen-lg mx-auto">
				<HomeBanner />
				<h3 className="text-xl text-gray-500 mt-9 mb-7">
					Produtos disponíveis:
				</h3>
				<div className="flex gap-7 justify-around">
					<CatalogCardVida />

					<CatalogCardAuto />

					<CatalogCardResidencial />
				</div>
			</div>
		</div>
	)
}

export default BradescoHome
