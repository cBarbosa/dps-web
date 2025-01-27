import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GoBackButton } from '@/components/ui/go-back-button'
import { CarIcon, CheckCircle2Icon, PlusIcon, Undo2Icon } from 'lucide-react'
import React from 'react'

function NominatePage() {
	return (
		<div className="p-5">
			<div className="p-7 w-full max-w-screen-xl mx-auto bg-white rounded-3xl">
				<GoBackButton className="-mt-5 px-0 pb-10">
					<Undo2Icon className="mr-2" />
					Voltar
				</GoBackButton>

				<div className="flex justify-center items-center p-3 w-fit aspect-square bg-bradesco-accent text-bradesco-foreground rounded-lg">
					<CarIcon size={40} />
				</div>

				<ul className="divide-y">
					<li>
						<Plan
							title="Bradesco Auto 1"
							description="Plano individual"
							coverage={[
								'Roubo e furto',
								'Incêndio e colisão',
								'Danos corporais e materiais',
							]}
							price={170}
						/>
					</li>
					<li>
						<Plan
							title="Bradesco Auto 2"
							description="Plano individual"
							coverage={[
								'Roubo e furto',
								'Incêndio e colisão',
								'Danos corporais e materiais',
								'Danos a vidros',
							]}
							price={200}
							recommended
						/>
					</li>
					<li>
						<Plan
							title="Bradesco Auto Frota"
							description="1-50 Veículos"
							coverage={[
								'Roubo e furto',
								'Incêndio e colisão',
								'Danos corporais e materiais',
								'Cobertura para motoristas',
							]}
							price={350}
						/>
					</li>
				</ul>
			</div>
		</div>
	)
}

export default NominatePage

function Plan({
	title,
	description,
	coverage,
	price,
	recommended = false,
}: {
	title: string
	description: string
	coverage: string[]
	price: number
	recommended?: boolean
}) {
	return (
		<div className="w-full flex gap-3 py-10 justify-between">
			<div className="basis-1/3">
				<h5 className="text-4xl font-semibold">{title}</h5>
				<Badge
					variant="outline"
					className="mt-5 p-3 text-base font-normal text-muted-foreground"
				>
					{description}
				</Badge>
			</div>

			<div className="px-8 py-3 bg-bradesco-accent/10 rounded-lg text-gray-700">
				<div className="font-semibold mb-3">Coberturas</div>
				<ul>
					{coverage.map((item, index) => (
						<li key={index + item} className="flex gap-3 items-center my-1">
							<CheckCircle2Icon size={20} />
							{item}
						</li>
					))}
				</ul>
			</div>

			<div className="flex flex-col justify-start gap-5 items-center">
				<div className="text-5xl font-semibold">
					<span className="text-3xl align-super">R$</span>
					{price},00
					<span className="ml-2 text-base text-muted-foreground font-normal align-middle">
						/mês
					</span>
				</div>
				<NominateButton filled={recommended} />
			</div>
		</div>
	)
}

function NominateButton({ filled }: { filled?: boolean }) {
	return filled ? (
		<Button
			variant={'default'}
			className="flex gap-2 justify-between py-5 px-4 border-none text-bradesco-foreground text-md bg-bradesco hover:bg-bradesco-accent hover:text-bradesco-foreground"
		>
			<span>Indicar</span>
			<PlusIcon size={18} />
		</Button>
	) : (
		<Button
			variant={'outline'}
			className="flex gap-2 justify-between py-5 px-4 border-bradesco text-bradesco text-md hover:bg-bradesco/5 hover:text-bradesco"
		>
			<span>Indicar</span>
			<PlusIcon size={18} />
		</Button>
	)
}
