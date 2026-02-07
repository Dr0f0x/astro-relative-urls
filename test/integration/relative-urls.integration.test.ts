import path, { dirname } from 'node:path'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { rewriteLinksAndAssets } from '../../src/relative-urls'
import type { AstroIntegrationLogger } from 'astro'
import { NodeFileSystem, type FileSystemService } from '../../src/filesystem'
import { CombinedEditedHtml, normalizeHtml } from '../fixtures/file-contents'
import { RelativeUrlConfiguration } from '../../src/configuration'
import { FileCreator } from './file-creator'
import { fileURLToPath } from 'node:url'

describe('rewriteLinksAndAssets:Integration', () => {
  let logger: AstroIntegrationLogger

  const fs: FileSystemService = new NodeFileSystem()
  const __dirname = dirname(__filename)
  const files: FileCreator = new FileCreator(__dirname)
  const distDir: URL = new URL(`file://${path.join(__dirname, 'mocked-dist')}`)
  const config: RelativeUrlConfiguration = {
    logAllChanges: true,
    publicFolder: '../mocked-public',
    pageLinkAttributesToChange: ['href', 'data-url'],
    assetAttributesToChange: ['src', 'data-src', 'href', 'data-url'],
  }

  beforeEach(() => {
    files.create()
    vi.restoreAllMocks()

    logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    } as unknown as AstroIntegrationLogger
  })

  afterEach(() => {
    files.cleanup()
  })

  it('should run without throwing', async () => {
    const pages = [{ pathname: 'about' }]
    const assets = new Map<string, URL[]>()

    await expect(
      rewriteLinksAndAssets(pages, distDir, assets, logger, fs, config),
    ).resolves.not.toThrow()
  })

  it('produce the expected outputs for all files', async () => {
    const pages = [{ pathname: 'about' }, { pathname: 'blog' }]
    const assets = new Map<string, URL[]>()

    await expect(
      rewriteLinksAndAssets(pages, distDir, assets, logger, fs, config),
    ).resolves.not.toThrow()

    const distPath = distDir instanceof URL ? fileURLToPath(distDir) : distDir

    expect(normalizeHtml(fs.readFile(path.join(distPath, '/index.html')))).toEqual(
      normalizeHtml(CombinedEditedHtml('.', './about', './blog')),
    )
    expect(normalizeHtml(fs.readFile(path.join(distPath, '/blog/index.html')))).toEqual(
      normalizeHtml(CombinedEditedHtml('..', '../about', '.')),
    )
    expect(normalizeHtml(fs.readFile(path.join(distPath, '/about/index.html')))).toEqual(
      normalizeHtml(CombinedEditedHtml('..', '.', '../blog')),
    )
  })
})
