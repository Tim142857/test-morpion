import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm'
export const GITHUB_PAGES_BASE = '/test-morpion/'
export const GITHUB_PAGES_URL = 'https://tim142857.github.io/test-morpion/'

export function readRequiredFile(pathFromRoot) {
  const absolutePath = join(repositoryRoot, pathFromRoot)
  assert.ok(existsSync(absolutePath), `${pathFromRoot} doit exister`)
  return readFileSync(absolutePath, 'utf8')
}

export function readPackageJson() {
  return JSON.parse(readRequiredFile('package.json'))
}

export function allFiles(directory) {
  if (!existsSync(directory)) return []

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? allFiles(path) : [path]
  })
}

export function runNpmScript(script, extraArguments = []) {
  const result = spawnSync(
    npmExecutable,
    ['run', script, ...(extraArguments.length ? ['--', ...extraArguments] : [])],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      timeout: 120_000,
      shell: process.platform === 'win32',
    },
  )

  assert.equal(
    result.status,
    0,
    `npm run ${script} a échoué.\n${result.stdout ?? ''}\n${result.stderr ?? ''}`,
  )

  return result
}

export function reservePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      assert.ok(address && typeof address !== 'string')
      const { port } = address
      server.close((error) => (error ? reject(error) : resolvePort(port)))
    })
  })
}

export async function stopProcess(child) {
  if (child.exitCode !== null) return

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      encoding: 'utf8',
      timeout: 10_000,
    })
  } else {
    child.kill('SIGTERM')
  }
}

export function findViteConfigPath() {
  const candidates = ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs']
  const found = candidates.find((file) => existsSync(join(repositoryRoot, file)))
  assert.ok(found, 'une configuration Vite doit exister')
  return found
}

export function extractAssetReferences(html) {
  const references = []
  for (const match of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
    references.push(match[1])
  }
  return references
}

export function requireGithubPagesBase() {
  const viteConfig = readRequiredFile(findViteConfigPath())
  assert.match(
    viteConfig,
    /base\s*:\s*['"]\/test-morpion\/['"]/,
    `vite.config doit déclarer base: '${GITHUB_PAGES_BASE}' avant les tests GitHub Pages`,
  )
}

let cachedProductionBuild = false

export function runProductionBuild() {
  if (cachedProductionBuild && existsSync(join(repositoryRoot, 'dist', 'index.html'))) {
    return
  }

  runNpmScript('build')
  readRequiredFile(join('dist', 'index.html'))
  cachedProductionBuild = true
}

export function ensureProductionBuild() {
  requireGithubPagesBase()
  runProductionBuild()
}

export async function startPreviewServer(port) {
  const child = spawn(
    npmExecutable,
    ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    {
      cwd: repositoryRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    },
  )

  let output = ''
  child.stdout.on('data', (chunk) => { output += chunk })
  child.stderr.on('data', (chunk) => { output += chunk })

  const baseUrl = `http://127.0.0.1:${port}${GITHUB_PAGES_BASE}`
  const deadline = Date.now() + 10_000
  let response

  while (Date.now() < deadline && !response) {
    if (child.exitCode !== null) break
    try {
      response = await fetch(baseUrl)
    } catch {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 200))
    }
  }

  try {
    assert.ok(response, `le serveur preview n'a pas démarré sous ${GITHUB_PAGES_BASE}\n${output}`)
    return { child, output, baseUrl }
  } catch (error) {
    await stopProcess(child)
    throw error
  }
}

export function listDistFiles() {
  const distRoot = join(repositoryRoot, 'dist')
  return allFiles(distRoot).map((file) => relative(distRoot, file).replace(/\\/g, '/'))
}

export function listWorkflowFiles() {
  const workflowsDirectory = join(repositoryRoot, '.github', 'workflows')
  if (!existsSync(workflowsDirectory)) return []

  return allFiles(workflowsDirectory).filter((file) => ['.yml', '.yaml'].includes(extname(file)))
}

export function readWorkflowFiles() {
  return listWorkflowFiles().map((absolutePath) => ({
    path: relative(repositoryRoot, absolutePath).replace(/\\/g, '/'),
    content: readFileSync(absolutePath, 'utf8'),
  }))
}

export function findQualityWorkflows(workflows = readWorkflowFiles()) {
  return workflows.filter(({ content }) => {
    const runsLint = /\bnpm\s+run\s+lint\b/.test(content)
    const runsTypecheck = /\bnpm\s+run\s+typecheck\b/.test(content)
    const hasPullRequestTrigger = /\bon:\s*[\s\S]*?\bpull_request\b/m.test(content)
    const hasMainPushTrigger = /\bon:\s*[\s\S]*?\bpush\b[\s\S]*?\bmain\b/m.test(content)

    return runsLint && runsTypecheck && hasPullRequestTrigger && hasMainPushTrigger
  })
}
