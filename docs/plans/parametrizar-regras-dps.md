# Parametrizar Regras de Idade e Tipo de Produto no Sistema DPS

## Contexto

Atualmente o sistema usa valores hardcoded (18-80 anos) e comparações diretas com strings ('HDI Home Equity') espalhadas pelo código. O objetivo é centralizar todas as regras em constantes configuráveis.

## Diferenças entre produtos:

- **Habitacional**: Idade 18-80 anos, 25 questões de saúde
- **Home Equity**: Idade 18-75 anos, 26 questões de saúde (inclui pergunta sobre câncer)

## Arquivos a serem modificados

### 1. Criar constantes centralizadas (src/constants/index.ts)

Adicionar após as constantes de estados:

- Definir `DPS_PRODUCTS` com configurações de cada tipo (HABITACIONAL, HOME_EQUITY)
- Incluir: MAX_AGE, PRODUCT_NAMES (array de nomes possíveis), TYPE
- Definir `DPS_AGE_LIMITS` com MIN_AGE e referências aos limites de cada produto
- Criar funções utilitárias:
- `getProductType(productName: string)`: retorna 'HABITACIONAL' | 'HOME_EQUITY'
- `getMaxAgeByProduct(productName: string)`: retorna 75 ou 80
- `isHomeEquityProduct(productName: string)`: retorna boolean

### 2. Atualizar formulário de perfil (src/app/(logged-area)/dps/fill-out/components/dps-profile-form.tsx)

- Importar constantes e funções utilitárias
- Modificar `dpsProfileForm`:
- Linha 51: Substituir `18 && actualAge <= 80` por `DPS_AGE_LIMITS.MIN_AGE && actualAge <= DPS_AGE_LIMITS.HABITACIONAL_MAX_AGE`
- Linha 53: Atualizar mensagem usando constantes
- Modificar `createDpsProfileFormWithDeadline` para aceitar `productName?: string`:
- Linhas 101-103: Usar `getMaxAgeByProduct(productName)` em vez de hardcoded
- Linhas 120-123: Aplicar mesma lógica na validação de idade final
- Atualizar mensagens de erro dinamicamente:
  - Habitacional: "Idade deve estar entre 18 e 80 anos." / "A idade final do coparticipante não pode exceder 80 anos até o fim do contrato."
  - Home Equity: "Idade deve estar entre 18 e 75 anos." / "A idade final do coparticipante não pode exceder 75 anos até o fim do contrato."
- Modificar `createDpsProfileFormWithParticipants`:
- Linha 175: Usar constantes em vez de hardcoded
- Linha 176: Atualizar mensagem usando constantes

### 3. Atualizar formulário de produto (src/app/(logged-area)/dps/fill-out/components/dps-product-form.tsx)

- Importar constantes e funções utilitárias
- Modificar `createDpsProductFormWithAge` para aceitar `productName?: string`:
- Linha 731: Substituir `finalAge <= 80` por `finalAge <= getMaxAgeByProduct(productName || '')`
- Linha 733: Atualizar mensagem dinamicamente baseada no produto:
  - Habitacional: "A idade final do proponente não pode exceder 80 anos até o fim do contrato."
  - Home Equity: "A idade final do proponente não pode exceder 75 anos até o fim do contrato."
- Modificar modal de alerta (linhas 104-111):
- Usar constantes em vez de valores hardcoded na mensagem

### 4. Atualizar formulário inicial (src/app/(logged-area)/dps/fill-out/components/dps-initial-form.tsx)

- Importar constantes e funções utilitárias
- Adicionar `watch` para monitorar produto selecionado: `const watchProduct = watch('product.product')`
- Criar função auxiliar `getProductName` usando `productOptions` para converter UID em nome
- Modificar `createDynamicSchema` para aceitar `productName?: string` e passar para schemas filhos
- Atualizar `useEffect` (linhas 359-378) para incluir `watchProduct` como dependência
- Modificar `validateAgeWithDeadline` para aceitar `productName?: string`:
- Usar `getMaxAgeByProduct(productName)` em vez de hardcoded 80
- Atualizar mensagem dinamicamente:
  - Habitacional: "A idade final do proponente (X anos) não pode exceder 80 anos ao fim da operação."
  - Home Equity: "A idade final do proponente (X anos) não pode exceder 75 anos ao fim da operação."
- No `onSubmit`:
- Obter nome do produto: `const currentProductName = getProductName(v.product.product)`
- Passar `currentProductName` nas validações de idade

### 5. Substituir comparações diretas de strings (src/app/(logged-area)/dps/fill-out/components/dps-form.tsx)

- Importar função utilitária `isHomeEquityProduct`
- Linha 107: Substituir `initialProposalData.product.name === 'HDI Home Equity'` por `isHomeEquityProduct(initialProposalData.product.name)`

### 6. Substituir comparações no formulário de saúde (src/app/(logged-area)/dps/fill-out/components/dps-health-form.tsx)

- Importar função utilitária `isHomeEquityProduct`
- Linha 177: Substituir `productName === 'HDI Home Equity'` por `isHomeEquityProduct(productName)`
- Linha 188: Mesma substituição
- Linha 233: Mesma substituição
- Linha 236: Mesma substituição

## Validações esperadas

- Idade validada em tempo real ao preencher data de nascimento
- Prazo validado ao alterar campo, considerando idade final
- Produto Home Equity: bloqueia se idade > 75 ou idade final > 75
- Produto Habitacional: bloqueia se idade > 80 ou idade final > 80
- Mensagens de erro específicas para cada limite:
  - **Habitacional**: "Idade deve estar entre 18 e 80 anos" / "A idade final do proponente não pode exceder 80 anos até o fim do contrato"
  - **Home Equity**: "Idade deve estar entre 18 e 75 anos" / "A idade final do proponente não pode exceder 75 anos até o fim do contrato"

## Observações

- Preparado para futura integração com backend (estrutura facilita substituição)
- Fácil adicionar novos produtos ou modificar regras existentes
- Mantém compatibilidade com formulários de saúde diferenciados (25 vs 26 questões)

## To-dos

- [ ] Criar constantes DPS_PRODUCTS, DPS_AGE_LIMITS e funções utilitárias em src/constants/index.ts
- [ ] Atualizar validações de idade em dps-profile-form.tsx usando constantes
- [ ] Atualizar validações de prazo e idade final em dps-product-form.tsx
- [ ] Adicionar monitoramento de produto e validações dinâmicas em dps-initial-form.tsx
- [ ] Substituir comparações diretas de string por funções utilitárias em dps-form.tsx e dps-health-form.tsx
- [ ] Testar validações para ambos produtos (Habitacional 18-80 anos, Home Equity 18-75 anos)

