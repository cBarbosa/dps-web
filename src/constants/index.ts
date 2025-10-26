// Brazilian states for dropdown selection
export const states = [
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

// DPS Product Configuration
export const DPS_PRODUCTS = {
  HABITACIONAL: {
    MAX_AGE: 80,
    NAMES: ['Habitacional', 'HDI Habitacional'],
    TYPE: 'HABITACIONAL' as const
  },
  HOME_EQUITY: {
    MAX_AGE: 75,
    NAMES: ['HDI Home Equity', 'Home Equity'],
    TYPE: 'HOME_EQUITY' as const
  },
  CONSTRUCASA: {
    MAX_AGE: 80,
    NAMES: ['Construcasa', 'HDI Construcasa'],
    TYPE: 'CONSTRUCASA' as const
  }
} as const;

// DPS Age Limits
export const DPS_AGE_LIMITS = {
  MIN_AGE: 18,
  HABITACIONAL_MAX_AGE: DPS_PRODUCTS.HABITACIONAL.MAX_AGE,
  HOME_EQUITY_MAX_AGE: DPS_PRODUCTS.HOME_EQUITY.MAX_AGE,
  CONSTRUCASA_MAX_AGE: DPS_PRODUCTS.CONSTRUCASA.MAX_AGE
} as const;

// Função utilitária para identificar o tipo de produto
export const getProductType = (productName: string): 'HABITACIONAL' | 'HOME_EQUITY' | 'CONSTRUCASA' => {
  const isConstrucasa = DPS_PRODUCTS.CONSTRUCASA.NAMES.some(name => 
    productName.toLowerCase().includes(name.toLowerCase())
  );
  
  if (isConstrucasa) return 'CONSTRUCASA';
  
  const isHomeEquity = DPS_PRODUCTS.HOME_EQUITY.NAMES.some(name => 
    productName.toLowerCase().includes(name.toLowerCase())
  );
  
  return isHomeEquity ? 'HOME_EQUITY' : 'HABITACIONAL';
};

// Função utilitária para obter limite de idade baseado no nome do produto
export const getMaxAgeByProduct = (productName: string): number => {
  const productType = getProductType(productName);
  return DPS_PRODUCTS[productType].MAX_AGE;
};

// Função utilitária para verificar se é produto Home Equity
export const isHomeEquityProduct = (productName: string): boolean => {
  return getProductType(productName) === 'HOME_EQUITY';
};

// Função utilitária para verificar se é produto Habitacional
export const isHabitacionalProduct = (productName: string): boolean => {
  return getProductType(productName) === 'HABITACIONAL';
};

// Função utilitária para verificar se é produto Construcasa
export const isConstrucasaProduct = (productName: string): boolean => {
  return getProductType(productName) === 'CONSTRUCASA';
};

// Função utilitária para gerar mensagens de erro dinâmicas
export const getAgeErrorMessage = (productName: string): string => {
  const maxAge = getMaxAgeByProduct(productName);
  return `Idade deve estar entre ${DPS_AGE_LIMITS.MIN_AGE} e ${maxAge} anos.`;
};

export const getFinalAgeErrorMessage = (productName: string, participantType: string = 'proponente'): string => {
  const maxAge = getMaxAgeByProduct(productName);
  return `A idade final do ${participantType} não pode exceder ${maxAge} anos até o fim do contrato.`;
};

export const getFinalAgeWithYearsErrorMessage = (productName: string, participantType: string, finalAge: number): string => {
  const maxAge = getMaxAgeByProduct(productName);
  return `A idade final do ${participantType} (${Math.round(finalAge)} anos) não pode exceder ${maxAge} anos ao fim da operação.`;
}; 