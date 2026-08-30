import assert from 'node:assert/strict'
import test from 'node:test'
import { readRequiredFile } from '../reviewer-tests/helpers.mjs'

const deployWorkflow = readRequiredFile('.github/workflows/deploy.yml')

function jobsOf(content) {
  const start = content.search(/^jobs:\s*$/m)
  if (start < 0) return new Map()
  const section = content.slice(start)
  const headers = [...section.matchAll(/^  ([\w-]+):\s*(?:#.*)?$/gm)]
  return new Map(headers.map((header, index) => [
    header[1],
    section.slice(header.index, headers[index + 1]?.index ?? section.length),
  ]))
}

test('le deploiement ne depend pas d un workflow_run declenche par une pull request', () => {
  assert.doesNotMatch(
    deployWorkflow,
    /^on:\s*[\s\S]*?\bworkflow_run\b/m,
    'deploy.yml ne doit pas reagir aux executions Qualite des pull requests',
  )
  assert.match(
    deployWorkflow,
    /^on:\s*[\s\S]*?^  push:\s*[\s\S]*?^      -\s*main\s*$/m,
    'deploy.yml doit se declencher uniquement sur push vers main',
  )
})

test('le build utilise le commit pousse sur main, pas un head_sha externe', () => {
  assert.doesNotMatch(
    deployWorkflow,
    /workflow_run\.head_sha/,
    'deploy.yml ne doit pas reconstruire un commit arbitraire via workflow_run.head_sha',
  )

  const buildJob = jobsOf(deployWorkflow).get('build')
  assert.ok(buildJob, 'deploy.yml doit contenir un job build')
  assert.doesNotMatch(
    buildJob,
    /ref:\s*\$\{\{\s*github\.event\.workflow_run\.head_sha\s*\}\}/,
    'le checkout build doit rester sur le SHA pousse sur main',
  )
})

test('seul le job deploy recoit les permissions Pages et OIDC', () => {
  const jobsStart = deployWorkflow.search(/^jobs:\s*$/m)
  const globalConfiguration = deployWorkflow.slice(0, jobsStart)

  assert.doesNotMatch(globalConfiguration, /^  pages:\s*write\s*$/m)
  assert.doesNotMatch(globalConfiguration, /^  id-token:\s*write\s*$/m)

  for (const [name, block] of jobsOf(deployWorkflow)) {
    if (name === 'deploy') {
      assert.match(block, /^    permissions:\s*$/m)
      assert.match(block, /^      pages:\s*write\s*$/m)
      assert.match(block, /^      id-token:\s*write\s*$/m)
      continue
    }

    assert.doesNotMatch(block, /^      pages:\s*write\s*$/m, `${name} ne doit pas publier`)
    assert.doesNotMatch(block, /^      id-token:\s*write\s*$/m, `${name} ne doit pas obtenir de jeton OIDC`)
  }
})
