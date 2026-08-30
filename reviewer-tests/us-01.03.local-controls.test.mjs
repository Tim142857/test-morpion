import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import test from 'node:test'
import {
  npmExecutable,
  readPackageJson,
  readRequiredFile,
  repositoryRoot,
  runNpmScript,
} from './helpers.mjs'

function runNpmScriptAsync(script) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(
      npmExecutable,
      ['run', script],
      {
        cwd: repositoryRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      },
    )

    let output = ''
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })

    child.on('error', rejectPromise)
    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise(output)
        return
      }

      rejectPromise(new Error(`npm run ${script} a échoué.\n${output}`))
    })
  })
}

test('lint et typecheck locaux réussissent sur le socle actuel', () => {
  runNpmScript('lint')
  runNpmScript('typecheck')
})

test('les commandes documentées correspondent aux scripts npm déclarés', () => {
  const packageJson = readPackageJson()
  const readme = readRequiredFile('README.md')

  for (const script of ['lint', 'typecheck']) {
    assert.equal(typeof packageJson.scripts?.[script], 'string', `le script npm ${script} doit exister`)
    assert.match(
      readme,
      new RegExp(`npm\\s+run\\s+${script}\\b`, 'i'),
      `README.md doit documenter npm run ${script}`,
    )
  }
})

test('le script lint invoque ESLint sur le code source', () => {
  const packageJson = readPackageJson()
  const lintScript = packageJson.scripts?.lint ?? ''

  assert.match(lintScript, /\beslint\b/i, 'npm run lint doit invoquer ESLint')
})

test('le script typecheck invoque la compilation TypeScript sans émission', () => {
  const packageJson = readPackageJson()
  const typecheckScript = packageJson.scripts?.typecheck ?? ''

  assert.match(typecheckScript, /\btsc\b/, 'npm run typecheck doit invoquer tsc')
  assert.match(typecheckScript, /--noEmit|--no-emit/, 'npm run typecheck doit vérifier sans produire de fichiers')
})

test('package-lock.json permet une installation reproductible des contrôles locaux', () => {
  readRequiredFile('package-lock.json')
})

test('lint et typecheck peuvent s’exécuter en parallèle sans conflit', { timeout: 180_000 }, async () => {
  await Promise.all([
    runNpmScriptAsync('lint'),
    runNpmScriptAsync('typecheck'),
  ])
})
