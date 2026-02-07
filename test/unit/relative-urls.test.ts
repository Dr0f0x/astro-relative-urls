import { describe, it, expect, vi, beforeEach } from 'vitest'
import { rewriteLinksAndAssets } from '../../src/relative-urls'
import type { AstroIntegrationLogger } from 'astro'
import type { FileSystemService } from '../../src/filesystem'
import { MockDirectory, MockFile, MockFileSystem } from './mocked-filesystem'
import {
  CombinedEditedHtml,
  CombinedHtml,
  mainJsContent,
  normalizeHtml,
} from '../fixtures/file-contents'
import { RelativeUrlConfiguration } from '../../src/configuration'

describe('rewriteLinksAndAssets', () => {
  let loggerMock: AstroIntegrationLogger
  let fsMock: FileSystemService
  const config: RelativeUrlConfiguration = {
    publicFolder: '../public',
    logAllChanges: true,
    pageLinkAttributesToChange: ['href', 'data-url'],
    assetAttributesToChange: ['src', 'data-src', 'href', 'data-url'],
  }

  beforeEach(() => {
    /*  creates a mocked filesystem with the following structure:
        public/
        ├─ img.jpg
        ├─ favicon.ico
        └─ favicon.svg
        dist/
        ├─ index.html
        ├─ img.jpg
        ├─ favicon.svg
        ├─ favicon.ico
        ├─ blog/
        │  └─ index.html
        ├─ about/
        │  └─ index.html
        └─ _astro/
            ├─ main.css
            ├─ main.js
            └─ logo.png
    */
    const root = new MockDirectory('')
    const dist = new MockDirectory('dist')
    root.setChild(dist)
    dist
      .setChild(new MockFile('index.html', CombinedHtml, dist))
      .setChild(new MockFile('img.jpg', '<binary>', dist))
      .setChild(
        new MockFile(
          'favicon.ico',
          '<?xml version="1.0" encoding="UTF-8"?>' +
            '<svg id="Ebene_1" data-name="Ebene 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26.69 21.3">',
          dist,
        ),
      )
      .setChild(new MockFile('favicon.ico', '<binary>'))
      .setChild(new MockDirectory('blog', dist, [new MockFile('index.html', CombinedHtml, null)]))
      .setChild(new MockDirectory('about', dist, [new MockFile('index.html', CombinedHtml, null)]))

    // _astro assets
    dist.setChild(
      new MockDirectory('_astro', dist, [
        new MockFile('main.css', 'body { background: red }', null),
        new MockFile('logo.png', '<binary>', null),
        new MockFile('main.js', mainJsContent, null),
      ]),
    )

    // public assets
    const publicDir = new MockDirectory('public')
    publicDir
      .setChild(new MockFile('img.jpg', '<binary>', publicDir))
      .setChild(
        new MockFile(
          'favicon.svg',
          '<?xml version="1.0" encoding="UTF-8"?>' +
            '<svg id="Ebene_1" data-name="Ebene 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26.69 21.3">',
          dist,
        ),
      )
      .setChild(new MockFile('favicon.ico', '<binary>'))
    root.setChild(publicDir)
    fsMock = new MockFileSystem(root)

    vi.restoreAllMocks()

    loggerMock = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    } as unknown as AstroIntegrationLogger
  })

  it('should run without throwing', async () => {
    const pages = [{ pathname: 'about' }]
    const assets = new Map<string, URL[]>()
    const dir = 'dist'

    await expect(
      rewriteLinksAndAssets(pages, dir as never, assets, loggerMock, fsMock, config),
    ).resolves.not.toThrow()
  })

  it('produces the expected outputs for all files', async () => {
    const pages = [{ pathname: 'about' }, { pathname: 'blog' }]
    const assets = new Map<string, URL[]>()
    const dir = 'dist'

    await expect(
      rewriteLinksAndAssets(pages, dir as never, assets, loggerMock, fsMock, config),
    ).resolves.not.toThrow()

    expect(normalizeHtml(fsMock.readFile('/dist/index.html'))).toEqual(
      normalizeHtml(CombinedEditedHtml('.', './about', './blog')),
    )
    expect(normalizeHtml(fsMock.readFile('/dist/blog/index.html'))).toEqual(
      normalizeHtml(CombinedEditedHtml('..', '../about', '.')),
    )
    expect(normalizeHtml(fsMock.readFile('/dist/about/index.html'))).toEqual(
      normalizeHtml(CombinedEditedHtml('..', '.', '../blog')),
    )
  })
})
