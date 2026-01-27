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
    MIN_AGE: 18,
    NAMES: ['Habitacional', 'HDI Habitacional'],
    TYPE: 'HABITACIONAL' as const
  },
  HOME_EQUITY: {
    MAX_AGE: 75,
    MIN_AGE: 18,
    NAMES: ['HDI Home Equity', 'Home Equity'],
    TYPE: 'HOME_EQUITY' as const
  },
  CONSTRUCASA: {
    MAX_AGE: 80,
    MIN_AGE: 18,
    NAMES: ['Construcasa', 'HDI Construcasa'],
    TYPE: 'CONSTRUCASA' as const
  },
  FHE_POUPEX: {
    MAX_AGE: 80.5, // 80 anos e 6 meses
    MIN_AGE: 16,
    NAMES: ['FHE Poupex', 'FHE/Poupex'],
    TYPE: 'FHE_POUPEX' as const
  },
  MAG_HABITACIONAL: {
    MAX_AGE: 80.4375, // 80 anos + 5 meses + 29 dias ≈ 80.4375 anos
    MIN_AGE: 18,
    NAMES: ['MAG Habitacional', 'MAG Habitacional BANESE'],
    TYPE: 'MAG_HABITACIONAL' as const
  }
} as const;

// DPS Age Limits - Limites de idade final (anos, meses, dias) para garantir que não complete a idade limite
export const DPS_FINAL_AGE_LIMITS = {
  HABITACIONAL: { years: 79, months: 11, days: 29 }, // Não pode ter 80 completos
  HOME_EQUITY: { years: 74, months: 11, days: 29 }, // Não pode ter 75 completos
  CONSTRUCASA: { years: 79, months: 11, days: 29 }, // Não pode ter 80 completos
  FHE_POUPEX: { years: 80, months: 5, days: 29 }, // Não pode ter mais de 80 anos e 6 meses
  MAG_HABITACIONAL: { years: 80, months: 5, days: 29 } // Não pode ter mais de 80 anos, 5 meses e 29 dias
} as const;

// DPS Age Limits (mantido para compatibilidade)
export const DPS_AGE_LIMITS = {
  MIN_AGE: 18,
  HABITACIONAL_MAX_AGE: DPS_PRODUCTS.HABITACIONAL.MAX_AGE,
  HOME_EQUITY_MAX_AGE: DPS_PRODUCTS.HOME_EQUITY.MAX_AGE,
  CONSTRUCASA_MAX_AGE: DPS_PRODUCTS.CONSTRUCASA.MAX_AGE,
  FHE_POUPEX_MAX_AGE: DPS_PRODUCTS.FHE_POUPEX.MAX_AGE,
  MAG_HABITACIONAL_MAX_AGE: DPS_PRODUCTS.MAG_HABITACIONAL.MAX_AGE
} as const;

// DPS Capital Limits - Limites de capital por produto e idade
export const DPS_CAPITAL_LIMITS = {
  HABITACIONAL: 10_000_000, // R$ 10.000.000
  HOME_EQUITY: 10_000_000, // R$ 10.000.000
  CONSTRUCASA: 10_000_000, // R$ 10.000.000
  FHE_POUPEX: {
    // Limites variáveis por idade
    UNDER_60: 3_000_000, // 16 até <60 anos: até R$ 3.000.000
    OVER_60: 500_000, // ≥60 anos: até R$ 500.000
    ABSOLUTE_MAX: 3_000_000 // Teto absoluto: R$ 3.000.000
  },
  MAG_HABITACIONAL: {
    MIP: 5_000_000, // R$ 5.000.000
    DFI: 8_000_000  // R$ 8.000.000
  }
} as const;

// Função utilitária para identificar o tipo de produto
export const getProductType = (productName: string): 'HABITACIONAL' | 'HOME_EQUITY' | 'CONSTRUCASA' | 'FHE_POUPEX' | 'MAG_HABITACIONAL' => {
  const isMagHabitacional = DPS_PRODUCTS.MAG_HABITACIONAL.NAMES.some(name => 
    productName.toLowerCase().includes(name.toLowerCase())
  );
  
  if (isMagHabitacional) return 'MAG_HABITACIONAL';
  
  const isFhePoupex = DPS_PRODUCTS.FHE_POUPEX.NAMES.some(name => 
    productName.toLowerCase().includes(name.toLowerCase())
  );
  
  if (isFhePoupex) return 'FHE_POUPEX';
  
  const isConstrucasa = DPS_PRODUCTS.CONSTRUCASA.NAMES.some(name => 
    productName.toLowerCase().includes(name.toLowerCase())
  );
  
  if (isConstrucasa) return 'CONSTRUCASA';
  
  const isHomeEquity = DPS_PRODUCTS.HOME_EQUITY.NAMES.some(name => 
    productName.toLowerCase().includes(name.toLowerCase())
  );
  
  return isHomeEquity ? 'HOME_EQUITY' : 'HABITACIONAL';
};

