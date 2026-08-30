import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import {
  findQualityWorkflows,
  npmExecutable,
  readRequiredFile,
  repositoryRoot,
} from './helpers.mjs'

test('eslint est configuré pour analyser les sources TypeScript React', () => {
  const eslintConfig = readRequiredFile('eslint.config.js')

  assert.match(eslintConfig, /typescript-eslint|@typescript-eslint/, 'ESLint doit intégrer TypeScript')
  assert.match(eslintConfig, /react-hooks|eslint-plugin-react-hooks/, 'ESLint doit couvrir les hooks React')
})

test('un lint volontairement invalide échoue localement', () => {
  const tempDirectory = mkdtempSync(join(repositoryRoot, '.reviewer-lint-'))
  const offendingFile = join(tempDirectory, 'lint-offender.ts')

  try {
    writeFileSync(offendingFile, 'const unused = 1\n', 'utf8')

    const result = spawnSync(
      npmExecutable,
      ['exec', '--', 'eslint', offendingFile],
      {
        cwd: repositoryRoot,
        encoding: 'utf8',
        timeout: 120_000,
        shell: process.platform === 'win32',
      },
    )

    assert.notEqual(result.status, 0, 'ESLint doit échouer sur une violation volontaire')
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true })
  }
})

test('un typecheck volontairement invalide échoue localement', () => {
  const tempDirectory = mkdtempSync(join(repositoryRoot, '.reviewer-typecheck-'))
  const offendingFile = join(tempDirectory, 'typecheck-offender.ts')

  try {
    writeFileSync(offendingFile, 'const broken: number = "text"\n', 'utf8')

    const result = spawnSync(
      npmExecutable,
      ['exec', '--', 'tsc', '--noEmit', offendingFile],
      {
        cwd: repositoryRoot,
        encoding: 'utf8',
        timeout: 120_000,
        shell: process.platform === 'win32',
      },
    )

    assert.notEqual(result.status, 0, 'tsc --noEmit doit échouer sur une erreur de type')
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true })
  }
})

test('le workflow de qualité exécute lint avant ou indépendamment du build applicatif complet', () => {
  const qualityWorkflows = findQualityWorkflows()
  assert.ok(qualityWorkflows.length > 0, 'un workflow de qualité doit exister')

  for (const workflow of qualityWorkflows) {
    const lintIndex = workflow.content.search(/\bnpm\s+run\s+lint\b/)
    const typecheckIndex = workflow.content.search(/\bnpm\s+run\s+typecheck\b/)
    const buildIndex = workflow.content.search(/\bnpm\s+run\s+build\b/)

    assert.notEqual(lintIndex, -1, `${workflow.path} doit exécuter npm run lint`)
    assert.notEqual(typecheckIndex, -1, `${workflow.path} doit exécuter npm run typecheck`)

    if (buildIndex !== -1) {
      assert.ok(
        lintIndex < buildIndex && typecheckIndex < buildIndex,
        `${workflow.path} doit valider lint/typecheck avant un éventuel build`,
      )
    }
  }
})

test('plusieurs workflows peuvent coexister mais au moins un couvre les contrôles de base', () => {
  const qualityWorkflows = findQualityWorkflows()

  assert.ok(
    qualityWorkflows.length >= 1,
    'au moins un workflow doit regrouper lint et typecheck pour US-01.03',
  )
})

test('le dépôt ignore dist/ pour éviter que le lint analyse des artefacts de production', () => {
  const gitignore = readRequiredFile('.gitignore')

  assert.match(gitignore, /\bdist\/?\b/, '.gitignore doit exclure dist/')
})
