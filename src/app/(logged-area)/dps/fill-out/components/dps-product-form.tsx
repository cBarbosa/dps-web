'use client'
import { Button } from '@/components/ui/button'
import DatePicker from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import SelectComp from '@/components/ui/select-comp'
import ShareLine from '@/components/ui/share-line'
import { cn, maskToBrlCurrency } from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import React from 'react'
import { Control, Controller, FormState, useForm } from 'react-hook-form'
import { custom, InferInput, nonEmpty, object, pipe, string } from 'valibot'
import { useRouter } from 'next/navigation'
import { DpsInitialForm } from './dps-initial-form'

export const dpsProductForm = object({
	product: pipe(string(), nonEmpty('Campo obrigatório.')),
	lmi: pipe(string(), nonEmpty('Campo obrigatório.')),
	mip: pipe(string(), nonEmpty('Campo obrigatório.')),
	dfi: pipe(string(), nonEmpty('Campo obrigatório.')),
	propertyType: pipe(string(), nonEmpty('Campo obrigatório.')),
})

export type DpsProductFormType = InferInput<typeof dpsProductForm>

const propertyTypeOptions = [
	{
		value: '1',
		label: 'Residencial',
	},
	{
		value: '2',
		label: 'Comercial',
	},
]

const DpsProductForm = ({
	data,
	lmiOptions,
	productOptions,
	control,
	formState,
}: {
	data?: Partial<DpsProductFormType>
	lmiOptions: { value: string; label: string }[]
	productOptions: { value: string; label: string }[]
	control: Control<DpsInitialForm>
	formState: FormState<DpsInitialForm>
}) => {
	const router = useRouter()

	const errors = formState.errors?.product

	return (
		<div className="flex flex-col gap-6 w-full">
			<h3 className="text-primary text-lg">Dados do DPS</h3>
			<ShareLine>
				<Controller
					control={control}
					defaultValue=""
					name="product.product"
					render={({ field: { onChange, value } }) => (
						<label>
							<div className="text-gray-500">Produto</div>
							<SelectComp
								placeholder="Produto"
								options={productOptions}
								triggerClassName="p-4 h-12 rounded-lg"
								disabled={false}
								onValueChange={onChange}
								defaultValue={value}
							/>
							<div className="text-xs text-red-500">
								{errors?.product?.message}
							</div>
						</label>
					)}
				/>

				<Controller
					control={control}
					defaultValue=""
					name="product.lmi"
					render={({ field: { onChange, value } }) => (
						<label>
							<div className="text-gray-500">LMI</div>
							<SelectComp
								placeholder="LMI"
								options={lmiOptions}
								triggerClassName="p-4 h-12 rounded-lg"
								disabled={false}
								onValueChange={onChange}
								defaultValue={value}
							/>
							<div className="text-xs text-red-500">{errors?.lmi?.message}</div>
						</label>
					)}
				/>
			</ShareLine>
			<ShareLine>
				<Controller
					control={control}
					defaultValue=""
					name="product.mip"
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Capital MIP</div>
							<Input
								id="mip"
								type="text"
								placeholder="R$ 99.999,99"
								mask="R$ 99999999999999999"
								beforeMaskedStateChange={maskToBrlCurrency}
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.mip && 'border-red-500 focus-visible:border-red-500'
								)}
								autoComplete="mip"
								onChange={onChange}
								onBlur={onBlur}
								value={value}
								ref={ref}
							/>
							<div className="text-xs text-red-500">{errors?.mip?.message}</div>
						</label>
					)}
				/>

				<Controller
					control={control}
					defaultValue=""
					name="product.dfi"
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Capital DFI</div>
							<Input
								id="dfi"
								type="text"
								placeholder="R$ 99.999,99"
								mask="R$ 99999999999999999"
								beforeMaskedStateChange={maskToBrlCurrency}
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.dfi && 'border-red-500 focus-visible:border-red-500'
								)}
								autoComplete="dfi"
								onChange={onChange}
								onBlur={onBlur}
								value={value}
								ref={ref}
							/>
							<div className="text-xs text-red-500">{errors?.dfi?.message}</div>
						</label>
					)}
				/>
			</ShareLine>

			<ShareLine>
				<Controller
					control={control}
					defaultValue=""
					name="product.propertyType"
					render={({ field: { onChange, value } }) => (
						<label>
							<div className="text-gray-500">Tipo de Imóvel</div>
							<SelectComp
								placeholder="Tipo de Imóvel"
								options={propertyTypeOptions}
								triggerClassName="p-4 h-12 rounded-lg"
								onValueChange={onChange}
								defaultValue={value}
							/>
							<div className="text-xs text-red-500">
								{errors?.propertyType?.message}
							</div>
						</label>
					)}
				/>

				<div></div>
			</ShareLine>
		</div>
	)
}

export default DpsProductForm
