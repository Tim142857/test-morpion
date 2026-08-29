import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function readJson(pathFromRoot) {
  const absolutePath = join(repositoryRoot, pathFromRoot)
  assert.ok(existsSync(absolutePath), `${pathFromRoot} doit exister`)
  return JSON.parse(readFileSync(absolutePath, 'utf8'))
}

function readRequiredFile(pathFromRoot) {
  const absolutePath = join(repositoryRoot, pathFromRoot)
  assert.ok(existsSync(absolutePath), `${pathFromRoot} doit exister`)
  return readFileSync(absolutePath, 'utf8')
}

const VITE_NODE_ENGINES = '^20.19.0 || >=22.12.0'

test('engines.node du projet est aligné sur Vite 7 et @vitejs/plugin-react', () => {
  const packageJson = readJson('package.json')
  const viteEngines = readJson('node_modules/vite/package.json').engines?.node
  const pluginReactEngines = readJson('node_modules/@vitejs/plugin-react/package.json').engines?.node

  assert.equal(packageJson.engines?.node, VITE_NODE_ENGINES)
  assert.equal(viteEngines, VITE_NODE_ENGINES)
  assert.equal(pluginReactEngines, VITE_NODE_ENGINES)
})

test('README.md documente la plage Node compatible avec Vite 7', () => {
  const readme = readRequiredFile('README.md')

  assert.match(readme, /\^20\.19\.0/)
  assert.match(readme, />=22\.12\.0/)
  assert.doesNotMatch(
    readme,
    /20\s+LTS\s+ou\s+version\s+ultérieure/i,
    'README ne doit pas annoncer une plage Node plus large que Vite 7',
  )
})
