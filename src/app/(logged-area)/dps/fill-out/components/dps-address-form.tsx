import ShareLine from "@/components/ui/share-line";
import { Control, Controller, FormState, UseFormSetValue, UseFormTrigger } from "react-hook-form";
import { InferInput, maxLength, nonEmpty, object, pipe, string } from "valibot";
import { DpsInitialForm } from "./dps-initial-form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getAddressByZipcode } from "../../actions";
import SelectComp from "@/components/ui/select-comp";

export const dpsAddressForm = object({
	zipcode: pipe(string(), nonEmpty('Campo obrigatório.')),
    street: pipe(string(), nonEmpty('Campo obrigatório.'), maxLength(155, `Não pode exceder o máximo de 155 caracteres`)),
	number: pipe(string(), maxLength(30, `Não pode exceder o máximo de 30 caracteres`)),
    complement: pipe(string(), maxLength(100, `Não pode exceder o máximo de 100 caracteres`)),
    neighborhood: pipe(string(), nonEmpty('Campo obrigatório.'), maxLength(155, `Não pode exceder o máximo de 155 caracteres`)),
    city: pipe(string(), nonEmpty('Campo obrigatório.'), maxLength(155, `Não pode exceder o máximo de 155 caracteres`)),
    state: pipe(string(), nonEmpty('Campo obrigatório.'))
});

export type DpsAddressFormType = InferInput<typeof dpsAddressForm>;

