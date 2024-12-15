'use client'
import { Button } from '@/components/ui/button'
import DatePicker from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import SelectComp from '@/components/ui/select-comp'
import ShareLine from '@/components/ui/share-line'
import { cn, RecursivePartial } from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useSession } from 'next-auth/react'
import React from 'react'
import { Controller, FormState, useForm } from 'react-hook-form'
import {
	custom,
	date,
	email,
	InferInput,
	maxValue,
	nonEmpty,
	object,
	optional,
	pipe,
	string,
} from 'valibot'
import validateCpf from 'validar-cpf'
import { postProposal } from '../../actions'
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

export const dpsInitialForm = object({
	profile: dpsProfileForm,
	product: dpsProductForm,
})

export type DpsInitialForm = InferInput<typeof dpsInitialForm>

const DpsInitialForm = ({
	data,
	prazosOptions,
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

	const {
		handleSubmit,
		getValues,
		trigger,
		setValue,
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
	})

	const formState = { ...formStateRest, errors, isSubmitting, isSubmitted }

	const router = useRouter()

	async function onSubmit(v: DpsInitialForm) {
		console.log('submitting', v)

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
		}
		console.log('submitting', token, postData)

		const response = await postProposal(token, postData)

		console.log('post proposal', response)

		if (response) {
			reset()
			if (response.success) {
				router.push('/dps/fill-out/form/' + response.data)
			} else {
				console.error(response.message)
			}
		}
	}

	return (
		<form
			onSubmit={e => {
				console.log('>', e)
				handleSubmit(onSubmit)(e)
			}}
			className="flex flex-col gap-6 w-full"
		>
			<div className="p-9 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<DpsProfileForm
					data={data?.profile as Partial<DpsProfileFormType>}
					control={control}
					formState={formState}
				/>
			</div>

			<div className="p-9 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<DpsProductForm
					data={data?.product as Partial<DpsProductFormType>}
					prazosOptions={prazosOptions}
					productOptions={productOptions}
					tipoImovelOptions={tipoImovelOptions}
					control={control}
					formState={formState}
				/>

				<Button type="submit" className="w-40 mt-10" disabled={isSubmitting}>
					Salvar
				</Button>
			</div>
		</form>
	)
}

export default DpsInitialForm
