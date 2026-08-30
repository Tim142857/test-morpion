import assert from 'node:assert/strict'
import { join } from 'node:path'
import test from 'node:test'
import {
  GITHUB_PAGES_BASE,
  ensureProductionBuild,
  extractAssetReferences,
  readRequiredFile,
  reservePort,
  startPreviewServer,
  stopProcess,
} from './helpers.mjs'

test('l’ouverture directe de l’URL publiée simulée affiche l’application', { timeout: 45_000 }, async () => {
  ensureProductionBuild()
  const port = await reservePort()
  const { child, baseUrl } = await startPreviewServer(port)

  try {
    const response = await fetch(baseUrl)
    assert.equal(response.status, 200, `l’URL directe ${baseUrl} doit répondre 200, reçu ${response.status}`)

    const html = await response.text()
    assert.match(html, /<[^>]*id=["']root["'][^>]*>/i, 'la page publiée doit contenir le point de montage React')
    assert.match(html, /<script\b[^>]*\bsrc=/i, 'la page publiée doit charger le bundle applicatif')

    const references = extractAssetReferences(html)
    const scriptReference = references.find((reference) => reference.endsWith('.js'))
    assert.ok(scriptReference, 'la page publiée doit référencer le bundle JavaScript')

    const assetResponse = await fetch(new URL(scriptReference, baseUrl))
    assert.equal(
      assetResponse.status,
      200,
      `le bundle ${scriptReference} doit être accessible sans 404`,
    )
  } finally {
    await stopProcess(child)
  }
})

test('le rechargement de la page publiée ne provoque pas d’erreur 404', { timeout: 45_000 }, async () => {
  ensureProductionBuild()
  const port = await reservePort()
  const { child, baseUrl } = await startPreviewServer(port)

  try {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const response = await fetch(baseUrl, { headers: { 'Cache-Control': 'no-cache' } })
      assert.equal(
        response.status,
        200,
        `le rechargement n°${attempt} de ${baseUrl} doit répondre 200, reçu ${response.status}`,
      )
      assert.match(
        await response.text(),
        /<[^>]*id=["']root["'][^>]*>/i,
        `le rechargement n°${attempt} doit toujours servir l’application`,
      )
    }
  } finally {
    await stopProcess(child)
  }
})

test('les ressources statiques restent accessibles sous le chemin de base après chargement initial', { timeout: 45_000 }, async () => {
  ensureProductionBuild()

  const indexHtml = readRequiredFile(join('dist', 'index.html'))
  const references = extractAssetReferences(indexHtml).filter((reference) => reference.startsWith(GITHUB_PAGES_BASE))

  const port = await reservePort()
  const { child, baseUrl } = await startPreviewServer(port)

  try {
    for (const reference of references) {
      const response = await fetch(new URL(reference, baseUrl))
      assert.equal(
        response.status,
        200,
        `la ressource ${reference} doit rester accessible sous ${GITHUB_PAGES_BASE}`,
      )
    }
  } finally {
    await stopProcess(child)
  }
})

test('les requêtes concurrentes sur l’URL publiée restent stables', { timeout: 45_000 }, async () => {
  ensureProductionBuild()
  const port = await reservePort()
  const { child, baseUrl } = await startPreviewServer(port)

  try {
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => fetch(baseUrl, { headers: { 'Cache-Control': 'no-cache' } })),
    )

    for (const [index, response] of responses.entries()) {
      assert.equal(
        response.status,
        200,
        `la requête concurrente n°${index + 1} doit répondre 200, reçu ${response.status}`,
      )
    }
  } finally {
    await stopProcess(child)
  }
})
