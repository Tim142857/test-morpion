import assert from 'node:assert/strict'
import test from 'node:test'
import {
  findQualityWorkflows,
  readPackageJson,
  readRequiredFile,
  readWorkflowFiles,
} from './helpers.mjs'

test('un workflow GitHub Actions exécute lint et typecheck sur pull_request et main', () => {
  const workflows = readWorkflowFiles()
  assert.ok(workflows.length > 0, '.github/workflows/ doit contenir au moins un workflow')

  const qualityWorkflows = findQualityWorkflows(workflows)
  assert.ok(
    qualityWorkflows.length > 0,
    'un workflow doit déclencher lint et typecheck sur pull_request et push vers main',
  )

  for (const workflow of qualityWorkflows) {
    assert.match(
      workflow.content,
      /\bnpm\s+ci\b/,
      `${workflow.path} doit installer les dépendances avec npm ci pour des contrôles reproductibles`,
    )
    assert.match(
      workflow.content,
      /\bnpm\s+run\s+lint\b/,
      `${workflow.path} doit exécuter npm run lint`,
    )
    assert.match(
      workflow.content,
      /\bnpm\s+run\s+typecheck\b/,
      `${workflow.path} doit exécuter npm run typecheck`,
    )
  }
})

test('les scripts npm lint et typecheck sont déclarés pour les contrôles locaux', () => {
  const packageJson = readPackageJson()

  assert.equal(typeof packageJson.scripts?.lint, 'string', 'le script npm lint doit être déclaré')
  assert.equal(typeof packageJson.scripts?.typecheck, 'string', 'le script npm typecheck doit être déclaré')
})

test('README.md documente les contrôles locaux lint et typecheck', () => {
  const readme = readRequiredFile('README.md')

  assert.match(readme, /npm\s+run\s+lint\b/i, 'README.md doit documenter npm run lint')
  assert.match(readme, /npm\s+run\s+typecheck\b/i, 'README.md doit documenter npm run typecheck')
})

test('le workflow de qualité n’exige pas de tests applicatifs non implémentés', () => {
  const qualityWorkflows = findQualityWorkflows()

  assert.ok(qualityWorkflows.length > 0, 'un workflow de qualité doit exister')

  for (const workflow of qualityWorkflows) {
    const mandatoryTestCommands = [
      /\bnpm\s+test\b/,
      /\bnpm\s+run\s+test\b/,
      /\bnpm\s+run\s+test:unit\b/,
      /\bnpm\s+run\s+test:e2e\b/,
    ]

    const offenders = mandatoryTestCommands.filter((pattern) => pattern.test(workflow.content))
    assert.deepEqual(
      offenders,
      [],
      `${workflow.path} ne doit pas exiger de tests applicatifs obligatoires tant qu’ils ne sont pas implémentés`,
    )
  }
})
