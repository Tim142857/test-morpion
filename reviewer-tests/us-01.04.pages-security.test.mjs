import assert from 'node:assert/strict'
import test from 'node:test'
import { readWorkflowFiles } from './helpers.mjs'

function deployments() {
  return readWorkflowFiles().filter(({ content }) => /actions\/deploy-pages@/i.test(content))
}

function jobsOf(content) {
  const start = content.search(/^jobs:\s*$/m)
  if (start < 0) return []
  const section = content.slice(start)
  const headers = [...section.matchAll(/^  ([\w-]+):\s*(?:#.*)?$/gm)]
  return headers.map((header, index) => ({
    name: header[1],
    block: section.slice(header.index, headers[index + 1]?.index ?? section.length),
  }))
}

test('seul deploy-pages reçoit pages: write et id-token: write', () => {
  const workflows = deployments()
  assert.ok(workflows.length, 'un workflow de déploiement Pages doit exister')
  for (const workflow of workflows) {
    const jobsStart = workflow.content.search(/^jobs:\s*$/m)
    const globalConfiguration = workflow.content.slice(0, jobsStart)
    assert.doesNotMatch(globalConfiguration, /^  pages:\s*write\s*$/m, `${workflow.path} ne doit pas accorder pages: write globalement`)
    assert.doesNotMatch(globalConfiguration, /^  id-token:\s*write\s*$/m, `${workflow.path} ne doit pas accorder id-token: write globalement`)

    for (const { name, block } of jobsOf(workflow.content)) {
      if (/actions\/deploy-pages@/i.test(block)) {
        assert.match(block, /^    permissions:\s*$/m, `${workflow.path}#${name} doit limiter ses permissions`)
        assert.match(block, /^      pages:\s*write\s*$/m, `${workflow.path}#${name} requiert pages: write`)
        assert.match(block, /^      id-token:\s*write\s*$/m, `${workflow.path}#${name} requiert id-token: write`)
        assert.doesNotMatch(block, /^      contents:\s*write\s*$/m, `${workflow.path}#${name} ne doit pas écrire le dépôt`)
      } else {
        assert.doesNotMatch(block, /^      pages:\s*write\s*$/m, `${workflow.path}#${name} ne doit pas publier`)
        assert.doesNotMatch(block, /^      id-token:\s*write\s*$/m, `${workflow.path}#${name} ne doit pas obtenir de jeton OIDC`)
      }
    }
  }
})

test('aucun secret n’est injecté dans le build statique ou le déploiement', () => {
  const workflows = deployments()
  assert.ok(workflows.length, 'un workflow de déploiement Pages doit exister')
  for (const workflow of workflows) {
    assert.doesNotMatch(workflow.content, /\$\{\{\s*secrets\./i, `${workflow.path} ne doit dépendre d'aucun secret`)
  }
})

test('les déploiements concurrents utilisent un groupe Pages stable', () => {
  const workflows = deployments()
  assert.ok(workflows.length, 'un workflow de déploiement Pages doit exister')
  for (const workflow of workflows) {
    assert.match(workflow.content, /^concurrency:\s*$/m, `${workflow.path} doit déclarer concurrency`)
    assert.match(workflow.content, /^  group:\s*[^\n]*(?:pages|github-pages)[^\n]*$/mi, `${workflow.path} doit définir un groupe Pages`)
  }
})

test('les actions Pages officielles ont une référence non flottante', () => {
  const workflows = deployments()
  assert.ok(workflows.length, 'un workflow de déploiement Pages doit exister')
  for (const workflow of workflows) {
    for (const action of ['upload-pages-artifact', 'deploy-pages']) {
      const reference = workflow.content.match(new RegExp(`actions/${action}@([^\\s#]+)`, 'i'))
      assert.ok(reference, `${workflow.path} doit utiliser actions/${action}`)
      assert.doesNotMatch(reference[1], /^(?:main|master|latest)$/i, `${action} ne doit pas suivre une branche flottante`)
    }
  }
})
