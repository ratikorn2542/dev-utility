'use client'

import { useState } from 'react'

interface DockerService {
  image: string
  container_name?: string
  ports?: string[]
  environment?: Record<string, string>
  volumes?: string[]
  networks?: string[]
  depends_on?: string[]
  command?: string
  restart?: string
  privileged?: boolean
}

interface DockerCompose {
  services: Record<string, DockerService>
  networks?: Record<string, { name?: string; driver?: string }>
  volumes?: Record<string, object>
}

function parseEnvVar(envStr: string): { key: string; value: string } {
  const idx = envStr.indexOf('=')
  if (idx === -1) return { key: envStr, value: '' }
  return { key: envStr.slice(0, idx), value: envStr.slice(idx + 1) }
}

function parseDockerRun(cli: string): DockerCompose {
  const lines = cli.trim().split('\n').map((l) => l.trim()).filter(Boolean)
  const services: Record<string, DockerService> = {}
  const networks: Record<string, { name?: string; driver?: string }> = {}
  const volumes: Record<string, object> = {}

  for (const line of lines) {
    if (line.startsWith('#') || !line.startsWith('docker run')) continue
    const tokens = line.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || []
    const service: DockerService = { image: '' }
    const commandTokens: string[] = []
    let imageFound = false
    let i = 1

    while (i < tokens.length) {
      const token = tokens[i]
      switch (token) {
        case '--name': service.container_name = tokens[++i]; break
        case '-p': case '--publish': {
          const port = tokens[++i]
          if (port) { if (!service.ports) service.ports = []; service.ports.push(port) }
          break
        }
        case '-e': case '--env': {
          const envStr = tokens[++i]
          if (envStr) {
            const { key, value } = parseEnvVar(envStr)
            if (!service.environment) service.environment = {}
            service.environment[key] = value
          }
          break
        }
        case '-v': case '--volume': {
          const vol = tokens[++i]
          if (vol) {
            if (!service.volumes) service.volumes = []
            service.volumes.push(vol)
            const source = vol.split(':')[0]
            if (source && !source.startsWith('/')) volumes[source] = {}
          }
          break
        }
        case '--network': {
          const net = tokens[++i]
          if (net) { if (!service.networks) service.networks = []; service.networks.push(net); networks[net] ??= { name: net } }
          break
        }
        case '--depends-on': {
          const dep = tokens[++i]
          if (dep) { if (!service.depends_on) service.depends_on = []; service.depends_on.push(dep) }
          break
        }
        case '--restart': service.restart = tokens[++i] || 'unless-stopped'; break
        case '--privileged': service.privileged = true; break
        case '-d': case '--detach': case '-it': case '-i': case '-t': case '--rm': break
        default:
          if (!token.startsWith('-') && !service.image && token !== 'docker' && token !== 'run') {
            service.image = token; imageFound = true
          } else if (imageFound && !token.startsWith('-')) {
            commandTokens.push(token)
          }
          break
      }
      i++
    }

    if (service.image) {
      if (commandTokens.length > 0) service.command = commandTokens.join(' ')
      const svcName = service.container_name || `service-${Object.keys(services).length + 1}`
      services[svcName] = service
    }
  }

  const result: DockerCompose = { services }
  if (Object.keys(networks).length > 0) result.networks = networks
  if (Object.keys(volumes).length > 0) result.volumes = volumes
  return result
}

