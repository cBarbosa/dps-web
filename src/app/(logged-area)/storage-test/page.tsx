'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import FileInput from '@/components/ui/file-input'
import { getSasUrl, sanitizeBlobName, uploadFileToAzure } from '@/lib/azure-upload'
import axios from '@/lib/axios'
import { BlockBlobClient } from '@azure/storage-blob'

type StepLog = { label: string; detail?: string; timestamp: string; type: 'info' | 'error' | 'success' }

export default function StorageTestPage() {
  const [container, setContainer] = useState('smart-dps')
  const [prefix, setPrefix] = useState('waiting')
  const [contentType, setContentType] = useState('')
  const [file, setFile] = useState<File | undefined>(undefined)

  const [uploadUrl, setUploadUrl] = useState('')
  const [blobUrl, setBlobUrl] = useState('')
  const [logs, setLogs] = useState<StepLog[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function log(label: string, detail?: string, type: 'info' | 'error' | 'success' = 'info') {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { label, detail, timestamp, type }])
  }

  function reset() {
    setUploadUrl('')
    setBlobUrl('')
    setLogs([])
    setError('')
  }

  function buildBlobName(name: string) {
    const safe = sanitizeBlobName(name)
    const p = prefix.replace(/\/$/, '')
    return `${p}/${safe}`
  }

  async function handleGenerateSas() {
    reset()
    if (!file) return setError('Selecione um arquivo')
    try {
      setBusy(true)
      const blobName = buildBlobName(file.name)
      log('Gerando SAS...', blobName, 'info')
      const res = await getSasUrl(blobName, container)
      setUploadUrl(res.uploadUrl)
      setBlobUrl(res.blobUrl)
      log('SAS OK', res.blobUrl, 'success')
    } catch (e: any) {
      setError(e?.message || 'Falha ao gerar SAS')
      log('Erro SAS', e?.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handlePutSdk() {
    if (!file) return setError('Selecione um arquivo')
    if (!uploadUrl) return setError('Gere a SAS primeiro')
    try {
      setBusy(true)
      log('Enviando via SDK (@azure/storage-blob)...', `${file.name} - ${(file.size / 1024 / 1024).toFixed(2)} MB`, 'info')

      const client = new BlockBlobClient(uploadUrl)
      let lastProgress = 0
      await client.uploadData(file, {
        // blockSize e concurrency default são ok; ajustáveis se necessário
        onProgress: (ev) => {
          const loaded = ev.loadedBytes ?? 0
          if (loaded - lastProgress > 128 * 1024) { // log a cada ~128KB
            log('SDK Progresso', `${((loaded / (file.size || 1)) * 100).toFixed(1)}% (${(loaded / 1024 / 1024).toFixed(2)} MB)`, 'info')
            lastProgress = loaded
          }
        },
        blobHTTPHeaders: {
          blobContentType: contentType || file.type || 'application/octet-stream',
        },
      })

      log('SDK Upload OK', blobUrl, 'success')
    } catch (e: any) {
      setError(e?.message || 'Falha no SDK uploadData')
      log('Erro SDK', e?.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handlePut() {
    if (!file) return setError('Selecione um arquivo')
    if (!uploadUrl) return setError('Gere a SAS primeiro')
    try {
      setBusy(true)
      log('Enviando arquivo...', `${file.name} (${file.type || 'application/octet-stream'}) - ${(file.size / 1024 / 1024).toFixed(2)} MB`, 'info')
      const fileToSend = file
      // Tentativa 1: com content-type explícito
      const attempt = async (headers: Record<string, string>, tentativa: string) => {
        log(`Tentando PUT (${tentativa})`, `Headers: ${Object.keys(headers).join(', ')}`, 'info')
        const r = await fetch(uploadUrl, {
          method: 'PUT',
          headers,
          body: fileToSend,
        })
        const contentLength = r.headers.get('content-length') || '0'
        const compressedSize = parseInt(contentLength) > 0 ? ` - Comprimido: ${(parseInt(contentLength) / 1024 / 1024).toFixed(2)} MB` : ''
        log(`PUT Response (${tentativa})`, `Status: ${r.status}, OK: ${r.ok}${compressedSize}`, r.ok ? 'success' : 'error')
        if (!r.ok) {
          const text = await r.text().catch(() => '')
          const code = r.headers.get('x-ms-error-code') || ''
          log(`PUT Headers (${tentativa})`, Array.from(r.headers.entries()).map(([k,v]) => `${k}: ${v}`).join('; '), 'error')
          throw new Error(`${r.status} ${code} ${text}`)
        }
      }

      try {
        await attempt({
          'x-ms-blob-type': 'BlockBlob',
          'x-ms-blob-content-type': contentType || fileToSend.type || 'application/octet-stream',
          // 'If-None-Match': '*', // pode causar preflight mais estrito
        }, 'com content-type')
      } catch (err1: any) {
        log('Tentativa 1 falhou', err1?.message, 'error')
        // Tentativa 2: cabeçalhos mínimos
        await attempt({ 'x-ms-blob-type': 'BlockBlob' }, 'mínima')
      }

      log('Upload OK', blobUrl, 'success')
    } catch (e: any) {
      setError(e?.message || 'Falha no PUT')
      log('Erro PUT', e?.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handlePutXHR() {
    if (!file) return setError('Selecione um arquivo')
    if (!uploadUrl) return setError('Gere a SAS primeiro')
    try {
      setBusy(true)
      log('Enviando via XMLHttpRequest...', `${file.name} - ${(file.size / 1024 / 1024).toFixed(2)} MB`, 'info')
      
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl, true)
        xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob')
        xhr.setRequestHeader('x-ms-blob-content-type', contentType || file.type || 'application/octet-stream')
        
        xhr.onload = () => {
          log('XHR Response', `Status: ${xhr.status}, Ready: ${xhr.readyState}`, xhr.status >= 200 && xhr.status < 300 ? 'success' : 'error')
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`XHR ${xhr.status}: ${xhr.responseText}`))
          }
        }
        
        xhr.onerror = () => {
          log('XHR Error', 'Network error', 'error')
          reject(new Error('XHR Network error'))
        }
        
        xhr.ontimeout = () => {
          log('XHR Timeout', 'Request timeout', 'error')
          reject(new Error('XHR Timeout'))
        }
        
        xhr.send(file)
      })
      
      log('XHR Upload OK', blobUrl, 'success')
    } catch (e: any) {
      setError(e?.message || 'Falha no XHR')
      log('Erro XHR', e?.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handlePutAxios() {
    if (!file) return setError('Selecione um arquivo')
    if (!uploadUrl) return setError('Gere a SAS primeiro')
    try {
      setBusy(true)
      log('Enviando via Axios...', `${file.name} - ${(file.size / 1024 / 1024).toFixed(2)} MB`, 'info')
      
      const response = await axios.put(uploadUrl, file, {
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'x-ms-blob-content-type': contentType || file.type || 'application/octet-stream',
        },
      })
      
      log('Axios Response', `Status: ${response.status}, Headers: ${Object.keys(response.headers).join(', ')}`, 'success')
      log('Axios Upload OK', blobUrl, 'success')
    } catch (e: any) {
      const msg = e?.response ? `${e.response.status}: ${e.response.data}` : e?.message
      setError(msg || 'Falha no Axios')
      log('Erro Axios', msg, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handlePutFormData() {
    if (!file) return setError('Selecione um arquivo')
    if (!uploadUrl) return setError('Gere a SAS primeiro')
    try {
      setBusy(true)
      log('Enviando via FormData...', `${file.name} - ${(file.size / 1024 / 1024).toFixed(2)} MB`, 'info')
      
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          // Não definir content-type para deixar o browser definir boundary
        },
        body: formData,
      })
      
      log('FormData Response', `Status: ${response.status}, OK: ${response.ok}`, response.ok ? 'success' : 'error')
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(`FormData ${response.status}: ${text}`)
      }
      log('FormData Upload OK', blobUrl, 'success')
    } catch (e: any) {
      setError(e?.message || 'Falha no FormData')
      log('Erro FormData', e?.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleTestConnectivity() {
    try {
      setBusy(true)
      log('Testando conectividade...', 'techviewstorage.blob.core.windows.net', 'info')
      
      // Tenta um GET simples no domínio base
      const response = await fetch('https://techviewstorage.blob.core.windows.net/', {
        method: 'GET',
        mode: 'cors',
      })
      
      log('Conectividade', `Status: ${response.status}, CORS: ${response.headers.get('access-control-allow-origin') || 'N/A'}`, response.status < 500 ? 'success' : 'error')
    } catch (e: any) {
      log('Erro Conectividade', e?.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleGet() {
    if (!blobUrl) return setError('Faça o upload antes')
    try {
      setBusy(true)
      log('Validando GET...', blobUrl, 'info')
      const res = await fetch(blobUrl)
      log('GET Response', `Status: ${res.status}, OK: ${res.ok}, Content-Type: ${res.headers.get('content-type')}`, res.ok ? 'success' : 'error')
      const text = await res.text().catch(() => '')
      log(`GET ${res.status}`, text.slice(0, 200), res.ok ? 'success' : 'error')
      if (!res.ok) throw new Error(`${res.status} ${text}`)
    } catch (e: any) {
      setError(e?.message || 'Falha no GET')
      log('Erro GET', e?.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleGetWithSas() {
    if (!uploadUrl) return setError('Gere a SAS antes')
    try {
      setBusy(true)
      log('Validando GET (SAS)...', uploadUrl, 'info')
      const res = await fetch(uploadUrl, { method: 'GET' })
      log('GET (SAS) Response', `Status: ${res.status}, OK: ${res.ok}, Content-Type: ${res.headers.get('content-type')}`, res.ok ? 'success' : 'error')
      const text = await res.text().catch(() => '')
      log(`GET (SAS) ${res.status}`, text.slice(0, 200), res.ok ? 'success' : 'error')
      if (!res.ok) throw new Error(`${res.status} ${text}`)
    } catch (e: any) {
      setError(e?.message || 'Falha no GET (SAS)')
      log('Erro GET (SAS)', e?.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleAll() {
    await handleGenerateSas()
    if (!error) await handlePutSdk()
    if (!error) await handleGetWithSas()
  }

  function handleFileChange(v: any) {
    const chosen = Array.isArray(v) ? v[0] : v
    if (chosen instanceof File) {
      setFile(chosen)
      setError('')
      log('Arquivo selecionado', `${chosen.name} (${(chosen.size / 1024 / 1024).toFixed(2)} MB)`, 'success') }
  }

  return (
    <div className="max-w-3xl p-6 space-y-5">
      <h1 className="text-xl font-semibold">Teste de Upload (Azure Blob)</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm">Container</label>
          <input
            className="border rounded-md px-3 py-2 w-full"
            value={container}
            title="Nome do container do Azure Blob"
            onChange={e => setContainer(e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm">Prefixo do caminho (ex.: waiting)</label>
          <input
            className="border rounded-md px-3 py-2 w-full"
            value={prefix}
            title="Prefixo do caminho dentro do container"
            onChange={e => setPrefix(e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm">Content-Type (opcional)</label>
          <input
            className="border rounded-md px-3 py-2 w-full"
            placeholder="Deixe em branco para usar o do arquivo"
            value={contentType}
            onChange={e => setContentType(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm">Arquivo (até 50MB para teste)</label>
        <div className="space-y-2">
          <FileInput accept="*/*" multiple={false} sizeLimit={50 * 1024 * 1024} onChange={handleFileChange} />
          {file && (
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Arquivo:</strong> {file.name}</div>
              <div><strong>Tamanho original:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB ({file.size.toLocaleString()} bytes)</div>
              <div><strong>Tipo:</strong> {file.type || 'application/octet-stream'}</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button disabled={busy} onClick={handleGenerateSas}>1) Gerar SAS</Button>
        <Button disabled={busy || !uploadUrl} onClick={handlePutSdk}>2a) PUT (SDK)</Button>
        <Button disabled={busy || !uploadUrl} onClick={handlePut} variant="outline">2b) PUT (Fetch)</Button>
        <Button disabled={busy || !uploadUrl} onClick={handlePutXHR} variant="outline">2c) PUT (XHR)</Button>
        <Button disabled={busy || !uploadUrl} onClick={handlePutAxios} variant="outline">2d) PUT (Axios)</Button>
        <Button disabled={busy || !uploadUrl} onClick={handlePutFormData} variant="outline">2e) PUT (FormData)</Button>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy || !blobUrl} onClick={handleGet}>3) Validar GET</Button>
        <Button disabled={busy || !uploadUrl} onClick={handleGetWithSas}>3b) Validar GET (com SAS)</Button>
        <Button disabled={busy} variant="outline" onClick={handleAll}>Executar Tudo</Button>
        <Button disabled={busy} variant="secondary" onClick={handleTestConnectivity}>Testar Conectividade</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button disabled={busy} variant="secondary" onClick={async () => {
          try {
            setBusy(true)
            log('Testando via API do servidor...', '/api/storage/test', 'info')
            const res = await fetch('/api/storage/test')
            const data = await res.json()
            log('API Test Response', `Upload: ${data.upload?.status}, GET: ${data.get?.status}`, res.ok ? 'success' : 'error')
            log('API Test Details', JSON.stringify(data, null, 2), res.ok ? 'success' : 'info')
          } catch (e: any) {
            log('Erro API Test', e?.message, 'error')
          } finally {
            setBusy(false)
          }
        }}>Teste via Servidor</Button>
        <Button disabled={busy} variant="ghost" onClick={() => {
          setLogs([])
          setError('')
        }}>Limpar Logs</Button>
      </div>

      {uploadUrl && (
        <div className="text-xs break-all"><b>uploadUrl:</b> {uploadUrl}</div>
      )}
      {blobUrl && (
        <div className="text-xs break-all"><b>blobUrl:</b> <a className="text-blue-600 underline" href={blobUrl} target="_blank" rel="noreferrer">{blobUrl}</a></div>
      )}

      {error && <div className="text-red-600 text-sm whitespace-pre-wrap">{error}</div>}

      <div className="border rounded-md p-3 text-sm bg-gray-50 max-h-96 overflow-y-auto">
        <div className="font-medium mb-2">Logs ({logs.length})</div>
        <ul className="space-y-1">
          {logs.map((l, i) => (
            <li key={i} className={`text-xs p-1 rounded ${
              l.type === 'error' ? 'bg-red-100 text-red-800' :
              l.type === 'success' ? 'bg-green-100 text-green-800' :
              'bg-blue-50 text-blue-800'
            }`}>
              <span className="text-gray-500">[{l.timestamp}]</span>{' '}
              <span className="font-semibold">{l.label}</span>
              {l.detail && <div className="ml-4 break-all font-mono text-xs">{l.detail}</div>}
            </li>
          ))}
          {logs.length === 0 && <li className="text-gray-500 italic">Nenhum log ainda</li>}
        </ul>
      </div>
    </div>
  )
}


