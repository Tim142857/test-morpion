import assert from 'node:assert/strict'
import test from 'node:test'
import {
  findQualityWorkflows,
} from './helpers.mjs'

const LINT_OR_TYPECHECK_PATTERN = /\bnpm\s+run\s+(?:lint|typecheck)\b/

function lintOrTypecheckSteps(workflowContent) {
  const steps = [...workflowContent.matchAll(/-\s*name:[^\n]*\n([\s\S]*?)(?=\n\s*-\s*name:|\n\s*permissions:|\n\s*[a-z-]+:\s|$)/gi)]
  return steps.filter(([, block]) => LINT_OR_TYPECHECK_PATTERN.test(block))
}

test('un échec lint ou typecheck ne peut pas être ignoré via continue-on-error', () => {
  const qualityWorkflows = findQualityWorkflows()
  assert.ok(qualityWorkflows.length > 0, 'un workflow de qualité doit exister')

  for (const workflow of qualityWorkflows) {
    const lintTypecheckBlocks = lintOrTypecheckSteps(workflow.content)

    assert.ok(
      lintTypecheckBlocks.length > 0,
      `${workflow.path} doit contenir des étapes lint ou typecheck identifiables`,
    )

    for (const [, block] of lintTypecheckBlocks) {
      assert.doesNotMatch(
        block,
        /continue-on-error:\s*true/i,
        `${workflow.path} ne doit pas ignorer les échecs lint/typecheck avec continue-on-error: true`,
      )
      assert.doesNotMatch(
        block,
        /\|\|\s*true\b/,
        `${workflow.path} ne doit pas neutraliser les échecs lint/typecheck avec "|| true"`,
      )
    }
  }
})

test('le job de qualité n’accorde pas de permissions d’écriture inutiles', () => {
  const qualityWorkflows = findQualityWorkflows()
  assert.ok(qualityWorkflows.length > 0, 'un workflow de qualité doit exister')

  for (const workflow of qualityWorkflows) {
    const permissionBlocks = [...workflow.content.matchAll(/permissions:\s*\n([\s\S]*?)(?=\n[^\s]|\n\s*jobs:|\n\s*steps:)/gi)]

    if (permissionBlocks.length === 0) {
      continue
    }

    for (const [, block] of permissionBlocks) {
      assert.doesNotMatch(
        block,
        /\bpages:\s*write\b/i,
        `${workflow.path} ne doit pas accorder pages: write au job de qualité`,
      )
      assert.doesNotMatch(
        block,
        /\bid-token:\s*write\b/i,
        `${workflow.path} ne doit pas accorder id-token: write au job de qualité`,
      )
    }
  }
})

test('le workflow de qualité n’injecte pas de secrets dans les contrôles lint/typecheck', () => {
  const qualityWorkflows = findQualityWorkflows()
  assert.ok(qualityWorkflows.length > 0, 'un workflow de qualité doit exister')

  for (const workflow of qualityWorkflows) {
    const lintTypecheckBlocks = lintOrTypecheckSteps(workflow.content)

    for (const [, block] of lintTypecheckBlocks) {
      assert.doesNotMatch(
        block,
        /\$\{\{\s*secrets\./,
        `${workflow.path} ne doit pas dépendre de secrets GitHub pour lint/typecheck`,
      )
    }
  }
})

test('les actions GitHub utilisées par le workflow de qualité sont référencées explicitement', () => {
  const qualityWorkflows = findQualityWorkflows()
  assert.ok(qualityWorkflows.length > 0, 'un workflow de qualité doit exister')

  for (const workflow of qualityWorkflows) {
    const actionReferences = [...workflow.content.matchAll(/uses:\s*([^\s@]+@([^\s#]+))/g)]
      .map((match) => match[2])

    assert.ok(actionReferences.length > 0, `${workflow.path} doit référencer des actions versionnées`)

    for (const version of actionReferences) {
      assert.notEqual(version, '', `${workflow.path} doit épingler chaque action GitHub`)
    }
  }
})

test('aucun workflow obligatoire n’impose npm test avant lint ou typecheck', () => {
  const qualityWorkflows = findQualityWorkflows()
  assert.ok(qualityWorkflows.length > 0, 'un workflow de qualité doit exister')

  for (const workflow of qualityWorkflows) {
    const testIndex = workflow.content.search(/\bnpm\s+(?:run\s+)?test\b/)
    const lintIndex = workflow.content.search(/\bnpm\s+run\s+lint\b/)
    const typecheckIndex = workflow.content.search(/\bnpm\s+run\s+typecheck\b/)
    const firstQualityIndex = Math.min(
      lintIndex === -1 ? Number.POSITIVE_INFINITY : lintIndex,
      typecheckIndex === -1 ? Number.POSITIVE_INFINITY : typecheckIndex,
    )

    if (testIndex === -1) continue

    assert.ok(
      testIndex > firstQualityIndex,
      `${workflow.path} ne doit pas exécuter npm test avant les contrôles lint/typecheck tant que les tests applicatifs n’existent pas`,
    )
  }
})