function formatCompose(compose: DockerCompose): string {
  const lines: string[] = ['services:']

  for (const [name, service] of Object.entries(compose.services)) {
    lines.push(`  ${name}:`)
    if (service.image) lines.push(`    image: ${service.image}`)
    if (service.container_name) lines.push(`    container_name: ${service.container_name}`)
    if (service.ports?.length) {
      lines.push('    ports:')
      for (const port of service.ports) lines.push(`      - "${port}"`)
    }
    if (service.environment) {
      lines.push('    environment:')
      for (const [key, value] of Object.entries(service.environment)) {
        lines.push(value ? `      ${key}: "${value}"` : `      ${key}:`)
      }
    }
    if (service.volumes?.length) {
      lines.push('    volumes:')
      for (const vol of service.volumes) lines.push(`      - ${vol}`)
    }
    if (service.networks?.length) {
      lines.push('    networks:')
      for (const net of service.networks) lines.push(`      - ${net}`)
    }
    if (service.depends_on?.length) {
      lines.push('    depends_on:')
      for (const dep of service.depends_on) lines.push(`      - ${dep}`)
    }
    if (service.restart) lines.push(`    restart: ${service.restart}`)
    if (service.privileged) lines.push('    privileged: true')
    if (service.command) lines.push(`    command: "${service.command}"`)
  }

  if (compose.networks && Object.keys(compose.networks).length > 0) {
    lines.push('', 'networks:')
    for (const [name, net] of Object.entries(compose.networks)) {
      lines.push(`  ${name}:`)
      if (net.driver) lines.push(`    driver: ${net.driver}`)
    }
  }
  if (compose.volumes && Object.keys(compose.volumes).length > 0) {
    lines.push('', 'volumes:')
    for (const name of Object.keys(compose.volumes)) lines.push(`  ${name}:`)
  }

  return lines.join('\n')
}

function formatServiceToCli(name: string, service: DockerService): string {
  const parts = ['docker run -d']
  parts.push(`--name ${name}`)
  if (service.ports) for (const port of service.ports) parts.push(`-p ${port}`)
  if (service.environment) {
    for (const [key, value] of Object.entries(service.environment)) {
      parts.push(value ? `-e ${key}=${value}` : `-e ${key}`)
    }
  }
  if (service.volumes) for (const vol of service.volumes) parts.push(`-v ${vol}`)
  if (service.networks) for (const net of service.networks) parts.push(`--network ${net}`)
  if (service.depends_on) for (const dep of service.depends_on) parts.push(`--depends-on ${dep}`)
  if (service.restart) parts.push(`--restart ${service.restart}`)
  if (service.privileged) parts.push('--privileged')
  if (service.command) parts.push(service.command)
  parts.push(service.image)
  return parts.join(' \\\n  ')
}

const TOP_LEVEL_KEYS = ['version', 'services', 'networks', 'volumes']

