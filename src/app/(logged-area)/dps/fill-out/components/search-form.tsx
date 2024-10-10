'use client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import SelectComp from '@/components/ui/select-comp'
import { InferInput, minLength, nonEmpty, object, pipe, string } from 'valibot'
import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { SearchIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'

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
	return (
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
	)
}
