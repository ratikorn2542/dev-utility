'use client'

import { useState, useMemo } from 'react'

const HTTP_STATUS_CODES = [
  { code: 100, name: 'Continue', description: 'The server has received the request headers and the client should proceed to send the request body.' },
  { code: 101, name: 'Switching Protocols', description: 'The server is switching protocols as requested by the client.' },
  { code: 200, name: 'OK', description: 'The request has succeeded.' },
  { code: 201, name: 'Created', description: 'The request has been fulfilled and resulted in a new resource being created.' },
  { code: 204, name: 'No Content', description: 'The server successfully processed the request, but is not returning any content.' },
  { code: 301, name: 'Moved Permanently', description: 'The requested resource has been permanently moved to a new URL.' },
  { code: 302, name: 'Found', description: 'The requested resource temporarily resides under a different URL.' },
  { code: 304, name: 'Not Modified', description: 'The resource has not been modified since the last request.' },
  { code: 400, name: 'Bad Request', description: 'The server cannot process the request due to something that is perceived to be a client error.' },
  { code: 401, name: 'Unauthorized', description: 'The request requires user authentication.' },
  { code: 403, name: 'Forbidden', description: 'The server understood the request, but is refusing to fulfill it.' },
  { code: 404, name: 'Not Found', description: 'The server has not found anything matching the request URI.' },
  { code: 405, name: 'Method Not Allowed', description: 'The method specified in the request is not allowed for the resource.' },
  { code: 408, name: 'Request Timeout', description: 'The server timed out waiting for the request.' },
  { code: 409, name: 'Conflict', description: 'The request could not be completed due to a conflict with the current state of the resource.' },
  { code: 410, name: 'Gone', description: 'The requested resource is no longer available and will not be available again.' },
  { code: 413, name: 'Payload Too Large', description: 'The request is larger than the server is willing or able to process.' },
  { code: 415, name: 'Unsupported Media Type', description: 'The request entity has a media type which the server or resource does not support.' },
  { code: 422, name: 'Unprocessable Entity', description: 'The request was well-formed but was unable to be followed due to semantic errors.' },
  { code: 429, name: 'Too Many Requests', description: 'The user has sent too many requests in a given amount of time.' },
  { code: 500, name: 'Internal Server Error', description: 'The server encountered an unexpected condition which prevented it from fulfilling the request.' },
  { code: 501, name: 'Not Implemented', description: 'The server does not support the functionality required to fulfill the request.' },
  { code: 502, name: 'Bad Gateway', description: 'The server received an invalid response from the upstream server.' },
  { code: 503, name: 'Service Unavailable', description: 'The server is currently unable to handle the request due to temporary overloading or maintenance.' },
  { code: 504, name: 'Gateway Timeout', description: 'The server did not receive a timely response from the upstream server.' },
]

function getStatusColor(code: number): string {
  if (code < 200) return 'text-[#00d9ff]'
  if (code < 300) return 'text-[#22c55e]'
  if (code < 400) return 'text-[#f39c12]'
  if (code < 500) return 'text-[#e94560]'
  return 'text-[#a855f7]'
}

export function HttpStatusTool() {
  const [search, setSearch] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const filtered = useMemo(() => {
    if (!search) return HTTP_STATUS_CODES
    const q = search.toLowerCase()
    return HTTP_STATUS_CODES.filter(
      (s) =>
        s.code.toString().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    )
  }, [search])

  const copyToClipboard = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search status codes..."
        className="w-full p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-white font-mono text-sm focus:outline-none focus:border-[#e94560] placeholder:text-[#4a4a5a]"
      />

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filtered.map((status, idx) => (
          <div
            key={status.code}
            className="flex items-start gap-3 p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg hover:border-[#e94560] transition-colors group cursor-pointer"
            onClick={() => copyToClipboard(status.code.toString(), idx)}
          >
            <span className={`font-mono font-bold text-lg ${getStatusColor(status.code)}`}>
              {status.code}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium">{status.name}</div>
              <div className="text-[#9ca3af] text-xs mt-0.5">{status.description}</div>
            </div>
            <span className="text-[#9ca3af] text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              {copiedIdx === idx ? '✓' : 'Copy'}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-[#9ca3af]">
        Click to copy code. {filtered.length} of {HTTP_STATUS_CODES.length} codes shown.
      </p>
    </div>
  )
}
