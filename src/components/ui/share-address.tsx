import React from 'react'

/**
 * Interface representing address data from API
 */
export interface AddressData {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge?: string
  gia?: string
  ddd?: string
  siafi?: string
}

/**
 * Component for sharing address data between different parts of the application
 */
export const ShareAddress = ({ 
  address,
  children 
}: { 
  address: AddressData
  children: React.ReactNode 
}) => {
  return (
    <div className="address-data-provider">
      {children}
    </div>
  )
}

export default ShareAddress 