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

/**
 * Each entry is tried independently. A success from any one endpoint is enough
 * for that batch. Bing Webmaster Tools verification is required before Bing
 * accepts IndexNow submissions; include it so that once verification is done it
 * starts working automatically without a code change.
 *
 * Override with a space-separated list in INDEXNOW_ENDPOINTS to test individual
 * endpoints (e.g. "https://yandex.com/indexnow").
 */
export const DEFAULT_ENDPOINTS = [
  'https://yandex.com/indexnow',
  'https://www.bing.com/indexnow',
]

export function resolveEndpoints() {
  const override = process.env.INDEXNOW_ENDPOINTS?.trim()
  if (override) return override.split(/\s+/).filter(Boolean)
  // INDEXNOW_ENDPOINT (singular) kept for backward compatibility: if set, use
  // only that endpoint.
  if (process.env.INDEXNOW_ENDPOINT?.trim()) return [process.env.INDEXNOW_ENDPOINT.trim()]
  return DEFAULT_ENDPOINTS
}

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

/**
 * Submit urlList to a single endpoint. Returns true on success (HTTP 200/202),
 * false on any failure so the caller can track partial success per batch.
 *
 * Exported for testing.
 */
export async function submitToEndpoint(endpoint, urlList, key, keyFile, fetchImpl = fetch) {
  let response
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: siteHost,
        key,
        keyLocation: `${siteOrigin}/${keyFile}`,
        urlList,
      }),
    })
  } catch (networkError) {
    console.warn(`[IndexNow] Network error reaching ${endpoint}:`, networkError instanceof Error ? networkError.message : networkError)
    return false
  }

  if (response.ok) {
    console.log(`[IndexNow] ${endpoint} accepted ${urlList.length} URL(s) (HTTP ${response.status}).`)
    return true
  }

  // Bing returns 403 UserForbiddedToAccessSite when the site has not yet been
  // verified in Bing Webmaster Tools. Log the details and continue so that
  // other endpoints (e.g. Yandex) can still succeed.
  const body = await response.text().catch(() => '')
  console.warn(`[IndexNow] ${endpoint} rejected with HTTP ${response.status}: ${body.slice(0, 400)}`)
  return false
}

/**
 * Submit one batch to all endpoints independently. Returns true if at least
 * one endpoint accepted the batch; false if every endpoint rejected it.
 *
 * Exported for testing.
 */
export async function submitBatch(urlList, key, keyFile, endpoints, fetchImpl = fetch) {
  const results = await Promise.all(
    endpoints.map((endpoint) => submitToEndpoint(endpoint, urlList, key, keyFile, fetchImpl)),
  )
  return results.some(Boolean)
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
  const endpoints = resolveEndpoints()

  console.log(`[IndexNow] Public SEO change detected in ${changedFiles.length} file(s); submitting ${urlsToSubmit.length} URL(s) to ${endpoints.length} endpoint(s).`)

  const failedBatches = []
  for (let index = 0; index < urlsToSubmit.length; index += 10_000) {
    const batch = urlsToSubmit.slice(index, index + 10_000)
    const batchSuccess = await submitBatch(batch, key, keyFile, endpoints)
    if (!batchSuccess) {
      failedBatches.push({ start: index, end: index + batch.length })
    }
  }

  if (failedBatches.length > 0) {
    throw new Error(
      `[IndexNow] ${failedBatches.length} batch(es) were rejected by all endpoints. ` +
      `Failed URL ranges: ${failedBatches.map((b) => `${b.start}–${b.end}`).join(', ')}. ` +
      'Check the warnings above for details.',
    )
  }

  console.log('[IndexNow] Submission complete: every batch was accepted by at least one endpoint.')
}

// Run only when this file is the entry point, not when imported by tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    // Individual endpoint warnings (e.g. Bing 403) are logged inside submitToEndpoint
    // and do not reach here. Only a batch that is rejected by ALL endpoints throws
    // and reaches this handler — that is a genuine indexing gap and must fail the build.
    console.error('[IndexNow] Submission failed; aborting the build.', error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
