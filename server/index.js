import { createServer } from 'node:http'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = normalize(join(__dirname, '..'))
const dataDir = join(rootDir, 'server', 'data')
const dataFile = join(dataDir, 'published-commands.json')
const distDir = join(rootDir, 'dist')
const host = process.env.HOST ?? '127.0.0.1'
const port = Number(process.env.PORT ?? 3001)
const apiPath = '/api/published-commands'

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
}

async function readCommands() {
  try {
    const content = await readFile(dataFile, 'utf8')
    const parsedContent = JSON.parse(content)
    return Array.isArray(parsedContent) ? parsedContent : []
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }

    throw error
  }
}

async function writeCommands(commands) {
  await mkdir(dataDir, { recursive: true })
  await writeFile(dataFile, `${JSON.stringify(commands, null, 2)}\n`)
}

async function readJsonBody(request) {
  let body = ''

  for await (const chunk of request) {
    body += chunk

    if (body.length > 1_000_000) {
      throw new Error('Request body is too large')
    }
  }

  return body ? JSON.parse(body) : {}
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Origin': process.env.CLIENT_ORIGIN ?? '*',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload))
}

function isInsideRoot(filePath) {
  return filePath === distDir || filePath.startsWith(`${distDir}/`)
}

async function sendStaticFile(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`)
  const requestedPath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname
  const filePath = normalize(join(distDir, requestedPath))
  const fallbackPath = join(distDir, 'index.html')

  if (!isInsideRoot(filePath)) {
    response.writeHead(403)
    response.end('Forbidden')
    return
  }

  try {
    const fileStats = await stat(filePath)
    const finalPath = fileStats.isFile() ? filePath : fallbackPath
    const content = await readFile(finalPath)
    const contentType = contentTypes[extname(finalPath)] ?? 'application/octet-stream'

    response.writeHead(200, { 'Content-Type': contentType })
    response.end(content)
  } catch {
    try {
      const content = await readFile(fallbackPath)
      response.writeHead(200, { 'Content-Type': contentTypes['.html'] })
      response.end(content)
    } catch {
      response.writeHead(404)
      response.end('Not found')
    }
  }
}

async function handleApiRequest(request, response) {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {})
    return
  }

  if (request.method === 'GET') {
    sendJson(response, 200, await readCommands())
    return
  }

  if (request.method === 'POST') {
    const body = await readJsonBody(request)
    const code = typeof body.code === 'string' ? body.code.trim() : ''
    const deviceName =
      typeof body.deviceName === 'string' && body.deviceName.trim()
        ? body.deviceName.trim()
        : 'Unnamed device'

    if (!code) {
      sendJson(response, 400, { error: 'Code is required' })
      return
    }

    const command = {
      id: crypto.randomUUID(),
      code,
      deviceName,
      createdAt: new Date().toISOString(),
    }
    const commands = [command, ...(await readCommands())]

    await writeCommands(commands)
    sendJson(response, 201, command)
    return
  }

  sendJson(response, 405, { error: 'Method not allowed' })
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`)

    if (requestUrl.pathname === apiPath) {
      await handleApiRequest(request, response)
      return
    }

    await sendStaticFile(request, response)
  } catch {
    sendJson(response, 500, { error: 'Internal server error' })
  }
})

server.listen(port, host, () => {
  console.log(`API server listening on http://${host}:${port}`)
})