function parseComposeToCli(composeStr: string): string {
  const lines = composeStr.split('\n')
  const services: Record<string, DockerService> = {}
  let currentService = ''
  let inServices = false
  let currentObj: Record<string, string> | null = null
  let currentObjKey = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    // Detect top-level keys (2-space indent or none)
    const isTopLevel = !line.startsWith('  ') && !line.startsWith('\t')

    if (isTopLevel) {
      if (trimmed === 'services:') {
        inServices = true
        continue
      }
      if (TOP_LEVEL_KEYS.some((k) => trimmed === `${k}:`)) {
        inServices = false
        currentService = ''
        currentObj = null
        continue
      }
    }

    if (inServices && isTopLevel && trimmed.match(/^\w[^:]*:$/)) {
      currentService = trimmed.replace(/:$/, '')
      services[currentService] = { image: '' }
      currentObj = null
      continue
    }

    if (inServices && currentService) {
      const kvMatch = trimmed.match(/^(\w+):\s*(.*)/)
      if (kvMatch) {
        const [, key, value] = kvMatch
        const svc = services[currentService]
        if (value) {
          switch (key) {
            case 'image': svc.image = value.replace(/"/g, ''); break
            case 'container_name': svc.container_name = value.replace(/"/g, ''); break
            case 'restart': svc.restart = value; break
            case 'privileged': svc.privileged = value === 'true'; break
            case 'command': svc.command = value.replace(/"/g, ''); break
            case 'ports': case 'volumes': case 'networks': case 'depends_on':
              if (!svc[key]) (svc as unknown as Record<string, unknown>)[key] = []
              currentObj = null
              break
            case 'environment':
              if (!svc.environment) svc.environment = {}
              currentObj = svc.environment
              currentObjKey = key
              break
          }
        } else {
          if (key === 'environment') { currentObj = services[currentService].environment || {}; currentObjKey = key }
          else if (['ports', 'volumes', 'networks', 'depends_on'].includes(key)) {
            if (!services[currentService][key as keyof DockerService]) {
              (services[currentService] as unknown as Record<string, unknown>)[key] = []
            }
            currentObj = null
          }
        }
      } else if (trimmed.startsWith('- ')) {
        const val = trimmed.slice(2).trim().replace(/"/g, '')
        const svc = services[currentService]
        if (currentObjKey === 'environment' && currentObj) {
          const eqIdx = val.indexOf('=')
          if (eqIdx !== -1) currentObj[val.slice(0, eqIdx)] = val.slice(eqIdx + 1)
          else currentObj[val] = ''
        } else if (currentObjKey === 'ports' && svc.ports) svc.ports.push(val)
        else if (currentObjKey === 'volumes' && svc.volumes) svc.volumes.push(val)
        else if (currentObjKey === 'networks' && svc.networks) svc.networks.push(val)
        else if (currentObjKey === 'depends_on' && svc.depends_on) svc.depends_on.push(val)
      }
    }
  }

  const commands: string[] = []
  for (const [name, service] of Object.entries(services)) {
    if (service.image) commands.push(formatServiceToCli(name, service))
  }
  return commands.join('\n\n')
}

export function DockerComposeTool() {
  const [input, setInput] = useState('docker run -d --name my-app -p 8080:80 -e NODE_ENV=production -v /data:/app/data my-image:latest')
  const [output, setOutput] = useState('')
  const [direction, setDirection] = useState<'cli-to-compose' | 'compose-to-cli'>('cli-to-compose')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const convert = () => {
    setError('')
    try {
      if (direction === 'cli-to-compose') {
        const parsed = parseDockerRun(input)
        setOutput(formatCompose(parsed))
      } else {
        setOutput(parseComposeToCli(input))
      }
    } catch (e) {
      setError(`Conversion error: ${e instanceof Error ? e.message : 'Invalid input'}`)
    }
  }

  const swap = () => {
    setDirection((d) => d === 'cli-to-compose' ? 'compose-to-cli' : 'cli-to-compose')
    setInput(output)
    setOutput(input)
    setError('')
  }

  const copyToClipboard = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const clear = () => { setInput(''); setOutput(''); setError('') }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => { setDirection('cli-to-compose'); setError('') }}
          className={`px-4 py-2 rounded text-sm font-medium border-2 transition-all ${
            direction === 'cli-to-compose'
              ? 'bg-[#e94560] text-white border-[#f39c12]'
              : 'bg-transparent text-[#9ca3af] border-[#2d2d44] hover:text-white'
          }`}
        >
          CLI → Compose
        </button>
        <button
          onClick={() => { setDirection('compose-to-cli'); setError('') }}
          className={`px-4 py-2 rounded text-sm font-medium border-2 transition-all ${
            direction === 'compose-to-cli'
              ? 'bg-[#e94560] text-white border-[#f39c12]'
              : 'bg-transparent text-[#9ca3af] border-[#2d2d44] hover:text-white'
          }`}
        >
          Compose → CLI
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[#9ca3af] mb-2">
            {direction === 'cli-to-compose' ? 'Docker CLI' : 'docker-compose.yml'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={direction === 'cli-to-compose' ? 'docker run -d --name app -p 80:80 image:latest' : 'services:\n  app:\n    image: nginx'}
            className="w-full h-64 p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:border-[#e94560] placeholder:text-[#4a4a5a]"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-[#9ca3af]">
              {direction === 'cli-to-compose' ? 'docker-compose.yml' : 'Docker CLI'}
            </label>
            {output && (
              <button onClick={copyToClipboard} className="text-xs text-[#9ca3af] hover:text-[#e94560] transition-colors">
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            )}
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="Result will appear here..."
            className="w-full h-64 p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-white font-mono text-sm resize-none focus:outline-none placeholder:text-[#4a4a5a]"
          />
        </div>
      </div>

      {error && <p className="text-[#e94560] text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={convert}
          className="flex-1 py-2 px-4 bg-[#e94560] text-white rounded-lg font-medium border-2 border-[#f39c12] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
        >
          → Convert
        </button>
        <button
          onClick={swap}
          className="px-4 py-2 bg-[#16213e] text-white rounded-lg font-medium border-2 border-[#2d2d44] hover:border-[#e94560] transition-all"
        >
          ⇄ Swap
        </button>
        <button
          onClick={clear}
          className="px-4 py-2 bg-transparent text-[#9ca3af] rounded-lg font-medium border-2 border-[#2d2d44] hover:text-white hover:border-[#e94560] transition-all"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
