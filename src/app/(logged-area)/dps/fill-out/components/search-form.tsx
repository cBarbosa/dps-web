'use client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import SelectComp from '@/components/ui/select-comp'
import { InferInput, minLength, nonEmpty, object, pipe, string } from 'valibot'
import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { SearchIcon, UserIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import DpsProfileForm, { ProfileForm } from './dps-profile-form'
import { useState } from 'react'
import DpsHealthForm, { HealthForm } from './dps-health-form'

const searchSchema = object({
	cpf: string(),
	produto: string(),
	lmi: string(),
})

type SearchSchema = InferInput<typeof searchSchema>

export default function SearchForm() {
	const {
		handleSubmit,
		getValues,
		trigger,
		setValue,
		control,
		reset,
		formState: { isSubmitting, isSubmitted, ...formState },
	} = useForm<SearchSchema>({
		resolver: valibotResolver(searchSchema),
	})

	const params = useSearchParams()
	const router = useRouter()

	const [dpsData, setDpsData] = useState<{
		profile: ProfileForm | null
		health: HealthForm | null
	}>({
		profile: null,
		health: null,
	})

	const [step, setStep] = useState('profile')

	const options = [
		{ value: '1', label: 'Opção 1' },
		{ value: '2', label: 'Opção 2' },
		{ value: '3', label: 'Opção 3' },
	]

	function onSubmit(v: SearchSchema) {
		console.log(v)

		const searchParams = new URLSearchParams({
			cpf: v.cpf,
			produto: v.produto,
			lmi: v.lmi,
		})

		router.push(`/dps/fill-out?${searchParams.toString()}`)
	}

	function handleProfileSubmit(v: ProfileForm) {
		setDpsData(prev => ({ ...prev, profile: v }))
		setStep('health')
	}
	function handleHealthSubmit(v: HealthForm) {
		setDpsData(prev => ({ ...prev, health: v }))
	}

	return (
		<>
			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="mt-7 flex flex-row justify-between items-center gap-5">
					<div>
						<h3 className="text-primary font-semibold">Pesquisar CPF</h3>
						<span className="text-sm text-muted-foreground">
							Buscar dados do proponente
						</span>
					</div>
					<Controller
						control={control}
						defaultValue=""
						name="cpf"
						render={({ field: { onChange, onBlur, value, ref } }) => (
							<Input
								placeholder="000.000.000-00"
								mask="999.999.999-99"
								className="max-w-72 p-4 border-none rounded-xl"
								disabled={isSubmitting}
								onChange={onChange}
								onBlur={onBlur}
								value={value}
								ref={ref}
							/>
						)}
					/>

					<Controller
						control={control}
						defaultValue=""
						name="produto"
						render={({ field: { onChange, value } }) => (
							<SelectComp
								placeholder="Produto"
								options={options}
								allowClear
								triggerClassName="w-40 border-none rounded-xl"
								disabled={isSubmitting}
								onValueChange={onChange}
								defaultValue={value}
							/>
						)}
					/>

					<Controller
						control={control}
						defaultValue=""
						name="lmi"
						render={({ field: { onChange, value } }) => (
							<SelectComp
								placeholder="LMI"
								options={options}
								allowClear
								triggerClassName="w-40 border-none rounded-xl"
								disabled={isSubmitting}
								onValueChange={onChange}
								defaultValue={value}
							/>
						)}
					/>

					<Button type="submit" className="w-full max-w-32 p-4 rounded-xl">
						<SearchIcon size={18} className="mr-2" />
						Buscar
					</Button>
				</div>
			</form>

			{params.get('cpf') &&
				params.get('cpf') != '' &&
				(step === 'profile' ? (
					<div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
						<DpsProfileForm onSubmit={handleProfileSubmit} />
					</div>
				) : (
					<>
						<div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
							<DpsProfileData data={dpsData.profile!} />
						</div>
						<div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
							<DpsHealthForm onSubmit={handleHealthSubmit} />
						</div>
					</>
				))}
		</>
	)
}

function DpsProfileData({ data }: { data: ProfileForm }) {
	return (
		<div className="px-3">
			<h3 className="text-primary text-lg">Dados do Proponente</h3>

			<div className="flex gap-4 my-4">
				<UserIcon size={48} className="grow-0 mr-2 text-primary" />
				<div className="grow">
					<div className="flex gap-5 text-muted-foreground text-sm">
						<span>CPF: {data.cpf}</span>
						<span>
							Nascimento: {data.birthdate.toLocaleDateString('pt-BR')}
						</span>
					</div>
					<span className="text-lg font-semibold">{data.name}</span>
				</div>
				<span className="grow-0 text-xs text-muted-foreground">
					*dados recuperados automaticamente
				</span>
			</div>
		</div>
	)
}
