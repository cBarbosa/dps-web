<!-- 887781fb-808d-4335-97b9-995c595a8d16 f2ecb1a1-68fd-4b46-aab2-b843345d7a58 -->
# Modificar Regras de Idade dos Produtos DPS

## Objetivo

Atualizar as validações de idade para considerar meses e dias na idade final do contrato, garantindo que os limites não sejam ultrapassados. Adicionar suporte ao produto FHE/Poupex.

## Regras de Idade e Capital por Produto

### Habitacional

- Idade mínima: > 18 anos
- Idade final máxima: não pode ter mais que 79 anos, 11 meses e 29 dias ao final do contrato (garantir que não tenha 80 completos)
- Capital: até R$ 10.000.000 (já está correto no código)

### Home Equity

- Idade mínima: > 18 anos
- Idade final máxima: não pode ter mais que 74 anos, 11 meses e 29 dias ao final do contrato (garantir que não tenha 75 completos)
- Capital: até R$ 10.000.000 (já está correto no código)

### Construcasa

- Idade mínima: > 18 anos
- Idade final máxima: não pode ter mais que 79 anos, 11 meses e 29 dias ao final do contrato (garantir que não tenha 80 completos)
- Capital: até R$ 10.000.000 (já está correto no código)

### FHE Poupex

- Idade mínima: > 16 anos
- Idade final máxima: não pode ter mais que 80 anos, 5 meses e 29 dias ao final do contrato (garantir que não tenha mais de 80 anos e seis meses)
- Limites de capital de acordo com a idade atual do segurado:
- 16 até <60 anos: até R$ 3.000.000
- ≥60 anos: até R$ 500.000
- Teto absoluto: R$ 3.000.000
- Nome no sistema: "FHE Poupex"

## Implementação

### 1. Atualizar constantes (`src/constants/index.ts`)

- Adicionar produto FHE/Poupex em `DPS_PRODUCTS` com idade mínima 16 e configuração de idade máxima
- Criar estrutura para armazenar limites de idade final (anos, meses, dias) por produto
- Criar funções utilitárias para calcular e validar idade final considerando meses e dias:
- `calculateFinalAge(birthDate: Date, deadlineMonths: number): { years: number, months: number, days: number }`
- `validateFinalAgeLimit(productName: string, birthDate: Date, deadlineMonths: number): boolean`
- `getMinAgeByProduct(productName: string): number`
- Atualizar `getMaxAgeByProduct` para retornar limite em anos (para compatibilidade)
- Atualizar mensagens de erro para refletir os novos limites

### 2. Atualizar validações em `dps-profile-form.tsx`

- Modificar `dpsProfileForm` para usar idade mínima dinâmica (atualmente hardcoded 18)
- Modificar `createDpsProfileFormWithDeadline`:
- Usar `getMinAgeByProduct` para idade mínima
- Substituir validação simples de idade final por `validateFinalAgeLimit`
- Modificar `createDpsProfileFormWithParticipants`:
- Usar `getMinAgeByProduct` para idade mínima
- Adicionar validação de idade final se necessário

### 3. Atualizar validações em `dps-product-form.tsx`

- Modificar `createDpsProductFormWithAge`:
- Substituir validação simples de idade final por `validateFinalAgeLimit`
- Usar cálculo preciso de idade final com meses e dias

### 4. Atualizar validações em `dps-initial-form.tsx`

- Localizar validações manuais de idade final e substituir por `validateFinalAgeLimit`
- Atualizar mensagens de erro para usar as novas funções utilitárias

## Arquivos a Modificar

1. `src/constants/index.ts` - Adicionar constantes e funções utilitárias para idade e capital
2. `src/app/(logged-area)/dps/fill-out/components/dps-profile-form.tsx` - Atualizar validações de idade
3. `src/app/(logged-area)/dps/fill-out/components/dps-product-form.tsx` - Atualizar validações de idade e capital (MIP/DFI)
4. `src/app/(logged-area)/dps/fill-out/components/dps-initial-form.tsx` - Atualizar validações manuais de idade e capital

## Detalhes Técnicos

- A validação de idade final deve calcular a data exata de término do contrato (data de nascimento + prazo em meses)
- Comparar essa data com o limite máximo (ex: 79 anos, 11 meses e 29 dias)
- Garantir que a pessoa não complete a idade limite durante o contrato
- Para FHE/Poupex, considerar idade mínima de 16 anos (diferente dos outros produtos que são 18)