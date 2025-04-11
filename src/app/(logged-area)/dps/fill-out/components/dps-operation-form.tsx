'use client'

import { Input } from '@/components/ui/input'
import ShareLine from '@/components/ui/share-line'
import { cn, maskToBrlCurrency } from '@/lib/utils'
import React from 'react'
import { Control, Controller, FormState } from 'react-hook-form'
import { InferInput, nonEmpty, object, pipe, string, optional, custom } from 'valibot'
import { DpsInitialForm } from './dps-initial-form'

export const dpsOperationForm = object({
  operationNumber: pipe(string(), nonEmpty('Campo obrigatório.')),
  participantsNumber: pipe(string(), nonEmpty('Campo obrigatório.')),
  totalValue: pipe(
    string(), 
    nonEmpty('Campo obrigatório.'),
    custom((value) => {
      // Extrair o valor numérico do formato de moeda
      const numValue = parseFloat((value as string).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      if (numValue < 1) return false;
      return true;
    }, 'Valor mínimo: R$ 1,00.'),
    custom((value) => {
      // Extrair o valor numérico do formato de moeda
      const numValue = parseFloat((value as string).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      if (numValue > 10000000) return false;
      return true;
    }, 'Valor máximo: R$ 10.000.000,00.')
  ),
  isParticipantsNumberReadOnly: optional(string()),
  isTotalValueReadOnly: optional(string())
})

export type DpsOperationFormType = InferInput<typeof dpsOperationForm>

// Funções de validação separadas para usar no componente
const validateParticipantsNumber = (value: string): string | undefined => {
  const numValue = parseInt(value, 10);
  if (isNaN(numValue)) return 'Deve ser um número.';
  if (numValue < 1) return 'Deve ser no mínimo 1.';
  if (numValue > 200) return 'Deve ser no máximo 200.';
  return undefined;
};

const validateTotalValue = (value: string): string | undefined => {
  // Extrair o valor numérico do formato de moeda
  const numValue = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  if (numValue < 1) return 'Valor mínimo: R$ 1,00.';
  if (numValue > 10000000) return 'Valor máximo: R$ 10.000.000,00.';
  return undefined;
};

const DpsOperationForm = ({
  data,
  control,
  formState,
  onParticipantsChange,
  onTotalValueChange,
  disabled,
  onOperationNumberBlur,
  isLoadingOperationData
}: {
  data?: Partial<DpsOperationFormType>
  control: Control<DpsInitialForm>
  formState: FormState<DpsInitialForm>
  onParticipantsChange?: (value: string) => void
  onTotalValueChange?: (value: string) => void
  disabled?: boolean
  onOperationNumberBlur?: (value: string) => void
  isLoadingOperationData?: boolean
}) => {
  const errors = formState.errors?.operation
  
  // Adicionar estado para armazenar o valor anterior do número da operação
  const [previousOperationNumber, setPreviousOperationNumber] = React.useState<string>('');
  const [highlightMissing, setHighlightMissing] = React.useState<boolean>(false);
  
  // Manipulador genérico para quando campos perdem foco
  const handleFieldBlur = () => {
    // Ativar o destaque para campos não preenchidos
    setHighlightMissing(true);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <h3 className="text-primary text-lg">Dados da Operação</h3>
      <ShareLine>
        <Controller
          control={control}
          defaultValue=""
          name="operation.operationNumber"
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <label>
              <div className="text-gray-500">Número da Operação</div>
              <div className="relative">
                <Input
                  id="operationNumber"
                  type="text"
                  placeholder="Número da Operação"
                  mask="99999999999999999"
                  className={cn(
                    'w-full px-4 py-6 rounded-lg',
                    errors?.operationNumber && 'border-red-500 focus-visible:border-red-500',
                    highlightMissing && !value && 'border-orange-400 bg-orange-50',
                    isLoadingOperationData ? 'opacity-70' : ''
                  )}
                  onChange={(e) => {
                    onChange(e);
                    // Não armazenamos o valor aqui para evitar atualizações frequentes
                  }}
                  onBlur={(e) => {
                    onBlur();
                    handleFieldBlur();
                    // Verificar se o valor mudou e se não está vazio antes de consultar
                    if (value && value !== previousOperationNumber && onOperationNumberBlur) {
                      console.log(`Valor mudou de "${previousOperationNumber}" para "${value}". Consultando dados...`);
                      // Armazenar o novo valor para comparações futuras
                      setPreviousOperationNumber(value);
                      // Chamar a função de consulta
                      onOperationNumberBlur(value);
                    } else if (value && value === previousOperationNumber) {
                      console.log(`Valor não mudou (${value}). Ignorando consulta.`);
                    }
                  }}
                  value={value}
                  ref={ref}
                  disabled={isLoadingOperationData || disabled}
                />
                {isLoadingOperationData && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
              <div className="text-xs text-red-500">{errors?.operationNumber?.message}</div>
            </label>
          )}
        />

        <Controller
          control={control}
          defaultValue=""
          name="operation.participantsNumber"
          render={({ field: { onChange, onBlur, value, ref } }) => {
            // Verificar se o campo deve estar em modo somente leitura - aceitar tanto boolean quanto string 'true'
            const isReadOnly = control._formValues?.operation?.isParticipantsNumberReadOnly === true || 
                               control._formValues?.operation?.isParticipantsNumberReadOnly === 'true';
            
            return (
              <label>
                <div className="text-gray-500">
                  Nº de Participante(s)
                  <span 
                    className="ml-1 inline-block cursor-help"
                    title="Este valor limita o número máximo de participantes"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20" 
                      fill="currentColor" 
                      className="w-4 h-4 text-blue-500"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-.75 3a.75.75 0 100 1.5.75.75 0 000-1.5z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </span>
                </div>
                <Input
                  id="participantsNumber"
                  type="text"
                  placeholder="Número de participantes"
                  mask="9999"
                  className={cn(
                    'w-full px-4 py-6 rounded-lg',
                    errors?.participantsNumber && 'border-red-500 focus-visible:border-red-500',
                    highlightMissing && !value && 'border-orange-400 bg-orange-50',
                    (isLoadingOperationData || isReadOnly) ? 'bg-gray-100 opacity-70' : ''
                  )}
                  onChange={(e) => {
                    onChange(e)
                    if (onParticipantsChange) onParticipantsChange(e.target.value)
                    // Validação adicional quando o valor muda
                    const error = validateParticipantsNumber(e.target.value);
                    if (error) {
                      // Exibir erro via formState.errors
                      formState.errors.operation = {
                        ...(formState.errors.operation || {}),
                        participantsNumber: {
                          type: 'manual',
                          message: error
                        }
                      };
                    }
                  }}
                  onBlur={(e) => {
                    onBlur();
                    handleFieldBlur();
                  }}
                  value={value}
                  ref={ref}
                  disabled={disabled || isLoadingOperationData || isReadOnly}
                />
                <div className="text-xs text-red-500">{errors?.participantsNumber?.message}</div>
              </label>
            );
          }}
        />
        
        <Controller
          control={control}
          defaultValue=""
          name="operation.totalValue"
          render={({ field: { onChange, onBlur, value, ref } }) => {
            // Verificar se o campo deve estar em modo somente leitura - aceitar tanto boolean quanto string 'true'
            const isReadOnly = control._formValues?.operation?.isTotalValueReadOnly === true || 
                               control._formValues?.operation?.isTotalValueReadOnly === 'true';
            
            return (
              <label>
                <div className="text-gray-500">
                  Valor Total da Operação
                </div>
                <Input
                  id="totalValue"
                  type="text"
                  placeholder="R$ 10.000.000,00"
                  mask="R$ 9999999999999"
                  beforeMaskedStateChange={maskToBrlCurrency}
                  className={cn(
                    'w-full px-4 py-6 rounded-lg',
                    errors?.totalValue && 'border-red-500 focus-visible:border-red-500',
                    highlightMissing && !value && 'border-orange-400 bg-orange-50',
                    (isLoadingOperationData || isReadOnly) ? 'bg-gray-100 opacity-70' : ''
                  )}
                  onChange={(e) => {
                    onChange(e)
                    if (onTotalValueChange) onTotalValueChange(e.target.value)
                    // Validação adicional quando o valor muda
                    const error = validateTotalValue(e.target.value);
                    if (error) {
                      // Exibir erro via formState.errors
                      formState.errors.operation = {
                        ...(formState.errors.operation || {}),
                        totalValue: {
                          type: 'manual',
                          message: error
                        }
                      };
                    }
                  }}
                  onBlur={(e) => {
                    onBlur();
                    handleFieldBlur();
                  }}
                  value={value}
                  ref={ref}
                  disabled={disabled || isLoadingOperationData || isReadOnly}
                />
                <div className="text-xs text-red-500">{errors?.totalValue?.message}</div>
              </label>
            );
          }}
        />
      </ShareLine>
    </div>
  )
}

export default DpsOperationForm 