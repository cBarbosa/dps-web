'use client'

import { Input } from '@/components/ui/input'
import ShareLine from '@/components/ui/share-line'
import { cn } from '@/lib/utils'
import React from 'react'
import { Control, Controller, FormState } from 'react-hook-form'
import { InferInput, nonEmpty, object, pipe, string, optional } from 'valibot'
import { DpsInitialForm } from './dps-initial-form'

export const dpsOperationForm = object({
  operationNumber: pipe(string(), nonEmpty('Campo obrigatório.')),
  participantsNumber: pipe(string(), nonEmpty('Campo obrigatório.')),
  isParticipantsNumberReadOnly: optional(string()),
})

export type DpsOperationFormType = InferInput<typeof dpsOperationForm>

// Função de validação para número de participantes
const validateParticipantsNumber = (value: string): string | undefined => {
  const numValue = parseInt(value, 10);
  if (isNaN(numValue)) return 'Informe o número de participantes.';
  if (numValue < 1) return 'Deve ser informado ao menos um participante.';
  if (numValue > 200) return 'Deve ser informado no máximo 200 participantes.';
  return undefined;
};

const DpsOperationForm = ({
  data,
  control,
  formState,
  onParticipantsChange,
  disabled,
  onOperationNumberBlur,
  isLoadingOperationData
}: {
  data?: Partial<DpsOperationFormType>
  control: Control<DpsInitialForm>
  formState: FormState<DpsInitialForm>
  onParticipantsChange?: (value: string) => void
  disabled?: boolean
  onOperationNumberBlur?: (value: string) => void
  isLoadingOperationData?: boolean
}) => {
  const errors = formState.errors?.operation
  
  // Estado para armazenar o valor anterior do número da operação
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
              <div className="text-gray-500">Número da Operação <span className="text-red-500">*</span></div>
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
            // Verificar se o campo deve estar em modo somente leitura
            const isReadOnly = control._formValues?.operation?.isParticipantsNumberReadOnly === true || 
                               control._formValues?.operation?.isParticipantsNumberReadOnly === 'true';
            
            return (
              <label>
                <div className="text-gray-500">
                  Nº de Participante(s) <span className="text-red-500">*</span>
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
        
        {/* Campo removido: Valor Total da Operação */}
        {/* Agora o valor total será obtido do Capital MIP na seção de dados do produto */}
        
      </ShareLine>
    </div>
  )
}

export default DpsOperationForm 