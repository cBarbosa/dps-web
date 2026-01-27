---
name: Editar operação DPS
overview: Adicionar botão "Editar operação" no detalhe do DPS (enquanto não assinado) e implementar uma tela de edição que envia 1 atualização por operação para o backend, que replica para todos os participantes.
todos:
  - id: add-edit-button
    content: Adicionar botão "Editar operação" no `DetailsPresent` com regra de bloqueio por assinatura e perfis vendedor/vendedor-sup.
    status: completed
  - id: add-operation-edit-route
    content: Criar rota `operation/[operationNumber]/edit` (server) para carregar dados da operação e autorizar acesso.
    status: completed
    dependencies:
      - add-edit-button
  - id: operation-edit-form
    content: Implementar formulário client com campos comuns, validações e UX (Salvar/Cancelar/Resumo).
    status: completed
    dependencies:
      - add-operation-edit-route
  - id: operation-update-action
    content: Adicionar action `putProposalOperationUpdate` em `actions.ts` para chamar endpoint do backend por operação.
    status: completed
    dependencies:
      - operation-edit-form
  - id: optional-operation-page-link
    content: (Opcional) Adicionar link/botão de edição na página `operation/[operationNumber]` também.
    status: completed
    dependencies:
      - operation-update-action
---

# Edição de Operação (DPS) + Atualização por Operação

## Objetivo

- Exibir o botão **Editar operação** no detalhe do DPS, disponível para **vendedor** e **vendedor-sup** enquanto **nenhum participante** do grupo estiver com DPS **assinada** (status 21).
- Implementar edição de atributos **comuns** (nível operação) com **1 request** para o backend (por `operationNumber/contractNumber`), deixando o backend replicar a atualização para o grupo de participantes.

## Decisões confirmadas

- **Perfis**: `vendedor` e `vendedor-sup`.
- **Campos editáveis**: todos os comuns **exceto** `typeId` (permanece fixo = 2).
- **Regra de bloqueio**: não permitir editar se qualquer participante estiver assinado (status 21).

## Escopo de campos comuns (UI + payload)

- **Editáveis**:
  - `productId`
  - `deadlineMonths` (e `deadlineId` se o backend exigir)
  - `propertyTypeId`
  - `operationValue`
  - `totalParticipantsExpected`
  - `salesChannelUid`
- **Fixos**:
  - `typeId: 2`

## Fluxo pro usuário

```mermaid
flowchart TD
  DetailsPage[DetailsPresent] -->|Click EditarOperacao| OperationEditPage[operation/[operationNumber]/edit]
  OperationEditPage -->|PUT v1/proposal/{operationNumber}| BackendUpdate[Backend: replica para proposals do grupo]
  BackendUpdate -->|success| DetailsRedirect[Redirect para details/{uidPrincipal}]
```

## Mudanças no frontend

### 1) Botão "Editar operação" no detalhe

- Arquivo: [`src/app/(logged-area)/dps/components/details-present.tsx`](src/app/\\\(logged-area)/dps/components/details-present.tsx)
- Implementar `canEditOperation` usando:
  - `role` (já existe)
  - `proposalData.history` (já existe)
  - `participants` (já é passado do server page)
  - `proposalData.riskStatus` e `proposalData.closed`
- Critério de bloqueio por assinatura:
  - `proposalData.status.id === 21` **ou** `proposalData.history.some(h => h.statusId === 21)` **ou** `participants.some(p => p.status?.id === 21)`
- Renderizar botão no bloco de ações (onde ficam Visualizar/Copiar/Excluir):
  - Link para `/dps/operation/${proposalData.contractNumber}/edit`

### 2) Nova rota: edição por operação

- Criar página: [`src/app/(logged-area)/dps/operation/[operationNumber]/edit/page.tsx`](src/app/(logged-area)/dps/operation/[operationNumber]/edit/page.tsx)
- Responsabilidades (server component):
  - Autenticação/autorização (mesmo padrão do projeto; ex.: `getServerSessionAuthorization(['vendedor','vendedor-sup'])`).
  - `getParticipantsByOperation(token, operationNumber)` para carregar os participantes.
  - Derivar um "snapshot" inicial dos campos comuns a partir do participante principal (`participantType === 'P'`) ou do primeiro item.
  - Passar dados para um componente client de formulário.

### 3) Formulário client de edição

- Criar componente (exemplo): [`src/app/(logged-area)/dps/operation/[operationNumber]/edit/components/operation-edit-form.tsx`](src/app/(logged-area)/dps/operation/[operationNumber]/edit/components/operation-edit-form.tsx)
- Implementar com `react-hook-form` + validação simples:
  - `deadlineMonths`: número (1..420; se produto MAG, 1..240)
  - `operationValue`: número > 0
  - `totalParticipantsExpected`: 1..200
  - `productId`: select via `getProductList`
  - `propertyTypeId`: select via `getTipoImovelOptions`
  - `salesChannelUid`: select a partir da sessão (usar `session.lastChannel` + `session.channels` que já existem no app)
- UX:
  - Mostrar um card "Resumo" com `operationNumber`, total de participantes encontrados, e alerta de bloqueio se detectar status 21.
  - Botões: **Salvar** (disabled enquanto submetendo), **Cancelar** (volta).

### 4) Nova action para update por operação

- Arquivo: [`src/app/(logged-area)/dps/actions.ts`](src/app/\\\(logged-area)/dps/actions.ts)
- Adicionar `putProposalOperationUpdate(token, operationNumber, body)` chamando:
  - `PUT` (ou `PATCH`, conforme backend definir) em `v1/proposal/${operationNumber}`
  - Body com os campos comuns + `typeId: 2`

### 5) (Opcional) Acesso também a partir da página de operação

- Arquivo: [`src/app/(logged-area)/dps/operation/[operationNumber]/page.tsx`](src/app/(logged-area)/dps/operation/[operationNumber]/page.tsx)
- Adicionar botão para navegar para `/edit` (mesma regra de bloqueio, usando os statuses já carregados naquela página).

## Mudanças/contrato no backend (necessário)

- Implementar endpoint:
  - `PUT v1/proposal/{operationNumber}`
- Payload esperado (sugestão):
  - `{ salesChannelUid?, totalParticipantsExpected, productId, typeId, deadlineId, deadlineMonths, propertyTypeId, operationValue }`
- Comportamento:
  - Atualizar todos os registros vinculados ao `operationNumber` (grupo de participants/proposals)
  - Retornar `success/message` e, se possível, um snapshot atualizado.

## Critérios de aceite

- Em `details/{uid}`, aparece **Editar operação** somente para `vendedor`/`vendedor-sup` quando **não houver assinado (21)**.
- Ao salvar, o frontend faz **1 request** por operação.
- UI bloqueia/avisa quando detectar status 21 em qualquer participante.