import getServerSessionAuthorization, {
	ApiRoles,
} from '@/hooks/getServerSessionAuthorization'
import { redirect } from 'next/navigation'
import React from 'react'
import { HomeBanner } from '../components/home-banner'
import { CarIcon, HeartIcon, HouseIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

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
					<HomeCardVida />

					<HomeCardAuto />

					<HomeCardResidencial />
				</div>
			</div>
		</div>
	)
}

export default BradescoHome

function HomeCard({
	imagePath,
	title,
	icon,
	children,
	outlined = false,
}: {
	imagePath: string
	title: string
	icon: React.ReactNode
	children: string
	outlined?: boolean
}) {
	return (
		<Card
			className={
				'w-full max-w-60 hover:outline outline-2 outline-bradesco-accent shadow-slate-900/10 border-none shadow-2xl rounded-3xl' +
				(outlined ? ' outline' : '')
			}
		>
			<CardContent className="p-3">
				<div
					className="w-full aspect-square bg-cover bg-center rounded-2xl"
					style={{ backgroundImage: `url(${imagePath})` }}
				></div>

				<div className="mt-3 px-2 pb-1">
					{title && (
						<h5 className="text-lg font-semibold text-gray-700">{title}</h5>
					)}
					<div className="flex flex-nowrap items-center justify-between gap-3">
						<div className="flex justify-center items-center shrink-0 w-10 h-10 bg-bradesco-accent rounded-xl text-bradesco-foreground">
							{icon}
						</div>

						<p className="text-xs text-gray-500">{children}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

export function HomeCardVida({ outlined = false }) {
	return (
		<HomeCard
			title="Vida"
			icon={<HeartIcon />}
			imagePath="/static/images/home-pic-vida.jpg"
			outlined={outlined}
		>
			Escolha coberturas e assistências, de acordo com seu perfil.
		</HomeCard>
	)
}

export function HomeCardAuto({ outlined = false }) {
	return (
		<HomeCard
			title="Auto"
			icon={<CarIcon />}
			imagePath="/static/images/home-pic-auto.jpg"
			outlined={outlined}
		>
			Assistência 24h: carro reserva e reboque com km ilimitada.
		</HomeCard>
	)
}

export function HomeCardResidencial({ outlined = false }) {
	return (
		<HomeCard
			title="residencial"
			icon={<HouseIcon />}
			imagePath="/static/images/home-pic-residencial.jpg"
			outlined={outlined}
		>
			Personalize coberturas para sua casa, e parcele em até 10x.
		</HomeCard>
	)
}
