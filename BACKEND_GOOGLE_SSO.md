### Especificação para backend: endpoint de login via Google (SSO)

- **Objetivo**: permitir login via Google, trocando o `id_token` do Google por credenciais internas da aplicação, no mesmo formato do login por credenciais.

---

### Status atual de integração (frontend)

- O projeto já possui `GoogleProvider` configurado no NextAuth (requer `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`).
- O botão de login com Google na UI está oculto por padrão no `login-form.tsx`.
- O fluxo esperado para integração com o backend é consumir o endpoint abaixo (`/api/v1/Auth/google`) para trocar o `id_token` por um token interno e payload com `role`/`userData` no mesmo formato do login por credenciais.
- Opções de implementação no frontend:
  1. Chamar diretamente este endpoint do backend e, em seguida, estabelecer sessão local (por exemplo, via chamada a um endpoint interno que sincronize com NextAuth) — não implementado ainda.
  2. Habilitar o botão Google e implementar callbacks do NextAuth para, ao autenticar via OAuth Google, trocar o `id_token` com o backend e popular o JWT de sessão com `accessToken/role/expires` — não implementado ainda.

Enquanto a opção 2 não for implementada, recomenda‑se usar a opção 1 de forma explícita na UI ao habilitar o botão.

### Endpoint
- **Método**: POST
- **URL**: `/api/v1/Auth/google` (seguir o padrão usado em `/api/v1/Auth`)
- **Auth**: público (sem Bearer interno); verificação via `id_token` do Google

### Request body (JSON)
```json
{
  "provider": "google",
  "idToken": "<GOOGLE_ID_TOKEN>",
  "email": "user@dominio.com",
  "name": "Nome do Usuário",
  "externalUserId": "google-sub",
  "picture": "https://...(opcional)"
}
```
- **Obrigatório**: `idToken`
- Os demais campos podem ser derivados a partir do `idToken`; enviar redundante ajuda em logs/auditoria.

### Validações do id_token (obrigatório)
- Verificar assinatura e claims via JWKS do Google (ou lib oficial):
  - `aud` deve bater com `GOOGLE_CLIENT_ID` (env do backend)
  - `iss` ∈ {`https://accounts.google.com`, `accounts.google.com`}
  - `exp` futuro; `nbf`/`iat` válidos
  - `email_verified` true (se exigirem e-mail verificado)
- Extrair: `sub` (usar como `externalUserId`), `email`, `name`, `picture`

### Regras de autorização e perfil
- Mapear usuário para `role` interno. Exemplos:
  - Allowlist de e‑mails
  - Allowlist de domínios (ex.: `@enterpriseseguros.com.br`)
  - Tabela/vínculo `externalUserId -> role`
- Roles válidos: `ADMIN`, `VENDEDOR`, `SUBSCRITOR`, `SUBSCRITOR-MED`, `VENDEDOR-SUP`, `SUBSCRITOR-SUP`, `OFERTA`
- Retornar `role` em UPPERCASE (compatível com o frontend)

### Resposta (JSON) — mesmo shape do login por credenciais
- Sucesso (200):
```json
{
  "message": "Autenticado com sucesso",
  "success": true,
  "data": {
    "accessToken": "<TOKEN_INTERNO>",
    "expires": "2025-08-15T15:06:52.419Z",
    "role": "VENDEDOR",
    "userData": {
      "uid": "uuid",
      "name": "Nome do Usuário",
      "email": "user@dominio.com",
      "role": "VENDEDOR",
      "status": "Active",
      "company": {
        "uid": "uuid",
        "name": "Empresa",
        "products": [],
        "proposals": []
      }
    }
  }
}
```
- Erros:
  - 400: token ausente/inválido, payload inválido
  - 401: `id_token` inválido, `aud/iss` incorretos, domínio/e‑mail não permitido
  - 500: falha inesperada
```json
{ "message": "Usuário não autorizado", "success": false }
```

### Segurança
- Envs no backend:
  - `GOOGLE_CLIENT_ID` (obrigatória para validar `aud`)
  - `GOOGLE_ISSUERS=accounts.google.com,https://accounts.google.com` (opcional)
- Rate-limit por IP e sanitização de logs (não logar `idToken` completo)

### Exemplo cURL
```bash
curl --location 'https://dps-devapi.azurewebsites.net/api/v1/Auth/google' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "provider": "google",
    "idToken": "<GOOGLE_ID_TOKEN>",
    "email": "andersonoliveira@enterpriseseguros.com.br",
    "name": "Anderson Oliveira",
    "externalUserId": "google-sub",
    "picture": "https://lh3.googleusercontent.com/a/..."
  }'
```

### Compatibilidade com o frontend
- O frontend espera exatamente esse shape (`success`, `message`, `data.accessToken`, `data.role`, `data.expires`, `data.userData`).
- `role` é usado em RBAC/tema; `accessToken` vai no Bearer das próximas chamadas.
- `expires` em ISO 8601 (verificado no middleware).

Observações adicionais:
- `NEXT_PUBLIC_API_BASE_URL` no frontend aponta para a base do backend (ex.: `https://dps-devapi.azurewebsites.net/api`). O login por credenciais consome `${BASE}/v1/Auth`; este endpoint de Google deve residir em `${BASE}/v1/Auth/google`.
- Para habilitar a UI de Google, defina `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` e reveja `login-form.tsx` (descomentar/mostrar o botão) e os callbacks de autenticação.

### Critérios de aceite
- Validação correta do `id_token` (assinatura/claims)
- `200` + payload esperado quando e‑mail/domínio permitido
- `401` quando e‑mail/domínio não permitido ou token inválido
- `role` compatível (UPPERCASE) e sessão funcional no frontend

### Alternativa (header)
- Aceitar `Authorization: Bearer <GOOGLE_ID_TOKEN>` e derivar os mesmos campos; corpo torna-se opcional.

---

### Variáveis de ambiente (resumo)

- Backend:
  - `GOOGLE_CLIENT_ID`
  - (Opcional) `GOOGLE_ISSUERS=accounts.google.com,https://accounts.google.com`
- Frontend:
  - `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (para NextAuth OAuth, caso opte por usar)
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL` (em produção/preview)
  - `NEXT_PUBLIC_API_BASE_URL` (ex.: `https://dps-devapi.azurewebsites.net/api`)