const DpsAddressForm = ({
    data,
	control,
	formState,
    setValue
}: {
    data?: Partial<DpsAddressFormType>
    control: Control<DpsInitialForm>
    formState: FormState<DpsInitialForm>
    setValue: UseFormSetValue<DpsInitialForm>
}) => {

    const statesOptions = [
        { value: 'AC', label: 'Acre' },
        { value: 'AL', label: 'Alagoas' },
        { value: 'AP', label: 'Amapá' },
        { value: 'AM', label: 'Amazonas' },
        { value: 'BA', label: 'Bahia' },
        { value: 'CE', label: 'Ceará' },
        { value: 'DF', label: 'Distrito Federal' },
        { value: 'ES', label: 'Espírito Santo' },
        { value: 'GO', label: 'Goiás' },
        { value: 'MA', label: 'Maranhão' },
        { value: 'MT', label: 'Mato Grosso' },
        { value: 'MS', label: 'Mato Grosso do Sul' },
        { value: 'MG', label: 'Minas Gerais' },
        { value: 'PA', label: 'Pará' },
        { value: 'PB', label: 'Paraíba' },
        { value: 'PR', label: 'Paraná' },
        { value: 'PE', label: 'Pernambuco' },
        { value: 'PI', label: 'Piauí' },
        { value: 'RJ', label: 'Rio de Janeiro' },
        { value: 'RN', label: 'Rio Grande do Norte' },
        { value: 'RS', label: 'Rio Grande do Sul' },
        { value: 'RO', label: 'Rondônia' },
        { value: 'RR', label: 'Roraima' },
        { value: 'SC', label: 'Santa Catarina' },
        { value: 'SP', label: 'São Paulo' },
        { value: 'SE', label: 'Sergipe' },
        { value: 'TO', label: 'Tocantins' }
    ];

    const errors = formState.errors?.address;

    const handleAddress = async (zipcode: string):Promise<void> => {
        const res = await getAddressByZipcode(zipcode);

        if(!res) return;

        setValue(`address.street`, res?.logradouro ?? ``);
        setValue(`address.complement`, res?.complemento ?? ``);
        setValue(`address.neighborhood`, res?.bairro ?? ``);
        setValue(`address.city`, res?.localidade ?? ``);
        setValue(`address.state`, res?.uf ?? ``);
    };

    return(
        <div className="flex flex-col gap-6 w-full pt-8">
			<h3 className="text-primary text-lg">Dados de Endereço</h3>

            <ShareLine>
                <Controller
					control={control}
					defaultValue=""
					name="address.zipcode"
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">CEP</div>
							<Input
								id="zipcode"
								type="text"
								placeholder="99999-999"
								mask="99999-999"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.zipcode && 'border-red-500 focus-visible:border-red-500'
								)}
								autoComplete="zipcode"
								onChange={onChange}
								onBlur={(event) => handleAddress(event.target.value)}
								value={value}
								ref={ref}
							/>
							<div className="text-xs text-red-500">{errors?.zipcode?.message}</div>
						</label>
					)}
				/>

                <Controller
					control={control}
					defaultValue=""
					name="address.street"
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Endereço</div>
							<Input
								id="street"
								type="text"
								placeholder="Logradouro"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.street && 'border-red-500 focus-visible:border-red-500'
								)}
								autoComplete="street"
								onChange={onChange}
								onBlur={onBlur}
								value={value}
								ref={ref}
                                maxLength={155}
							/>
							<div className="text-xs text-red-500">{errors?.street?.message}</div>
						</label>
					)}
				/>

            </ShareLine>

            <ShareLine>
                <Controller
					control={control}
					defaultValue=""
					name="address.number"
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Número</div>
							<Input
								id="number"
								type="text"
								placeholder="número"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.number && 'border-red-500 focus-visible:border-red-500'
								)}
								autoComplete="number"
								onChange={onChange}
								onBlur={onBlur}
								value={value}
								ref={ref}
                                maxLength={30}
							/>
							<div className="text-xs text-red-500">{errors?.number?.message}</div>
						</label>
					)}
				/>

                <Controller
					control={control}
					defaultValue=""
					name="address.complement"
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Complemento</div>
							<Input
								id="complement"
								type="text"
								placeholder="Complemento"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.complement && 'border-red-500 focus-visible:border-red-500'
								)}
								autoComplete="street"
								onChange={onChange}
								onBlur={onBlur}
								value={value}
								ref={ref}
                                maxLength={100}
							/>
							<div className="text-xs text-red-500">{errors?.complement?.message}</div>
						</label>
					)}
				/>

            </ShareLine>

            <ShareLine>
                <Controller
					control={control}
					defaultValue=""
					name="address.neighborhood"
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Bairro</div>
							<Input
								id="neighborhood"
								type="text"
								placeholder="Bairro"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.neighborhood && 'border-red-500 focus-visible:border-red-500'
								)}
								autoComplete="neighborhood"
								onChange={onChange}
								onBlur={onBlur}
								value={value}
								ref={ref}
                                maxLength={155}
							/>
							<div className="text-xs text-red-500">{errors?.neighborhood?.message}</div>
						</label>
					)}
				/>

                <Controller
					control={control}
					defaultValue=""
					name="address.city"
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Cidade</div>
							<Input
								id="city"
								type="text"
								placeholder="Cidade"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.city && 'border-red-500 focus-visible:border-red-500'
								)}
								autoComplete="city"
								onChange={onChange}
								onBlur={onBlur}
								value={value}
								ref={ref}
                                maxLength={155}
							/>
							<div className="text-xs text-red-500">{errors?.city?.message}</div>
						</label>
					)}
				/>

            </ShareLine>

            <ShareLine>
                <Controller
                    control={control}
                    defaultValue=""
                    name="address.state"
                    render={({ field: { onChange, value } }) => (
                        <label>
                            <div className="text-gray-500">Estado</div>
                            <SelectComp
                                placeholder="Estado"
                                options={statesOptions}
                                triggerClassName="p-4 h-12 rounded-lg"
                                onValueChange={onChange}
                                defaultValue={value}
                                value={value}
                            />
                            <div className="text-xs text-red-500">
                                {errors?.state?.message}
                            </div>
                        </label>
                    )}
                />

                <div></div>
            </ShareLine>
        </div>
    );
};

export default DpsAddressForm;
