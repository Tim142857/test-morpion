import assert from 'node:assert/strict'
import test from 'node:test'
import { readPackageJson, readRequiredFile, readWorkflowFiles } from './helpers.mjs'

function deployments() {
  return readWorkflowFiles().filter(({ content }) => /actions\/deploy-pages@/i.test(content))
}

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

function needsOf(block) {
  const match = block.match(/^    needs:\s*([^\n#]*)/m)
  if (!match) return []
  if (match[1].trim()) {
    return match[1].replace(/[\[\]'" ]/g, '').split(',').filter(Boolean)
  }
  return [...block.slice((match.index ?? 0) + match[0].length)
    .matchAll(/^      -\s*([\w-]+)/gm)].map((item) => item[1])
}

function reaches(jobs, current, targets, seen = new Set()) {
  if (targets.has(current)) return true
  if (seen.has(current)) return false
  seen.add(current)
  return needsOf(jobs.get(current) ?? '').some((dependency) => reaches(jobs, dependency, targets, seen))
}

test('un push sur main déclenche un workflow de déploiement Pages', () => {
  const workflows = deployments()
  assert.ok(workflows.length, 'un workflow doit utiliser actions/deploy-pages')
  for (const workflow of workflows) {
    assert.match(
      workflow.content,
      /^on:\s*[\s\S]*?^  push:\s*[\s\S]*?^      -\s*main\s*$/m,
      `${workflow.path} doit écouter les push vers main`,
    )
  }
})

test('deploy-pages dépend du succès d’un job exécutant lint et typecheck', () => {
  const workflows = deployments()
  assert.ok(workflows.length, 'un workflow de déploiement Pages doit exister')
  for (const workflow of workflows) {
    const jobs = jobsOf(workflow.content)
    const quality = new Set([...jobs]
      .filter(([, block]) => /npm\s+run\s+lint\b/.test(block) && /npm\s+run\s+typecheck\b/.test(block))
      .map(([name]) => name))
    const deploy = [...jobs].filter(([, block]) => /actions\/deploy-pages@/i.test(block))
    assert.ok(quality.size, `${workflow.path} doit contenir les contrôles lint et typecheck`)
    assert.ok(deploy.length, `${workflow.path} doit contenir un job deploy-pages`)
    for (const [name, block] of deploy) {
      assert.ok(reaches(jobs, name, quality), `${workflow.path}#${name} doit dépendre du job de qualité`)
      assert.doesNotMatch(block, /if:\s*[^\n]*(?:always|failure)\s*\(/i, 'un échec ne doit pas être contourné')
    }
  }
})

test('le job de déploiement est limité au push sur refs/heads/main', () => {
  const workflows = deployments()
  assert.ok(workflows.length, 'un workflow de déploiement Pages doit exister')
  for (const workflow of workflows) {
    for (const [name, block] of jobsOf(workflow.content)) {
      if (!/actions\/deploy-pages@/i.test(block)) continue
      assert.match(block, /^    if:\s*[^\n]*github\.event_name\s*==\s*['"]push['"][^\n]*$/m, `${workflow.path}#${name} doit vérifier push`)
      assert.match(block, /^    if:\s*[^\n]*github\.ref\s*==\s*['"]refs\/heads\/main['"][^\n]*$/m, `${workflow.path}#${name} doit vérifier main`)
    }
  }
})

test('dist est construit puis téléversé comme artefact GitHub Pages', () => {
  const workflows = deployments()
  assert.ok(workflows.length, 'un workflow de déploiement Pages doit exister')
  for (const workflow of workflows) {
    const jobs = jobsOf(workflow.content)
    const artifactJobs = [...jobs].filter(([, block]) => /actions\/upload-pages-artifact@/i.test(block))
    const artifactNames = new Set(artifactJobs.map(([name]) => name))
    assert.ok(artifactJobs.length, `${workflow.path} doit utiliser upload-pages-artifact`)
    for (const [name, block] of artifactJobs) {
      const install = block.search(/\bnpm\s+ci\b/)
      const build = block.search(/\bnpm\s+run\s+build\b/)
      const upload = block.search(/actions\/upload-pages-artifact@/i)
      assert.ok(install >= 0 && build > install && upload > build, `${workflow.path}#${name} doit faire npm ci, build, puis upload`)
      assert.match(block.slice(upload), /^\s+path:\s*['"]?\.?\/?dist\/?['"]?\s*$/m, `${workflow.path}#${name} doit publier dist`)
    }
    for (const [name, block] of jobs) {
      if (/actions\/deploy-pages@/i.test(block)) {
        assert.ok(reaches(jobs, name, artifactNames), `${workflow.path}#${name} doit attendre l'artefact Pages`)
      }
    }
  }
})

test('l’environnement github-pages expose outputs.page_url', () => {
  const workflows = deployments()
  assert.ok(workflows.length, 'un workflow de déploiement Pages doit exister')
  for (const workflow of workflows) {
    for (const [name, block] of jobsOf(workflow.content)) {
      if (!/actions\/deploy-pages@/i.test(block)) continue
      assert.match(block, /^      name:\s*github-pages\s*$/m, `${workflow.path}#${name} doit cibler github-pages`)
      const output = block.match(/^      url:\s*\$\{\{\s*steps\.([\w-]+)\.outputs\.page_url\s*\}\}\s*$/m)
      assert.ok(output, `${workflow.path}#${name} doit exposer page_url`)
      assert.match(block, new RegExp(`id:\\s*${output[1]}[\\s\\S]*?actions/deploy-pages@`), 'page_url doit venir du step deploy-pages')
    }
  }
})

test('lint, typecheck et build sont disponibles et documentés localement', () => {
  const packageJson = readPackageJson()
  const readme = readRequiredFile('README.md')
  for (const script of ['lint', 'typecheck', 'build']) {
    assert.equal(typeof packageJson.scripts?.[script], 'string', `package.json doit déclarer ${script}`)
    assert.match(readme, new RegExp(`npm\\s+run\\s+${script}\\b`, 'i'), `README.md doit documenter npm run ${script}`)
  }
})
