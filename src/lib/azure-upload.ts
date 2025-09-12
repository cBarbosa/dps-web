export type AzureSasResponse = {
  uploadUrl: string
  blobUrl: string
}

export function sanitizeBlobName(name: string): string {
  // Remover diretórios e caracteres inválidos para blob
  const base = name.split('\\').pop()?.split('/').pop() || 'file'
  // Remover apenas caracteres realmente inválidos para blob (preservar espaços)
  return base
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"|?*\x00-\x1f]/g, '-') // Apenas caracteres realmente inválidos
}

export async function getSasUrl(
  blobName: string,
  container = 'smart-dps'
): Promise<AzureSasResponse> {
  const res = await fetch('/api/storage/sas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blobName, container }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || 'Falha ao obter SAS')
  }
  return (await res.json()) as AzureSasResponse
}

export async function uploadFileToAzure(
  file: File,
  uploadUrl: string
): Promise<void> {
  const url = new URL(uploadUrl)
  // Debug básico sem expor query completa
  // eslint-disable-next-line no-console
  console.debug('[AzureUpload] PUT', {
    origin: url.origin,
    path: url.pathname,
    size: file.size,
    type: file.type,
  })

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'x-ms-blob-content-type': file.type || 'application/octet-stream',
      'If-None-Match': '*',
    },
    body: file,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const errCode = res.headers.get('x-ms-error-code') || undefined

    console.log(res)
    console.log(text)
    console.log(errCode)

    // eslint-disable-next-line no-console
    console.error('[AzureUpload] PUT failed', {
      status: res.status,
      errCode,
      text: text?.slice(0, 500),
    })
    throw new Error(`Falha ao enviar para Azure: ${res.status} ${errCode || ''} ${text}`)
  }
}


