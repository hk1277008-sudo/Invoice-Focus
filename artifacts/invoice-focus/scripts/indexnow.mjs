import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const artifactDir = resolve(scriptDir, '..')
const repoRoot = execFileSync('git', ['-C', artifactDir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
const publicDir = resolve(artifactDir, 'public')
const sitemapPath = resolve(publicDir, 'sitemap.xml')
const siteHost = 'invoicefocus.com'
const siteOrigin = `https://${siteHost}`
const indexNowEndpoint = process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow'

const publicChangePrefixes = [
  'artifacts/invoice-focus/index.html',
  'artifacts/invoice-focus/public/robots.txt',
  'artifacts/invoice-focus/public/sitemap.xml',
  'artifacts/invoice-focus/src/App.tsx',
  'artifacts/invoice-focus/src/app/(marketing)/',
  'artifacts/invoice-focus/src/components/sections/',
  'artifacts/invoice-focus/src/components/seo/',
]

function isProductionVercelBuild() {
  return process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production'
}

function readSitemap(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1].trim())
    .filter((url) => {
      try {
        const parsed = new URL(url)
        return parsed.protocol === 'https:' && parsed.hostname === siteHost && parsed.username === '' && parsed.password === ''
      } catch {
        return false
      }
    })
}

function readCurrentSitemap() {
  return readSitemap(readFileSync(sitemapPath, 'utf8'))
}

function readPreviousSitemap(previousSha) {
  if (!previousSha) return []

  try {
    const xml = execFileSync(
      'git',
      ['-C', repoRoot, 'show', `${previousSha}:artifacts/invoice-focus/public/sitemap.xml`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    )
    return readSitemap(xml)
  } catch {
    return []
  }
}

function changedPublicFiles(previousSha, currentSha) {
  if (!previousSha) return ['initial production deployment']

  try {
    const output = execFileSync(
      'git',
      ['-C', repoRoot, 'diff', '--name-only', previousSha, currentSha, '--'],
      { encoding: 'utf8' },
    )
    return output
      .split('\n')
      .map((path) => path.trim())
      .filter((path) => path && publicChangePrefixes.some((prefix) => path === prefix || path.startsWith(prefix)))
  } catch (error) {
    console.warn('[IndexNow] Could not inspect the Git diff; skipping submission.', error instanceof Error ? error.message : error)
    return []
  }
}

function findKeyFile() {
  const keyFiles = readdirSync(publicDir)
    .filter((name) => /^[A-Za-z0-9-]{8,128}\.txt$/.test(name))
    .filter((name) => readFileSync(resolve(publicDir, name), 'utf8').trim() === name.slice(0, -4))

  if (keyFiles.length !== 1) {
    throw new Error(`[IndexNow] Expected exactly one root key file, found ${keyFiles.length}.`)
  }

  return keyFiles[0]
}

function readIndexNowKey(keyFile) {
  const fileKey = readFileSync(resolve(publicDir, keyFile), 'utf8').trim()
  const configuredKey = process.env.INDEXNOW_KEY?.trim()
  const key = configuredKey || fileKey

  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    throw new Error('[IndexNow] Key must be 8–128 letters, numbers, or dashes.')
  }
  if (fileKey !== key) {
    throw new Error('[IndexNow] INDEXNOW_KEY does not match the public verification file.')
  }

  return key
}

async function submit(urlList, key, keyFile) {
  const response = await fetch(indexNowEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: siteHost,
      key,
      keyLocation: `${siteOrigin}/${keyFile}`,
      urlList,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`[IndexNow] Submission failed with HTTP ${response.status}: ${body.slice(0, 500)}`)
  }

  console.log(`[IndexNow] Submitted ${urlList.length} public URL(s); endpoint returned HTTP ${response.status}.`)
}

async function main() {
  if (!isProductionVercelBuild()) {
    console.log('[IndexNow] Skipped: notifications run only on production Vercel builds.')
    return
  }

  const currentSha = process.env.VERCEL_GIT_COMMIT_SHA || execFileSync('git', ['-C', repoRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  const previousSha = process.env.VERCEL_GIT_PREVIOUS_SHA?.trim()
  const changedFiles = changedPublicFiles(previousSha, currentSha)

  if (changedFiles.length === 0) {
    console.log('[IndexNow] Skipped: no public SEO files changed.')
    return
  }

  const currentUrls = readCurrentSitemap()
  const previousUrls = readPreviousSitemap(previousSha)
  const urlsToSubmit = [...new Set([...currentUrls, ...previousUrls])]

  if (urlsToSubmit.length === 0) {
    console.log('[IndexNow] Skipped: sitemap contains no eligible public URLs.')
    return
  }

  const keyFile = findKeyFile()
  const key = readIndexNowKey(keyFile)
  console.log(`[IndexNow] Public SEO change detected in ${changedFiles.length} file(s); submitting current and removed sitemap URLs.`)

  for (let index = 0; index < urlsToSubmit.length; index += 10_000) {
    await submit(urlsToSubmit.slice(index, index + 10_000), key, keyFile)
  }
}

main().catch((error) => {
  console.error('[IndexNow] Notification failed; continuing the production build.', error)
})