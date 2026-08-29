import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function readRequiredFile(pathFromRoot) {
  const absolutePath = join(repositoryRoot, pathFromRoot)
  assert.ok(existsSync(absolutePath), `${pathFromRoot} doit exister`)
  return readFileSync(absolutePath, 'utf8')
}

function readPackageJson() {
  return JSON.parse(readRequiredFile('package.json'))
}

function allFiles(directory) {
  if (!existsSync(directory)) return []

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? allFiles(path) : [path]
  })
}

function dependencyVersion(packageJson, dependency) {
  return packageJson.dependencies?.[dependency] ?? packageJson.devDependencies?.[dependency]
}

function runNpmScript(script, extraArguments = []) {
  const result = spawnSync(
    npmExecutable,
    ['run', script, ...(extraArguments.length ? ['--', ...extraArguments] : [])],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      timeout: 120_000,
    },
  )

  assert.equal(
    result.status,
    0,
    `npm run ${script} a échoué.\n${result.stdout ?? ''}\n${result.stderr ?? ''}`,
  )
}

function reservePort() {
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

async function stopProcess(child) {
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

test('le projet déclare et utilise React, TypeScript, Vite et npm', () => {
  const packageJson = readPackageJson()
  const lockfile = readRequiredFile('package-lock.json')

  for (const dependency of ['react', 'react-dom', 'typescript', 'vite', '@vitejs/plugin-react']) {
    assert.ok(dependencyVersion(packageJson, dependency), `${dependency} doit être déclaré`)
  }

  assert.doesNotThrow(() => JSON.parse(lockfile), 'package-lock.json doit être un JSON valide')

  const sourceFiles = allFiles(join(repositoryRoot, 'src'))
  assert.ok(sourceFiles.some((file) => extname(file) === '.tsx'), 'src/ doit contenir du TypeScript React (.tsx)')

  const source = sourceFiles
    .filter((file) => ['.ts', '.tsx'].includes(extname(file)))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  assert.match(source, /from\s+['"]react(?:-dom(?:\/client)?)?['"]/, 'le code doit importer React ou React DOM')

  const viteConfig = ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs']
    .find((file) => existsSync(join(repositoryRoot, file)))
  assert.ok(viteConfig, 'une configuration Vite doit exister')
  assert.match(readRequiredFile(viteConfig), /plugin-react|@vitejs\/plugin-react/, 'Vite doit utiliser le plugin React')
})

test('la commande npm de développement est documentée et sert réellement la SPA', { timeout: 30_000 }, async () => {
  const packageJson = readPackageJson()
  const readme = readRequiredFile('README.md')

  assert.equal(typeof packageJson.scripts?.dev, 'string', 'le script npm dev doit être déclaré')
  assert.match(readme, /npm\s+(?:run\s+)?dev\b/i, 'README.md doit documenter la commande npm de développement')

  const port = await reservePort()
  const child = spawn(
    npmExecutable,
    ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { cwd: repositoryRoot, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let output = ''
  child.stdout.on('data', (chunk) => { output += chunk })
  child.stderr.on('data', (chunk) => { output += chunk })

  try {
    const deadline = Date.now() + 20_000
    let response
    while (Date.now() < deadline && !response) {
      if (child.exitCode !== null) break
      try {
        response = await fetch(`http://127.0.0.1:${port}/`)
      } catch {
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 200))
      }
    }

    assert.ok(response, `le serveur de développement n'a pas démarré\n${output}`)
    assert.equal(response.status, 200, `la racine locale doit répondre 200, reçu ${response.status}`)
    assert.match(await response.text(), /<[^>]*id=["']root["'][^>]*>/i, 'la page servie doit contenir le point de montage React')
  } finally {
    await stopProcess(child)
  }
})

test('la commande npm de build documentée produit une application statique dans dist/', () => {
  const packageJson = readPackageJson()
  const readme = readRequiredFile('README.md')

  assert.equal(typeof packageJson.scripts?.build, 'string', 'le script npm build doit être déclaré')
  assert.match(readme, /npm\s+run\s+build\b/i, 'README.md doit documenter npm run build')
  assert.match(readme, /\bdist\/?\b/i, 'README.md doit identifier dist/ comme répertoire de production')

  runNpmScript('build')

  const builtIndex = readRequiredFile(join('dist', 'index.html'))
  assert.match(builtIndex, /<script\b[^>]*\bsrc=/i, 'dist/index.html doit charger le bundle de production')
  assert.doesNotMatch(builtIndex, /(?:localhost|127\.0\.0\.1)/i, 'le build ne doit pas dépendre du serveur local')
})

test('la vérification TypeScript locale s’achève sans erreur', () => {
  const packageJson = readPackageJson()
  assert.equal(typeof packageJson.scripts?.typecheck, 'string', 'un script npm typecheck doit être déclaré')
  runNpmScript('typecheck')
})

test('l’application reste autonome, sans API, serveur applicatif ni base de données', () => {
  const packageJson = readPackageJson()
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }

  const forbiddenRuntimePackages = [
    'axios', 'express', 'fastify', 'koa', 'hapi', '@hapi/hapi', 'nestjs', '@nestjs/core',
    'mongoose', 'mongodb', 'mysql', 'mysql2', 'pg', 'postgres', 'sequelize', 'typeorm',
    'prisma', '@prisma/client', 'firebase', '@supabase/supabase-js',
  ]
  const declaredForbiddenPackages = forbiddenRuntimePackages.filter((name) => dependencies[name])
  assert.deepEqual(
    declaredForbiddenPackages,
    [],
    `dépendances distantes/backend interdites: ${declaredForbiddenPackages.join(', ')}`,
  )

  const runtimeFiles = [
    ...allFiles(join(repositoryRoot, 'src')),
    join(repositoryRoot, 'index.html'),
  ].filter((file) => existsSync(file) && ['.ts', '.tsx', '.js', '.jsx', '.html', '.css'].includes(extname(file)))

  const remoteUsage = runtimeFiles.flatMap((file) => {
    const content = readFileSync(file, 'utf8')
    const patterns = [
      /\bfetch\s*\(/g,
      /\b(?:XMLHttpRequest|WebSocket|EventSource)\b/g,
      /\b(?:src|action)\s*=\s*['"]https?:\/\//gi,
      /@import\s+(?:url\()?\s*['"]?https?:\/\//gi,
      /url\(\s*['"]?https?:\/\//gi,
    ]
    return patterns
      .filter((pattern) => pattern.test(content))
      .map(() => relative(repositoryRoot, file))
  })

  assert.deepEqual(
    [...new Set(remoteUsage)],
    [],
    `aucun accès réseau distant ne doit être nécessaire: ${[...new Set(remoteUsage)].join(', ')}`,
  )
})
