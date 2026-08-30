import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import {
  GITHUB_PAGES_BASE,
  ensureProductionBuild,
  extractAssetReferences,
  readRequiredFile,
  repositoryRoot,
  reservePort,
  startPreviewServer,
  stopProcess,
} from './helpers.mjs'

test('les assets publics sont publiés sous le chemin de base', () => {
  ensureProductionBuild()

  const publicAsset = 'vite.svg'
  assert.ok(
    existsSync(join(repositoryRoot, 'public', publicAsset)),
    `public/${publicAsset} doit exister pour valider la copie sous GitHub Pages`,
  )
  assert.ok(
    existsSync(join(repositoryRoot, 'dist', publicAsset)),
    `le build doit copier ${publicAsset} à la racine de dist/`,
  )

  const indexHtml = readRequiredFile(join('dist', 'index.html'))
  const iconReference = extractAssetReferences(indexHtml).find((reference) => reference.endsWith(publicAsset))
  assert.ok(iconReference, `dist/index.html doit référencer ${publicAsset}`)
  assert.match(
    iconReference,
    /^\/test-morpion\//,
    `l’icône ${publicAsset} doit être servie sous ${GITHUB_PAGES_BASE}`,
  )
})

test('la racine sans slash final reste accessible ou redirigée sans 404 bloquant', { timeout: 45_000 }, async () => {
  ensureProductionBuild()
  const port = await reservePort()
  const { child } = await startPreviewServer(port)

  const baseWithoutTrailingSlash = GITHUB_PAGES_BASE.slice(0, -1)
  const candidateUrls = [
    `http://127.0.0.1:${port}${GITHUB_PAGES_BASE}`,
    `http://127.0.0.1:${port}${baseWithoutTrailingSlash}`,
  ]

  try {
    let served = false
    for (const url of candidateUrls) {
      const response = await fetch(url, { redirect: 'follow' })
      if (response.status === 200) {
        served = true
        assert.match(await response.text(), /<[^>]*id=["']root["'][^>]*>/i)
        break
      }
    }

    assert.ok(served, `au moins une variante de l’URL publiée (${candidateUrls.join(' ou ')}) doit servir l’application`)
  } finally {
    await stopProcess(child)
  }
})

test('les chemins absolus de développement ne fuient pas dans le build de production', () => {
  ensureProductionBuild()

  const indexHtml = readRequiredFile(join('dist', 'index.html'))
  assert.doesNotMatch(indexHtml, /\/src\/main\.tsx/, 'le build ne doit pas conserver la référence de développement /src/main.tsx')
  assert.doesNotMatch(indexHtml, /href=["']\/vite\.svg["']/, 'le build ne doit pas conserver href="/vite.svg" sans préfixe de base')
})

test('le point d’entrée React reste monté sans routage profond requis', () => {
  ensureProductionBuild()

  const indexHtml = readRequiredFile(join('dist', 'index.html'))
  assert.match(indexHtml, /<div[^>]*id=["']root["'][^>]*>\s*<\/div>/i, 'dist/index.html doit conserver un conteneur React vide prêt au montage')
  assert.doesNotMatch(
    indexHtml,
    /react-router|BrowserRouter|createBrowserRouter/i,
    'aucun routage par chemin ne doit être requis pour charger la racine publiée dans cet epic',
  )
})
