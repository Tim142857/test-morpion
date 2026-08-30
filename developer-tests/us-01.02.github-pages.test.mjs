import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build, loadConfigFromFile } from 'vite'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const githubPagesBase = '/test-morpion/'

test('Vite utilise le chemin de base du site de projet GitHub Pages', async () => {
  const loadedConfig = await loadConfigFromFile(
    { command: 'build', mode: 'production' },
    join(repositoryRoot, 'vite.config.ts'),
    repositoryRoot,
    undefined,
    undefined,
    'runner',
  )

  assert.ok(loadedConfig, 'vite.config.ts doit pouvoir etre charge')
  assert.equal(loadedConfig.config.base, githubPagesBase)
})

test('le build reference toutes ses ressources depuis le chemin GitHub Pages', async () => {
  await build({
    root: repositoryRoot,
    configLoader: 'runner',
    logLevel: 'silent',
  })

  const productionHtml = readFileSync(join(repositoryRoot, 'dist', 'index.html'), 'utf8')
  const resourceUrls = [
    ...productionHtml.matchAll(/(?:href|src)="([^"]+)"/g),
  ].map((match) => match[1])

  assert.ok(resourceUrls.length > 0, 'le build doit contenir des ressources')
  assert.ok(
    resourceUrls.every((url) => url.startsWith(githubPagesBase)),
    `ressources hors du chemin ${githubPagesBase}: ${resourceUrls.join(', ')}`,
  )
  assert.doesNotMatch(
    productionHtml,
    /(?:href|src)="https?:\/\//,
    'la page ne doit dependre d aucune ressource distante',
  )
})
