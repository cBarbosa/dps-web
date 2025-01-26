'use client'
import { Button } from '@/components/ui/button'
import DatePicker from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import SelectComp from '@/components/ui/select-comp'
import ShareLine from '@/components/ui/share-line'
import { cn } from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { Loader2Icon, SearchIcon } from 'lucide-react'
import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
	custom,
	date,
	email,
	InferInput,
	maxValue,
	nonEmpty,
	object,
	pipe,
	string,
} from 'valibot'
import validateCpf from 'validar-cpf'
import { getOfferBasicDataByCpf, getOfferDataByUid } from '../../actions'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export const offerSearchForm = object({
	cpf: pipe(
		string(),
		nonEmpty('Campo obrigatório.'),
		custom(v => validateCpf(v as string), 'CPF inválido.')
	),
	name: pipe(string(), nonEmpty('Campo obrigatório.')),
	birthdate: pipe(
		date('Data inválida.'),
		maxValue(new Date(), 'Idade inválida.')
	),
	email: pipe(
		string(),
		nonEmpty('Campo obrigatório.'),
		email('Email inválido.')
	),
	phone: pipe(string(), nonEmpty('Campo obrigatório.')),
})

export type OfferSearchFormType = InferInput<typeof offerSearchForm>

function OfferSearchForm() {
	const session = useSession()
	const token = (session.data as any)?.accessToken

	const [isLoading, setIsLoading] = React.useState(false)

	const [searchedUid, setSearchedUid] = React.useState('')

	const router = useRouter()

	const {
		handleSubmit,
		getValues,
		trigger,
		setValue,
		watch,
		control,
		reset,
		formState: { isSubmitting, isSubmitted, errors, ...formStateRest },
	} = useForm<OfferSearchFormType>({
		resolver: valibotResolver(offerSearchForm),
		defaultValues: {
			cpf: '',
			name: '',
			birthdate: undefined,
			email: '',
			phone: '',
		},
	})

	const cpf = watch('cpf')
	const isValidCpf = validateCpf(cpf)

	const onSubmit = async (data: OfferSearchFormType) => {
		setIsLoading(true)
		if (searchedUid) router.push(`/offer/${searchedUid}`)
	}

	const completeDataByCpf = async () => {
		setIsLoading(true)
		const response = await getOfferBasicDataByCpf(token, cpf)

		if (response?.data) {
			setSearchedUid(response.data.uid)

			setValue('name', response.data.nome)
			setValue('birthdate', new Date(response.data.dataNascimento))
		}

		setIsLoading(false)

		console.log('data', response)
	}

	return (
		<div className="m-5">
			<div className="py-6 px-9 w-full max-w-screen-xl mx-auto bg-white rounded-3xl">
				<p className="mb-5">
					Para realizar a consulta das ofertas personalizadas, pesquise pelo CPF
				</p>
				<form
					onSubmit={e => {
						handleSubmit(onSubmit)(e)
					}}
					className={cn(
						'flex flex-col gap-6 w-full',
						isLoading ? 'opacity-60 pointer-events-none' : ''
					)}
				>
					<ShareLine>
						<Controller
							control={control}
							name="cpf"
							render={({ field: { onChange, onBlur, value, ref } }) => (
								<label>
									<div className="text-gray-500">CPF</div>
									<Input
										id="cpf"
										type="text"
										placeholder="999.999.999-99"
										mask="999.999.999-99"
										className={cn(
											'w-full px-4 py-6 rounded-lg',
											errors?.cpf &&
												'border-red-500 focus-visible:border-red-500'
										)}
										disabled={!!searchedUid}
										autoComplete="cpf"
										onChange={onChange}
										onBlur={onBlur}
										value={value}
										ref={ref}
									/>
									<div className="text-xs text-red-500">
										{errors?.cpf?.message}
									</div>
								</label>
							)}
						/>
						<div className="mt-6">
							{!searchedUid && (
								<Button
									className="p-2 h-12 w-12"
									disabled={!isValidCpf || isLoading}
									onClick={completeDataByCpf}
								>
									{isLoading ? (
										<Loader2Icon className="animate-spin" />
									) : (
										<SearchIcon />
									)}
								</Button>
							)}
						</div>
					</ShareLine>

					{searchedUid ? (
						<>
							<ShareLine>
								<Controller
									control={control}
									defaultValue=""
									name="name"
									render={({ field: { onChange, onBlur, value, ref } }) => (
										<label>
											<div className="text-gray-500">Nome do Proponente</div>
											<Input
												id="name"
												type="text"
												placeholder="Nome do proponente"
												className={cn(
													'w-full px-4 py-6 rounded-lg',
													errors?.name &&
														'border-red-500 focus-visible:border-red-500'
												)}
												disabled={!!watch('name')}
												autoComplete="name"
												onChange={onChange}
												onBlur={onBlur}
												value={value}
												ref={ref}
											/>
											<div className="text-xs text-red-500">
												{errors?.name?.message}
											</div>
										</label>
									)}
								/>

								<Controller
									control={control}
									name="birthdate"
									render={({ field: { onChange, onBlur, value, ref } }) => (
										<label>
											<div className="text-gray-500">Data de Nascimento</div>
											<DatePicker
												id="birthdate"
												placeholder="01/01/1999"
												className={cn(
													'w-full px-4 py-6 rounded-lg',
													errors?.birthdate &&
														'border-red-500 focus-visible:border-red-500'
												)}
												disabled={!isNaN(watch('birthdate')?.getTime())}
												onChange={onChange}
												onBlur={onBlur}
												value={value}
												ref={ref}
											/>
											<div className="text-xs text-red-500">
												{errors?.birthdate?.message}
											</div>
										</label>
									)}
								/>
							</ShareLine>

							<ShareLine>
								<Controller
									control={control}
									defaultValue=""
									name="email"
									render={({ field: { onChange, onBlur, value, ref } }) => (
										<label>
											<div className="text-gray-500">E-mail</div>
											<Input
												id="email"
												type="email"
												placeholder="exemplo@email.com"
												className={cn(
													'w-full px-4 py-6 rounded-lg',
													errors?.email &&
														'border-red-500 focus-visible:border-red-500'
												)}
												autoComplete="email"
												disabled={isSubmitting}
												onChange={onChange}
												onBlur={onBlur}
												value={value}
												ref={ref}
											/>
											<div className="text-xs text-red-500">
												{errors?.email?.message}
											</div>
										</label>
									)}
								/>
								<Controller
									control={control}
									defaultValue=""
									name="phone"
									render={({ field: { onChange, onBlur, value, ref } }) => (
										<label>
											<div className="text-gray-500">Telefone</div>
											<Input
												id="phone"
												type="text"
												placeholder="(99) 99999-9999"
												mask="(99) 99999-9999"
												className={cn(
													'w-full px-4 py-6 rounded-lg',
													errors?.phone &&
														'border-red-500 focus-visible:border-red-500'
												)}
												autoComplete="phone"
												disabled={isSubmitting}
												onChange={onChange}
												onBlur={onBlur}
												value={value}
												ref={ref}
											/>
											<div className="text-xs text-red-500">
												{errors?.phone?.message}
											</div>
										</label>
									)}
								/>
							</ShareLine>

							<Button
								type="submit"
								className="w-40 mt-3 bg-bradesco text-bradesco-foreground"
								disabled={isSubmitting || isLoading}
							>
								Buscar
								{isLoading ? (
									<Loader2Icon className="ml-2 h-4 w-4 animate-spin" />
								) : null}
							</Button>
						</>
					) : null}
				</form>
			</div>
		</div>
	)
}

export default OfferSearchForm
