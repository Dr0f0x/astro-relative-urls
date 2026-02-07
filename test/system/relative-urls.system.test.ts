import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AstroRunner } from './astro-runner'
import path from 'node:path'
import { Dirent, existsSync, readdirSync, readFileSync } from 'node:fs'

/**
 * Normalize Astro-generated dynamic IDs, class names, and asset hashes
 */
function normalizeHtmlContent(content: string): string {
  let normalized = content

  // Remove IDs like id="astro-abc123"
  normalized = normalized.replace(/\bid="astro-[a-z0-9]{6,}"\b/g, '')
  normalized = normalized.replace(/\bdata-(astro-cid|image-component)="[^"]*"/g, '')
  normalized = normalized.replace(/\s+/g, ' ')

  // Remove class names starting with astro- (in class attributes)
  normalized = normalized.replace(/\bclass="([^"]*)"/g, (_match: string, classes: string) => {
    const cleaned = classes
      .split(/\s+/)
      .filter((c) => !/^astro-/.test(c))
      .join(' ')
    return cleaned ? `class="${cleaned}"` : ''
  })

  // Normalize asset references in <script src=""> and <link href="">
  normalized = normalized.replace(
    /\b(src|href)="([^"]+)\.[a-z0-9]{6,}\.(js|css)"/g,
    (_match: string, attr: string, name: string, ext: string) => {
      return `${attr}="${name}.${ext}"`
    },
  )

  return normalized
}

/**
 * Recursively find all files ending with a specific extension
 */
function findFiles(dir: string, ext: string): string[] {
  let results: string[] = []
  const entries: Dirent[] = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath: string = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results = results.concat(findFiles(fullPath, ext))
    } else if (entry.isFile() && fullPath.endsWith(ext)) {
      results.push(fullPath)
    }
  }

  return results
}

describe('rewriteLinksAndAssets:System', () => {
  const astroRunner = new AstroRunner()

  beforeEach(async () => {
    await astroRunner.setup()
  }, 1000000)

  afterEach(async () => {
    await astroRunner.cleanup()
  })

  it('should correctly transform html files created by astro', async () => {
    let buildError: Error | null = null
    try {
      await astroRunner.runInAstro('npm', ['run', 'build'], {
        onStdout: (data) => console.log('[build stdout]', data),
        onStderr: (data) => console.error('[build stderr]', data),
      })
    } catch (err) {
      buildError = err as Error
    }
    expect(buildError).toBeNull()
    expect.setState({ expand: true })

    const generatedDir = path.join('test', 'system', 'astro-integration', 'dist')
    const referenceDir = path.join('test', 'fixtures', 'astro-project', 'expected_dist')

    const genFiles = findFiles(generatedDir, '.html')
    const refFiles = findFiles(referenceDir, '.html')

    expect(genFiles.length).toEqual(refFiles.length)

    for (const genFile of genFiles) {
      const relativePath = path.relative(generatedDir, genFile)
      const refFile = path.join(referenceDir, relativePath)

      expect(existsSync(refFile)).toBe(true)

      const genContent = normalizeHtmlContent(readFileSync(genFile, 'utf-8'))
      const refContent = normalizeHtmlContent(readFileSync(refFile, 'utf-8'))

      // Split into lines for better diff output
      const genLines = genContent.split(/\r?\n/)
      const refLines = refContent.split(/\r?\n/)

      expect(genLines).toEqual(refLines)
    }
  })
})