// Tele interview thresholds by product type (capital above threshold triggers requirement)
export const TELE_INTERVIEW_THRESHOLDS_BY_PRODUCT_TYPE = {
  HABITACIONAL: 3_000_000,
  HOME_EQUITY: 3_000_000,
  CONSTRUCASA: 3_000_000,
} as const;

export const getTeleInterviewThresholdByProduct = (productName: string): number | undefined => {
  const productType = getProductType(productName);
  return TELE_INTERVIEW_THRESHOLDS_BY_PRODUCT_TYPE[
    productType as keyof typeof TELE_INTERVIEW_THRESHOLDS_BY_PRODUCT_TYPE
  ];
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

// Função utilitária para verificar se é produto FHE Poupex
export const isFhePoupexProduct = (productName: string): boolean => {
  return getProductType(productName) === 'FHE_POUPEX';
};

// Função utilitária para verificar se é produto MAG Habitacional
export const isMagHabitacionalProduct = (productName: string): boolean => {
  return getProductType(productName) === 'MAG_HABITACIONAL';
};

// Função utilitária para determinar tipo de DPS baseado no capital
export const getDpsTypeByCapital = (productName: string, capital: number): 'simplified' | 'complete' => {
  if (isMagHabitacionalProduct(productName)) {
    return capital <= 3_000_000 ? 'simplified' : 'complete';
  }
  return 'complete'; // Outros produtos sempre usam DPS completa
};

// Função utilitária para obter idade mínima baseado no nome do produto
export const getMinAgeByProduct = (productName: string): number => {
  const productType = getProductType(productName);
  return DPS_PRODUCTS[productType].MIN_AGE;
};

// Função utilitária para calcular idade final considerando meses e dias
export const calculateFinalAge = (birthDate: Date, deadlineMonths: number): { years: number, months: number, days: number } => {
  // Calcular a data final do contrato (hoje + prazo em meses)
  const today = new Date();
  const finalDate = new Date(today);
  finalDate.setMonth(finalDate.getMonth() + deadlineMonths);
  
  // Calcular a idade na data final do contrato
  let years = finalDate.getFullYear() - birthDate.getFullYear();
  let months = finalDate.getMonth() - birthDate.getMonth();
  let days = finalDate.getDate() - birthDate.getDate();
  
  // Ajustar se necessário
  if (days < 0) {
    months--;
    const lastMonth = new Date(finalDate.getFullYear(), finalDate.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months, days };
};

// Função utilitária para validar limite de idade final considerando meses e dias
export const validateFinalAgeLimit = (productName: string, birthDate: Date, deadlineMonths: number): boolean => {
  const productType = getProductType(productName);
  const limit = DPS_FINAL_AGE_LIMITS[productType];
  
  if (!limit) return true; // Se não houver limite específico, permite
  
  const finalAge = calculateFinalAge(birthDate, deadlineMonths);
  
  // Comparar anos primeiro
  if (finalAge.years < limit.years) return true;
  if (finalAge.years > limit.years) return false;
  
  // Se anos são iguais, comparar meses
  if (finalAge.months < limit.months) return true;
  if (finalAge.months > limit.months) return false;
  
  // Se meses são iguais, comparar dias
  return finalAge.days <= limit.days;
};

// Função utilitária para gerar mensagens de erro dinâmicas
export const getAgeErrorMessage = (productName: string): string => {
  const minAge = getMinAgeByProduct(productName);
  const maxAge = getMaxAgeByProduct(productName);
  return `Idade deve estar entre ${minAge} e ${maxAge} anos.`;
};

export const getFinalAgeErrorMessage = (productName: string, participantType: string = 'proponente'): string => {
  const productType = getProductType(productName);
  const limit = DPS_FINAL_AGE_LIMITS[productType];
  
  if (!limit) {
    const maxAge = getMaxAgeByProduct(productName);
    return `A idade final do ${participantType} não pode exceder ${maxAge} anos até o fim do contrato.`;
  }
  
  // Mensagem específica baseada no limite
  if (productType === 'FHE_POUPEX') {
    return `A idade final do ${participantType} não pode exceder 80 anos e 6 meses até o fim do contrato.`;
  } else if (productType === 'MAG_HABITACIONAL') {
    return `A idade final do ${participantType} não pode exceder 80 anos, 5 meses e 29 dias até o fim do contrato.`;
  } else if (productType === 'HOME_EQUITY') {
    return `A idade final do ${participantType} não pode exceder 75 anos até o fim do contrato.`;
  } else {
    return `A idade final do ${participantType} não pode exceder 80 anos até o fim do contrato.`;
  }
};

export const getFinalAgeWithYearsErrorMessage = (productName: string, participantType: string, finalAge: number): string => {
  const productType = getProductType(productName);
  const limit = DPS_FINAL_AGE_LIMITS[productType];
  
  if (!limit) {
    const maxAge = getMaxAgeByProduct(productName);
    return `A idade final do ${participantType} (${Math.round(finalAge)} anos) não pode exceder ${maxAge} anos ao fim da operação.`;
  }
  
  // Mensagem específica baseada no limite
  if (productType === 'FHE_POUPEX') {
    return `A idade final do ${participantType} (${Math.round(finalAge)} anos) não pode exceder 80 anos e 6 meses ao fim da operação.`;
  } else if (productType === 'MAG_HABITACIONAL') {
    return `A idade final do ${participantType} (${Math.round(finalAge)} anos) não pode exceder 80 anos, 5 meses e 29 dias ao fim da operação.`;
  } else if (productType === 'HOME_EQUITY') {
    return `A idade final do ${participantType} (${Math.round(finalAge)} anos) não pode exceder 75 anos ao fim da operação.`;
  } else {
    return `A idade final do ${participantType} (${Math.round(finalAge)} anos) não pode exceder 80 anos ao fim da operação.`;
  }
};

// Função utilitária para obter limite máximo de capital baseado no produto e idade
export const getMaxCapitalByProduct = (productName: string, age?: number, type?: 'MIP' | 'DFI'): number => {
  const productType = getProductType(productName);
  
  if (productType === 'MAG_HABITACIONAL') {
    if (type === 'DFI') {
      return DPS_CAPITAL_LIMITS.MAG_HABITACIONAL.DFI;
    }
    return DPS_CAPITAL_LIMITS.MAG_HABITACIONAL.MIP;
  }
  
  if (productType === 'FHE_POUPEX') {
    if (age === undefined || age === null) {
      // Se não tiver idade, retorna o teto absoluto
      return DPS_CAPITAL_LIMITS.FHE_POUPEX.ABSOLUTE_MAX;
    }
    
    if (age >= 60) {
      return DPS_CAPITAL_LIMITS.FHE_POUPEX.OVER_60;
    } else {
      return DPS_CAPITAL_LIMITS.FHE_POUPEX.UNDER_60;
    }
  }
  
  // Para outros produtos, retorna o limite fixo
  return DPS_CAPITAL_LIMITS[productType];
};

// Função utilitária para validar limite de capital
export const validateCapitalLimit = (
  productName: string, 
  capitalValue: number, 
  age?: number,
  type?: 'MIP' | 'DFI'
): { valid: boolean, maxAllowed: number, message?: string } => {
  const maxAllowed = getMaxCapitalByProduct(productName, age, type);
  const valid = capitalValue <= maxAllowed;
  
  if (!valid) {
    const message = getCapitalErrorMessage(productName, age, type);
    return { valid: false, maxAllowed, message };
  }
  
  return { valid: true, maxAllowed };
};

// Função utilitária para gerar mensagem de erro de capital
export const getCapitalErrorMessage = (productName: string, age?: number, type?: 'MIP' | 'DFI'): string => {
  const productType = getProductType(productName);
  const maxAllowed = getMaxCapitalByProduct(productName, age, type);
  
  if (productType === 'MAG_HABITACIONAL') {
    const maxInMillions = maxAllowed / 1_000_000;
    return `Capital máximo ${type === 'DFI' ? 'DFI' : 'MIP'} R$ ${maxInMillions.toFixed(0)}.000.000,00`;
  }
  
  if (productType === 'FHE_POUPEX') {
    if (age !== undefined && age !== null && age >= 60) {
      return `Capital máximo R$ ${(maxAllowed / 1_000_000).toFixed(1)} milhões para segurados com 60 anos ou mais.`;
    } else {
      return `Capital máximo R$ ${(maxAllowed / 1_000_000).toFixed(1)} milhões para segurados entre 16 e 59 anos.`;
    }
  }
  
  // Para outros produtos - formatar como R$ X.000.000,00
  const maxInMillions = maxAllowed / 1_000_000;
  if (maxInMillions >= 1) {
    return `Capital máximo R$ ${maxInMillions.toFixed(0)}.000.000,00`;
  }
  return `Capital máximo R$ ${maxAllowed.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}; 