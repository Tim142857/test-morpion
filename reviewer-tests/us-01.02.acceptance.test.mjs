import assert from 'node:assert/strict'
import { join } from 'node:path'
import test from 'node:test'
import {
  GITHUB_PAGES_BASE,
  GITHUB_PAGES_URL,
  ensureProductionBuild,
  extractAssetReferences,
  findViteConfigPath,
  listDistFiles,
  readPackageJson,
  readRequiredFile,
  repositoryRoot,
} from './helpers.mjs'

test('le chemin de base GitHub Pages est configuré dans Vite', () => {
  const viteConfig = readRequiredFile(findViteConfigPath())

  assert.match(
    viteConfig,
    /base\s*:\s*['"]\/test-morpion\/['"]/,
    `vite.config doit déclarer base: '${GITHUB_PAGES_BASE}' pour GitHub Pages`,
  )
})

test('le build de production applique le chemin de base aux ressources', () => {
  ensureProductionBuild()

  const indexHtml = readRequiredFile(join('dist', 'index.html'))
  const references = extractAssetReferences(indexHtml)

  assert.ok(references.length > 0, 'dist/index.html doit référencer des ressources de production')

  for (const reference of references) {
    if (reference.startsWith('data:') || reference.startsWith('#')) continue
    assert.match(
      reference,
      /^\/test-morpion\//,
      `la ressource "${reference}" doit être préfixée par ${GITHUB_PAGES_BASE}`,
    )
  }

  const scriptReference = references.find((reference) => reference.endsWith('.js'))
  assert.ok(scriptReference, 'dist/index.html doit charger un bundle JavaScript')
  assert.match(scriptReference, /^\/test-morpion\/assets\//, 'le bundle doit résider sous /test-morpion/assets/')
})

test('les artefacts statiques générés restent cohérents avec le chemin de base', () => {
  ensureProductionBuild()

  const distFiles = listDistFiles()
  assert.ok(distFiles.includes('index.html'), 'dist/ doit contenir index.html')
  assert.ok(
    distFiles.some((file) => file.startsWith('assets/') && file.endsWith('.js')),
    'dist/ doit contenir un bundle JavaScript',
  )

  const indexHtml = readRequiredFile(join('dist', 'index.html'))
  for (const reference of extractAssetReferences(indexHtml)) {
    if (!reference.startsWith(GITHUB_PAGES_BASE)) continue
    const relativePath = reference.slice(GITHUB_PAGES_BASE.length)
    assert.ok(
      distFiles.includes(relativePath),
      `la ressource référencée ${reference} doit exister dans dist/${relativePath}`,
    )
  }
})

test('la documentation expose l’URL publiée et le chemin de base GitHub Pages', () => {
  const readme = readRequiredFile('README.md')

  assert.match(readme, /test-morpion/i, 'README.md doit mentionner le dépôt test-morpion')
  assert.match(
    readme,
    /tim142857\.github\.io\/test-morpion\/?/i,
    `README.md doit documenter l’URL publiée ${GITHUB_PAGES_URL}`,
  )
  assert.match(
    readme,
    /\/test-morpion\//,
    'README.md doit documenter le chemin de base /test-morpion/',
  )
})

test('le script npm preview permet de valider localement le déploiement GitHub Pages', () => {
  const packageJson = readPackageJson()
  const readme = readRequiredFile('README.md')

  assert.equal(typeof packageJson.scripts?.preview, 'string', 'le script npm preview doit exister')
  assert.match(
    readme,
    /npm\s+run\s+preview\b/i,
    'README.md doit documenter npm run preview pour valider le build sous le chemin de base',
  )
})
