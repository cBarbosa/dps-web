'use client'

import { Button } from '@/components/ui/button'
import {
	calculateAge,
	cn,
	getProfissionDescription,
	RecursivePartial,
} from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { InferInput, object } from 'valibot'
import { getProponentDataByCpf, postProposal } from '../../actions'
import { useRouter } from 'next/navigation'
import DpsProfileForm, {
	DpsProfileFormType,
	dpsProfileForm,
} from './dps-profile-form'
import DpsProductForm, {
	convertCapitalValue,
	dpsProductForm,
	DpsProductFormType,
} from './dps-product-form'
import { Loader2Icon } from 'lucide-react'
import DpsAddressForm, {
	dpsAddressForm,
	DpsAddressFormType,
} from './dps-address-form'
import validarCpf from 'validar-cpf'

export const dpsInitialForm = object({
	profile: dpsProfileForm,
	product: dpsProductForm,
	address: dpsAddressForm,
})

export type DpsInitialForm = InferInput<typeof dpsInitialForm>

const DpsInitialForm = ({
	data,
	prazosOptions: prazosOptionsProp,
	productOptions,
	tipoImovelOptions,
}: {
	data?: RecursivePartial<DpsInitialForm>
	prazosOptions: {
		value: string
		label: string
	}[]
	productOptions: {
		value: string
		label: string
	}[]
	tipoImovelOptions: {
		value: string
		label: string
	}[]
}) => {
	const session = useSession()
	const token = (session.data as any)?.accessToken

	const [isLoading, setIsLoading] = useState(false)
	const [isLoadingData, setIsLoadingData] = useState(false)

	const [prazosOptions, setPrazosOptions] = useState<
		{ value: string; label: string }[]
	>([])

	const {
		handleSubmit,
		getValues,
		trigger,
		setValue,
		watch,
		control,
		reset,
		formState: { isSubmitting, isSubmitted, errors, ...formStateRest },
	} = useForm<DpsInitialForm>({
		resolver: valibotResolver(dpsInitialForm),
		defaultValues: {
			profile: {
				cpf: data?.profile?.cpf ?? '',
				name: data?.profile?.name ?? '',
				birthdate: data?.profile?.birthdate as Date,
				profession: data?.profile?.profession ?? '',
				email: data?.profile?.email ?? '',
				phone: data?.profile?.phone ?? '',
				socialName: data?.profile?.socialName ?? '',
				gender: data?.profile?.gender ?? '',
			},
		},
		disabled: isLoading || isLoadingData,
	})

	const formState = { ...formStateRest, errors, isSubmitting, isSubmitted }

	const watchBirthdate = watch('profile.birthdate')

	useEffect(() => {
		const age = calculateAge(watchBirthdate)

		if (age === null) return

		switch (true) {
			case age < 18:
				setPrazosOptions([])
				break
			case age <= 50:
				setPrazosOptions(prazosOptionsProp)
				break
			case age <= 55:
				setPrazosOptions(
					prazosOptionsProp.filter(prazo => +getDigits(prazo.label) <= 180)
				)
				break
			case age <= 60:
				setPrazosOptions(
					prazosOptionsProp.filter(prazo => +getDigits(prazo.label) <= 150)
				)
				break
			case age <= 65:
				setPrazosOptions(
					prazosOptionsProp.filter(prazo => +getDigits(prazo.label) <= 84)
				)
				break
			case age <= 80:
				setPrazosOptions(
					prazosOptionsProp.filter(prazo => +getDigits(prazo.label) <= 60)
				)
				break
			default:
				setPrazosOptions([])
				break
		}
	}, [watchBirthdate, prazosOptionsProp])

	const router = useRouter()

	async function onSubmit(v: DpsInitialForm) {
		setIsLoading(true)

		const postData = {
			document: data?.profile?.cpf ?? v.profile.cpf,
			name: v.profile.name,
			socialName: v.profile.socialName ?? '',
			gender: v.profile.gender,
			cellphone: v.profile.phone,
			email: v.profile.email,
			birthDate: v.profile.birthdate.toISOString(),
			productId: v.product.product,
			profession: v.profile.profession ?? '',
			typeId: 2,
			deadlineId: Number(v.product.deadline),
			propertyTypeId: Number(v.product.propertyType),
			capitalMip: convertCapitalValue(v.product.mip) ?? 0,
			capitalDfi: convertCapitalValue(v.product.dfi) ?? 0,
			address: v.address,
		}

		const response = await postProposal(token, postData)

		if (response) {
			reset()
			if (response.success) {
				router.push('/dps/fill-out/form/' + response.data)
			} else {
				console.error(response.message)
				setIsLoading(false)
			}
		} else {
			setIsLoading(false)
		}
	}

	async function getDataByCpf(cpf: string) {
		if (!validarCpf(cpf)) return

		setIsLoadingData(true)
		const proponentDataRaw = await getProponentDataByCpf(cpf)

		if (proponentDataRaw) {
			const proponentDataBirthdateAux = proponentDataRaw?.detalhes.nascimento
				? proponentDataRaw?.detalhes.nascimento.split('/')
				: undefined

			const proponentDataBirthdate = proponentDataBirthdateAux
				? new Date(
						Number(proponentDataBirthdateAux[2]),
						Number(proponentDataBirthdateAux[1]) - 1,
						Number(proponentDataBirthdateAux[0])
				  )
				: undefined

			const autocompleteData = {
				cpf: proponentDataRaw?.detalhes.cpf,
				name: proponentDataRaw?.detalhes.nome,
				socialName: undefined,
				birthdate: proponentDataBirthdate,
				profession: proponentDataRaw?.detalhes.profissao,
				gender: proponentDataRaw?.detalhes.sexo,
				email: undefined,
				phone: undefined,
			}

			if (autocompleteData.name) setValue('profile.name', autocompleteData.name)
			if (autocompleteData.birthdate)
				setValue('profile.birthdate', autocompleteData.birthdate)
			if (autocompleteData.profession)
				setValue(
					'profile.profession',
					getProfissionDescription(autocompleteData.profession)
				)
			if (autocompleteData.email)
				setValue('profile.email', autocompleteData.email)
			if (autocompleteData.phone)
				setValue('profile.phone', autocompleteData.phone)
			if (autocompleteData.socialName)
				setValue('profile.socialName', autocompleteData.socialName)
			if (autocompleteData.gender)
				setValue('profile.gender', autocompleteData.gender)
		} else {
			console.error('Could not get proponent data by CPF')
		}
		setIsLoadingData(false)
	}

	return (
		<form
			onSubmit={e => {
				handleSubmit(onSubmit)(e)
			}}
			className={cn(
				'flex flex-col gap-6 w-full',
				isLoading ? 'opacity-60 pointer-events-none' : ''
			)}
		>
			<div className="p-9 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<DpsProfileForm
					data={data?.profile as Partial<DpsProfileFormType>}
					control={control}
					formState={formState}
					getDataByCpf={getDataByCpf}
					disabled={isLoadingData}
				/>
			</div>

			<div className="px-9 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<DpsProductForm
					data={data?.product as Partial<DpsProductFormType>}
					prazosOptions={prazosOptions}
					productOptions={productOptions}
					tipoImovelOptions={tipoImovelOptions}
					control={control}
					formState={formState}
				/>

				<DpsAddressForm
					data={data?.address as Partial<DpsAddressFormType>}
					control={control}
					formState={formState}
					setValue={setValue}
				/>

				<Button
					type="submit"
					className="w-40 mt-10"
					disabled={isSubmitting || isLoading}
				>
					Salvar
					{isLoading ? (
						<Loader2Icon className="ml-2 h-4 w-4 animate-spin" />
					) : null}
				</Button>
			</div>
		</form>
	)
}

export default DpsInitialForm

function getDigits(value: string) {
	return value.replace(/[^0-9]/g, '')
}
