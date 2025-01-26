import { Card, CardContent } from '@/components/ui/card'
import { CarIcon, HeartIcon, HouseIcon } from 'lucide-react'

function CatalogCard({
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

export function CatalogCardVida({ outlined = false }) {
	return (
		<CatalogCard
			title="Vida"
			icon={<HeartIcon />}
			imagePath="/static/images/home-pic-vida.jpg"
			outlined={outlined}
		>
			Escolha coberturas e assistências, de acordo com seu perfil.
		</CatalogCard>
	)
}

export function CatalogCardAuto({ outlined = false }) {
	return (
		<CatalogCard
			title="Auto"
			icon={<CarIcon />}
			imagePath="/static/images/home-pic-auto.jpg"
			outlined={outlined}
		>
			Assistência 24h: carro reserva e reboque com km ilimitada.
		</CatalogCard>
	)
}

export function CatalogCardResidencial({ outlined = false }) {
	return (
		<CatalogCard
			title="residencial"
			icon={<HouseIcon />}
			imagePath="/static/images/home-pic-residencial.jpg"
			outlined={outlined}
		>
			Personalize coberturas para sua casa, e parcele em até 10x.
		</CatalogCard>
	)
}

export function CatalogCardViva({ outlined = false }) {
	return (
		<CatalogCard
			title="Vida Viva Bradesco"
			icon={<HeartIcon />}
			imagePath="/static/images/card-pic-viva.jpg"
			outlined={outlined}
		>
			O seguro de vida da sua vida e das pessoas da sua vida.
		</CatalogCard>
	)
}
