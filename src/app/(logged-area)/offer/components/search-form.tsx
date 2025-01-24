'use client'
import { Button } from '@/components/ui/button'
import DatePicker from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import SelectComp from '@/components/ui/select-comp'
import ShareLine from '@/components/ui/share-line'
import { cn } from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { Loader2Icon } from 'lucide-react'
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
	gender: pipe(string(), nonEmpty('Campo obrigatório.')),
})

export type OfferSearchFormType = InferInput<typeof offerSearchForm>

const genderOptions = [
	{ value: 'M', label: 'Masculino' },
	{ value: 'F', label: 'Feminino' },
]

function OfferSearchForm() {
	const [isLoading, setIsLoading] = React.useState(false)

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
		// defaultValues: {
		// 	cpf: data?.profile?.cpf ?? '',
		// 	name: data?.profile?.name ?? '',
		// 	birthdate: data?.profile?.birthdate as Date,
		// 	email: data?.profile?.email ?? '',
		// 	phone: data?.profile?.phone ?? '',
		// 	gender: data?.profile?.gender ?? '',
		// },
	})

	const onSubmit = (data: OfferSearchFormType) => {
		console.log('onSubmit', data)
	}

	const completeDataOnCpfBlur = (e: any) => {
		//getDataByCpf(e.target.value)
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
										disabled={isSubmitting}
										autoComplete="cpf"
										onChange={onChange}
										onBlur={e => {
											completeDataOnCpfBlur(e)
											onBlur()
										}}
										value={value}
										ref={ref}
									/>
									<div className="text-xs text-red-500">
										{errors?.cpf?.message}
									</div>
								</label>
							)}
						/>
						<span></span>
					</ShareLine>

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
										disabled={isSubmitting}
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
										disabled={isSubmitting}
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

					<ShareLine>
						<Controller
							control={control}
							defaultValue=""
							name="gender"
							render={({ field: { onChange, value } }) => (
								<label>
									<div className="text-gray-500">Sexo</div>
									<SelectComp
										placeholder="Sexo"
										options={genderOptions}
										triggerClassName="p-4 h-12 rounded-lg"
										onValueChange={onChange}
										defaultValue={value}
										value={value}
										disabled={isSubmitting}
									/>
									<div className="text-xs text-red-500">
										{errors?.gender?.message}
									</div>
								</label>
							)}
						/>
						<span></span>
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
				</form>
			</div>
		</div>
	)
}

export default OfferSearchForm
