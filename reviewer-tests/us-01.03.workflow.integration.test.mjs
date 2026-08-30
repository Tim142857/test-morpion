import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import {
  findQualityWorkflows,
  readPackageJson,
  repositoryRoot,
} from './helpers.mjs'

const ESLINT_CONFIG_CANDIDATES = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  '.eslintrc.cjs',
  '.eslintrc.json',
]

test('le workflow de qualité réutilise les mêmes scripts npm que le dépôt', () => {
  const packageJson = readPackageJson()
  const qualityWorkflows = findQualityWorkflows()

  assert.ok(qualityWorkflows.length > 0, 'un workflow de qualité doit exister')

  for (const workflow of qualityWorkflows) {
    for (const script of ['lint', 'typecheck']) {
      assert.equal(
        typeof packageJson.scripts?.[script],
        'string',
        `package.json doit déclarer le script ${script} invoqué par ${workflow.path}`,
      )
      assert.match(
        workflow.content,
        new RegExp(`\\bnpm\\s+run\\s+${script}\\b`),
        `${workflow.path} doit invoquer npm run ${script}`,
      )
    }
  }
})

test('le workflow de qualité installe Node.js avant les contrôles', () => {
  const qualityWorkflows = findQualityWorkflows()
  assert.ok(qualityWorkflows.length > 0, 'un workflow de qualité doit exister')

  for (const workflow of qualityWorkflows) {
    assert.match(
      workflow.content,
      /actions\/setup-node@/,
      `${workflow.path} doit configurer Node.js via actions/setup-node`,
    )
    assert.match(
      workflow.content,
      /\bnode-version\b|\bnode-version-file\b/,
      `${workflow.path} doit épingler ou déclarer une version Node.js`,
    )
  }
})

test('le workflow de qualité s’exécute sur ubuntu-latest', () => {
  const qualityWorkflows = findQualityWorkflows()
  assert.ok(qualityWorkflows.length > 0, 'un workflow de qualité doit exister')

  for (const workflow of qualityWorkflows) {
    assert.match(
      workflow.content,
      /runs-on:\s*ubuntu-latest/,
      `${workflow.path} doit cibler ubuntu-latest pour des contrôles reproductibles`,
    )
  }
})

test('les déclencheurs pull_request et push vers main sont explicites', () => {
  const qualityWorkflows = findQualityWorkflows()
  assert.ok(qualityWorkflows.length > 0, 'un workflow de qualité doit exister')

  for (const workflow of qualityWorkflows) {
    assert.match(
      workflow.content,
      /\bon:\s*[\s\S]*?\bpull_request\b/m,
      `${workflow.path} doit écouter les pull_request`,
    )
    assert.match(
      workflow.content,
      /\bon:\s*[\s\S]*?\bpush\b[\s\S]*?\bmain\b/m,
      `${workflow.path} doit écouter les push vers main`,
    )
  }
})

test('la configuration ESLint requise par le lint existe', () => {
  const hasEslintConfig = ESLINT_CONFIG_CANDIDATES.some((file) => existsSync(join(repositoryRoot, file)))
  assert.ok(hasEslintConfig, 'une configuration ESLint doit exister pour le contrôle lint')

  const qualityWorkflows = findQualityWorkflows()
  assert.ok(qualityWorkflows.length > 0, 'un workflow de qualité doit exécuter npm run lint')
})

test('le workflow de qualité checkout le dépôt avant npm ci', () => {
  const qualityWorkflows = findQualityWorkflows()
  assert.ok(qualityWorkflows.length > 0, 'un workflow de qualité doit exister')

  for (const workflow of qualityWorkflows) {
    const checkoutIndex = workflow.content.search(/uses:\s*actions\/checkout@/)
    const installIndex = workflow.content.search(/\bnpm\s+ci\b/)

    assert.notEqual(checkoutIndex, -1, `${workflow.path} doit utiliser actions/checkout`)
    assert.notEqual(installIndex, -1, `${workflow.path} doit exécuter npm ci`)
    assert.ok(
      checkoutIndex < installIndex,
      `${workflow.path} doit checkout le dépôt avant npm ci`,
    )
  }
})
