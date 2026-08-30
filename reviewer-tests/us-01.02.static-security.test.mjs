import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import test from 'node:test'
import {
  allFiles,
  runProductionBuild,
  repositoryRoot,
} from './helpers.mjs'

const SOURCE_REMOTE_PATTERNS = [
  /\bfetch\s*\(/g,
  /\b(?:XMLHttpRequest|WebSocket|EventSource)\b/g,
  /\b(?:src|action)\s*=\s*['"]https?:\/\//gi,
  /@import\s+(?:url\()?\s*['"]?https?:\/\//gi,
  /url\(\s*['"]?https?:\/\//gi,
]

test('aucun service distant n’est requis après le chargement initial', () => {
  runProductionBuild()

  const runtimeFiles = [
    ...allFiles(join(repositoryRoot, 'src')),
    join(repositoryRoot, 'index.html'),
  ].filter((file) => ['.ts', '.tsx', '.js', '.jsx', '.html', '.css'].includes(extname(file)))

  const remoteUsage = runtimeFiles.flatMap((file) => {
    const content = readFileSync(file, 'utf8')
    return SOURCE_REMOTE_PATTERNS
      .filter((pattern) => {
        pattern.lastIndex = 0
        return pattern.test(content)
      })
      .map(() => relative(repositoryRoot, file))
  })

  assert.deepEqual(
    [...new Set(remoteUsage)],
    [],
    `aucun accès réseau distant ne doit être requis après chargement initial: ${[...new Set(remoteUsage)].join(', ')}`,
  )
})

test('le build de production n’expose pas de secrets ni de jetons dans les artefacts statiques', () => {
  runProductionBuild()

  const distRoot = join(repositoryRoot, 'dist')
  const secretPatterns = [
    /\bghp_[A-Za-z0-9]{20,}\b/,
    /\bgho_[A-Za-z0-9]{20,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
    /\bsk-[A-Za-z0-9]{20,}\b/,
    /\b(?:api[_-]?key|client[_-]?secret|private[_-]?key)\s*[:=]\s*['"][^'"]{8,}['"]/i,
  ]

  const offenders = allFiles(distRoot).flatMap((file) => {
    const content = readFileSync(file, 'utf8')
    return secretPatterns
      .filter((pattern) => pattern.test(content))
      .map(() => file.replace(repositoryRoot + '\\', '').replace(repositoryRoot + '/', ''))
  })

  assert.deepEqual(
    [...new Set(offenders)],
    [],
    `aucun artefact statique ne doit contenir de secret apparent: ${[...new Set(offenders)].join(', ')}`,
  )
})

test('le build de production ne référence pas de chemins absolus hors du chemin de base', () => {
  runProductionBuild()

  const indexHtml = readFileSync(join(repositoryRoot, 'dist', 'index.html'), 'utf8')
  const absoluteOutsideBase = [...indexHtml.matchAll(/\b(?:src|href)\s*=\s*["'](\/(?!test-morpion\/)[^"']+)["']/gi)]
    .map((match) => match[1])

  assert.deepEqual(
    absoluteOutsideBase,
    [],
    `les ressources de production ne doivent pas utiliser de chemins absolus hors /test-morpion/: ${absoluteOutsideBase.join(', ')}`,
  )
})

test('les bundles de production n’embarquent pas d’appels réseau distants', () => {
  runProductionBuild()

  const distRoot = join(repositoryRoot, 'dist')
  const bundlePatterns = [
    /\bfetch\s*\(\s*['"]https?:\/\//,
    /\bnew\s+XMLHttpRequest\b/,
    /\bnew\s+WebSocket\s*\(\s*['"]wss?:\/\//,
    /\bnew\s+EventSource\s*\(\s*['"]https?:\/\//,
  ]

  const offenders = allFiles(distRoot)
    .filter((file) => ['.js', '.css'].includes(extname(file)))
    .flatMap((file) => {
      const content = readFileSync(file, 'utf8')
      return bundlePatterns
        .filter((pattern) => pattern.test(content))
        .map(() => relative(distRoot, file).replace(/\\/g, '/'))
    })

  assert.deepEqual(
    [...new Set(offenders)],
    [],
    `les artefacts compilés ne doivent pas déclencher d’appels réseau distants: ${[...new Set(offenders)].join(', ')}`,
  )
})

test('l’application reste utilisable sans backend après compilation', () => {
  runProductionBuild()

  const bundlePath = allFiles(join(repositoryRoot, 'dist')).find((file) => extname(file) === '.js' && file.includes('assets'))
  assert.ok(bundlePath, 'un bundle JavaScript de production doit exister')

  const bundle = readFileSync(bundlePath, 'utf8')
  const backendMarkers = [
    /\bexpress\b/i,
    /\bfastify\b/i,
    /\b@nestjs\b/i,
    /\bgraphql\b/i,
    /\bprisma\b/i,
  ]

  const offenders = backendMarkers.filter((pattern) => pattern.test(bundle))
  assert.equal(
    offenders.length,
    0,
    'le bundle ne doit pas embarquer de dépendance serveur ou API distante',
  )
})
