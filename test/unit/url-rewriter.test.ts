import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UrlRewriterImpl, RewriteChangeType, RewriteChange } from '../../src/url-rewriter'
import type { FileSystemService } from '../../src/filesystem'
import type { AstroIntegrationLogger } from 'astro'
import { MockDirectory, MockFile, MockFileSystem } from './mocked-filesystem'
import {
  AstroAssetHtml,
  InlineScriptHtml,
  mainJsContent,
  PageLinkHtml,
  PublicAssetHtml,
} from '../file-contents'

describe('UrlRewriterImpl', () => {
  let fsMock: FileSystemService
  let loggerMock: AstroIntegrationLogger
  let urlRewriter: UrlRewriterImpl

  beforeEach(() => {
    /* creates a mocked filesystem with the following structure:
        dist/
        ├─ index.html
        ├─ img.jpg
        ├─ stuff.js
        ├─ favicon.svg
        ├─ blog/
        │  └─ index.html
        ├─ about/
        │  └─ index.html
        └─ _astro/
            ├─ main.css
            ├─ main.js
            ├─ logo.png
            └─ hero.jpg
        */
    const root = new MockDirectory('')
    const dist = new MockDirectory('dist')
    root.setChild(dist)
    dist
      .setChild(new MockFile('index.html', '<a href="/blog">Blog</a>', dist))
      .setChild(new MockFile('img.jpg', '<binary>', dist))
      .setChild(new MockFile('stuff.js', 'console.log(stuff)', dist))
      .setChild(
        new MockFile(
          'favicon.ico',
          '<?xml version="1.0" encoding="UTF-8"?>' +
            '<svg id="Ebene_1" data-name="Ebene 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26.69 21.3">',
          dist,
        ),
      )
      .setChild(
        new MockDirectory('blog', dist, [new MockFile('index.html', '<a href="/">Home</a>', null)]),
      )
      .setChild(
        new MockDirectory('about', dist, [
          new MockFile('index.html', '<a href="/">Home</a>', null),
        ]),
      )

    // _astro assets
    dist.setChild(
      new MockDirectory('_astro', dist, [
        new MockFile('main.css', 'body { background: red }', null),
        new MockFile('logo.png', '<binary>', null),
        new MockFile('hero.jpg', '<binary>', null),
        new MockFile('main.js', mainJsContent, null),
      ]),
    )
    fsMock = new MockFileSystem(root)

    vi.restoreAllMocks()

    loggerMock = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    } as unknown as AstroIntegrationLogger

    urlRewriter = new UrlRewriterImpl(fsMock, loggerMock, null)
  })

  it('rewritePageLinks rewrites internal links', () => {
    const html = PageLinkHtml
    const changes: RewriteChange[] = []

    const rewritten = urlRewriter.rewritePageLinks(
      html,
      ['href'],
      ['about', 'blog'],
      '/dist/',
      '/dist/index.html',
      '/dist',
      changes,
    )

    expect(rewritten).toContain('<a href="./index.html">Home</a>')
    expect(rewritten).toContain('<a href="./about/index.html">About</a>')
    expect(changes[0].type).toBe(RewriteChangeType.Rewrite)
  })

  it('rewritePageLinks uses correct relative Paths', () => {
    const html = PageLinkHtml
    const changes: RewriteChange[] = []

    const rewritten = urlRewriter.rewritePageLinks(
      html,
      ['href'],
      ['about', 'blog'],
      '/dist/blog',
      '/dist/blog/index.html',
      '/dist',
      changes,
    )

    expect(rewritten).toContain('<a href="../index.html">Home</a>')
    expect(rewritten).toContain('<a href="../about/index.html">About</a>')
    expect(changes[0].type).toBe(RewriteChangeType.Rewrite)
  })

  it('rewritePageLinks targets specified custom attributes', () => {
    const html = PageLinkHtml
    const changes: RewriteChange[] = []

    const rewritten = urlRewriter.rewritePageLinks(
      html,
      ['href', 'data-url'],
      ['about', 'blog'],
      '/dist',
      '/dist/index.html',
      '/dist',
      changes,
    )

    expect(rewritten).toContain('<h6 data-url="./index.html">This is a test page.</h6>')
    expect(rewritten).toContain('<p data-url="./blog/index.html">')
    expect(changes[0].type).toBe(RewriteChangeType.Rewrite)
  })

  it('rewritePageLinks ignores unknown target routes', () => {
    const html = PageLinkHtml
    const changes: RewriteChange[] = []

    const rewritten = urlRewriter.rewritePageLinks(
      html,
      ['href'],
      ['blog'],
      '/dist/pages',
      '/dist/pages/index.html',
      '/dist',
      changes,
    )

    expect(rewritten).toContain('<a href="/unknown">About</a>')
    expect(rewritten).toContain('<a href="/about">About</a>')
    expect(changes[0].type).toBe(RewriteChangeType.Rewrite)
  })

  it('rewritePublicAssets rewrites asset URls', () => {
    const html = PublicAssetHtml
    const changes: RewriteChange[] = []

    const rewritten = urlRewriter.rewritePublicAssets(
      html,
      ['src', 'href'],
      ['favicon.svg', 'img.jpg'],
      '/dist/index.html',
      '/dist',
      '/dist',
      changes,
    )

    expect(rewritten).toContain('<link rel="icon" type="image/svg+xml" href="./favicon.svg" />')
    expect(rewritten).toContain('<img src="./img.jpg" alt="Test image" />')
    expect(changes[0].type).toBe(RewriteChangeType.Rewrite)
  })

  it('rewritePublicAssets uses correct relative Paths', () => {
    const html = PublicAssetHtml
    const changes: RewriteChange[] = []

    const rewritten = urlRewriter.rewritePublicAssets(
      html,
      ['src', 'href'],
      ['favicon.svg', 'img.jpg'],
      '/dist/blog/index.html',
      '/dist/blog',
      '/dist',
      changes,
    )

    expect(rewritten).toContain('<link rel="icon" type="image/svg+xml" href="../favicon.svg" />')
    expect(rewritten).toContain('<img src="../img.jpg" alt="Test image" />')
    expect(changes[0].type).toBe(RewriteChangeType.Rewrite)
  })

  it('rewritePublicAssets targets specified custom attributes', () => {
    const html = PublicAssetHtml
    const changes: RewriteChange[] = []

    const rewritten = urlRewriter.rewritePublicAssets(
      html,
      ['src', 'data-url', 'href'],
      ['favicon.svg', 'img.jpg'],
      '/dist/index.html',
      '/dist',
      '/dist',
      changes,
    )

    expect(rewritten).toContain('<p data-src="./img.jpg">Lorem ipsum dolor sit amet.</p>')
    expect(changes[0].type).toBe(RewriteChangeType.Rewrite)
  })

  it('rewritePublicAssets ignores not existing assets', () => {
    const html = PublicAssetHtml
    const changes: RewriteChange[] = []

    const rewritten = urlRewriter.rewritePublicAssets(
      html,
      ['src', 'href'],
      ['favicon.svg'],
      '/dist/index.html',
      '/dist',
      '/dist',
      changes,
    )

    expect(rewritten).toContain('<img src="/unknown.jpg" alt="Test image" />')
    expect(rewritten).toContain('<img src="/img.jpg" alt="Test image" />')
    expect(changes[0].type).toBe(RewriteChangeType.Rewrite)
  })

  it('rewriteAstroAssets rewrites asset URls', () => {
    const html = AstroAssetHtml
    const changes: RewriteChange[] = []

    const rewritten = urlRewriter.rewriteAstroAssets(
      html,
      ['src', 'href'],
      '/dist/index.html',
      '/dist',
      '/dist',
      changes,
    )

    expect(rewritten).toContain('<link href="./_astro/main.css" rel="stylesheet" />')
    expect(rewritten).toContain('<img src="./_astro/logo.png" alt="Logo" />')
    expect(rewritten).toContain('<script src="./_astro/main.js"></script>')
    expect(changes[0].type).toBe(RewriteChangeType.Rewrite)
  })

  it('rewriteAstroAssets uses correct relative Paths', () => {
    const html = AstroAssetHtml
    const changes: RewriteChange[] = []

    const rewritten = urlRewriter.rewriteAstroAssets(
      html,
      ['src', 'href'],
      '/dist/about/index.html',
      '/dist/about',
      '/dist',
      changes,
    )

    expect(rewritten).toContain('<link href="../_astro/main.css" rel="stylesheet" />')
    expect(rewritten).toContain('<img src="../_astro/logo.png" alt="Logo" />')
    expect(rewritten).toContain('<script src="../_astro/main.js"></script>')
    expect(changes[0].type).toBe(RewriteChangeType.Rewrite)
  })

  it('rewriteAstroAssets targets specified custom attributes', () => {
    const html = AstroAssetHtml
    const changes: RewriteChange[] = []

    const rewritten = urlRewriter.rewriteAstroAssets(
      html,
      ['src', 'data-url', 'href'],
      '/dist/index.html',
      '/dist',
      '/dist',
      changes,
    )

    expect(rewritten).toContain('<p data-url="./_astro/main.css">')
    expect(changes[0].type).toBe(RewriteChangeType.Rewrite)
  })

  it('rewriteAstroAssets ignores not existing assets', () => {
    const html = AstroAssetHtml
    const changes: RewriteChange[] = []
    const modifiedFileSystem = new MockFileSystem(fsMock)
    modifiedFileSystem.deleteFile('/dist/_astro/main.css')
    modifiedFileSystem.deleteFile('/dist/_astro/logo.png')
    const modifiedUrlRewriter = new UrlRewriterImpl(modifiedFileSystem, loggerMock, null)

    const rewritten = modifiedUrlRewriter.rewriteAstroAssets(
      html,
      ['src', 'data-url', 'href'],
      '/dist/index.html',
      '/dist',
      '/dist',
      changes,
    )

    expect(rewritten).toContain('<link href="/_astro/main.css" rel="stylesheet" />')
    expect(rewritten).toContain('<img src="/_astro/logo.png" alt="Logo" />')
    expect(changes[0].type).toBe(RewriteChangeType.Rewrite)
  })

  it('inlineAstroScripts inlines scripts', () => {
    const html = InlineScriptHtml
    const changes: RewriteChange[] = []

    const rewritten = urlRewriter.inlineAstroScripts(html, '/dist', '/dist', changes)

    expect(rewritten).toContain('<script type="module">')
    expect(rewritten).toContain(`${mainJsContent}`)
    expect(changes[0].type).toBe(RewriteChangeType.Inline)
  })

  it('inlineAstroScripts inlines scripts with relative Paths', () => {
    const html = InlineScriptHtml
    const changes: RewriteChange[] = []

    const rewritten = urlRewriter.inlineAstroScripts(html, '/dist/blog', '/dist', changes)

    expect(rewritten).toContain('<script type="module">')
    expect(rewritten).toContain(`${mainJsContent}`)
    expect(changes[0].type).toBe(RewriteChangeType.Inline)
  })

  it('inlineAstroScripts only targets scripts with type=module', () => {
    const html = InlineScriptHtml

    const changes: RewriteChange[] = []
    const rewritten = urlRewriter.inlineAstroScripts(html, '/dist', '/dist', changes)

    expect(rewritten).toContain(`<script src="/_astro/main.js"></script>`)
    expect(changes[0].type).toBe(RewriteChangeType.Inline)
  })

  it('inlineAstroScripts ignores nonexisting script', () => {
    const html = '<script type="module" src="/_astro/main.js"></script>'
    const modifiedFileSystem = new MockFileSystem(fsMock)
    modifiedFileSystem.deleteFile('/dist/_astro/main.js')
    const modifiedUrlRewriter = new UrlRewriterImpl(modifiedFileSystem, loggerMock, null)

    const changes: RewriteChange[] = []
    const rewritten = modifiedUrlRewriter.inlineAstroScripts(html, '/dist', '/dist', changes)

    expect(rewritten).toContain(`<script type="module" src="/_astro/main.js"></script>`)
  })
})
