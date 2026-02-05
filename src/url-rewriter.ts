import path from 'node:path'
import { FileSystemService } from './filesystem-service'
import { RelativeUrlConfiguration } from './configuration'
import { AstroIntegrationLogger } from 'astro'
import { getAllFiles } from './utils'

export enum RewriteChangeType {
  Rewrite = 'rewrite',
  Inline = 'inline',
}

export interface RewriteChange {
  type: RewriteChangeType
  file: string // relative path of the HTML file where the change occurred
  from: string // original URL in the HTML
  to: string // new URL after rewrite
}

export interface UrlRewriter {
  /**
   * Rewrites all links or dataset attributes in an HTML string.
   * @param {string} html - the HTML content
   * @param {string[]} attributes - attributes to rewrite (e.g., "href" or "data-url")
   * @param {string[]} validRoutes - list of valid routes (without leading slash)
   * @param {string} fileDir - directory of current HTML file
   * @param {string} file - the current HTML file
   * @param {string} distDir - dist folder
   * @param {RewriteChange[]} changes - array to log changes
   * @return {string} - rewritten HTML content
   */
  rewritePageLinks(
    html: string,
    attributes: string[],
    validRoutes: string[],
    fileDir: string,
    file: string,
    distDir: string,
    changes: RewriteChange[],
  ): string

  /**
   * Rewrites references to files in Astro's public folder
   * to relative paths in the dist folder.
   *
   * @param {string} html - HTML content
   * @param {string[]} attributes - attributes to rewrite (e.g., "src")
   * @param {string[]} assetPaths - list of public folder paths to rewrite (e.g., ["favicon.svg","css/style.css"])
   * @param {string} file - current HTML file path
   * @param {string} fileDir - directory of current HTML file
   * @param {string} distDir - path to dist folder
   * @param {RewriteChange[]} changes - array to log changes
   * @return {string} - rewritten HTML content
   */
  rewritePublicAssets(
    html: string,
    attributes: string[],
    assetPaths: string[],
    file: string,
    fileDir: string,
    distDir: string,
    changes: RewriteChange[],
  ): string

  /**
   * Rewrites references to assets in the Astro build folder (_astro)
   * to relative paths in the HTML files.
   *
   * @param {string} html - the HTML content
   * @param {string[]} attributes - attributes to rewrite (e.g., "src")
   * @param {string} file - full path of the current HTML file
   * @param {string} fileDir - folder of the current HTML file
   * @param {string} distDir - the dist folder
   * @param {RewriteChange[]} changes - array to log changes
   * @return {string} - rewritten HTML content
   */
  rewriteAstroAssets(
    html: string,
    attributes: string[],
    file: string,
    fileDir: string,
    distDir: string,
    changes: RewriteChange[],
  ): string

  /**
   * Inlines all <script type="module" src="..."> scripts in HTML.
   * Only works for scripts pointing to _astro folder (relative path).
   *
   * @param {string} html - HTML content
   * @param {string} fileDir - folder of the current HTML file
   * @param {string} distDir - the dist folder
   * @param {RewriteChange[]} changes - array to log changes
   * @return {string} - HTML content with inlined scripts
   */
  inlineAstroScripts(
    html: string,
    fileDir: string,
    distDir: string,
    changes: RewriteChange[],
  ): string
}

export class UrlRewriterImpl implements UrlRewriter {
  constructor(
    private FileSystemService: FileSystemService,
    private Logger: AstroIntegrationLogger,
    private Configuration: RelativeUrlConfiguration | null = null,
  ) {}

  public rewritePageLinks(
    html: string,
    attributes: string[],
    validRoutes: string[],
    fileDir: string,
    file: string,
    distDir: string,
    changes: RewriteChange[],
  ) {
    // Rewrite normal links: /something
    const regex = new RegExp(`(${attributes.join('|')})="(\/[^"#]+)"`, 'g')
    html = html.replace(regex, (match, attr, hrefPath) => {
      const cleanHref = hrefPath.replace(/^\/|\/$/g, '')

      if (validRoutes.includes(cleanHref)) {
        const target = path.join(distDir, cleanHref, 'index.html')
        let relativeHref = path.relative(fileDir, target)
        relativeHref = relativeHref.split(path.sep).join('/')
        if (!relativeHref.startsWith('.')) relativeHref = './' + relativeHref

        changes.push({
          type: RewriteChangeType.Rewrite,
          file: path.relative(distDir, file),
          from: hrefPath,
          to: relativeHref,
        })

        return `${attr}="${relativeHref}"`
      }
      return match
    })

    // Rewrite root "/"
    const rootRegex = new RegExp(`(${attributes.join('|')})="/"`, 'g')
    html = html.replace(rootRegex, (match, attr) => {
      const target = path.join(distDir, 'index.html')
      let relativeHref = path.relative(fileDir, target)
      relativeHref = relativeHref.split(path.sep).join('/')
      if (!relativeHref.startsWith('.')) relativeHref = './' + relativeHref

      changes.push({
        type: RewriteChangeType.Rewrite,
        file: path.relative(distDir, file),
        from: '/',
        to: relativeHref,
      })

      return `${attr}="${relativeHref}"`
    })

    return html
  }

  public rewritePublicAssets(
    html: string,
    attributes: string[],
    assetPaths: string[],
    file: string,
    fileDir: string,
    distDir: string,
    changes: RewriteChange[],
  ) {
    // Build "(href|src|data-src|poster)" etc.
    const attrGroup = attributes.join('|')

    for (const asset of assetPaths) {
      // Match src="..." or href="..." attributes pointing to this asset
      const regex = new RegExp(`(${attrGroup})="/${asset}"`, 'g')

      html = html.replace(regex, (match, attr) => {
        const target = path.join(distDir, asset) // dist path of the asset
        let relativePath = path.relative(fileDir, target)
        relativePath = relativePath.split(path.sep).join('/') // normalize for browser

        if (!relativePath.startsWith('.')) relativePath = './' + relativePath

        changes.push({
          type: RewriteChangeType.Rewrite,
          file: path.relative(distDir, file),
          from: `/${asset}`,
          to: relativePath,
        })

        return `${attr}="${relativePath}"`
      })
    }

    return html
  }

  public rewriteAstroAssets(
    html: string,
    attributes: string[],
    file: string,
    fileDir: string,
    distDir: string,
    changes: RewriteChange[],
  ) {
    // Detect the _astro folder dynamically
    const astroDir = this.FileSystemService.readDir(distDir)
      .map((f) => path.join(distDir, f))
      .find(
        (f) =>
          this.FileSystemService.stat(f).isDirectory() && path.basename(f).startsWith('_astro'),
      )

    if (!astroDir) {
      // nothing to do if _astro folder doesn't exist
      return html
    }

    const astroFiles = getAllFiles(astroDir, this.FileSystemService) // use getAllFiles helper, returns file names

    for (const astroFile of astroFiles) {
      // Get the relative path inside _astro for the src/href in HTML
      const assetRel = `${path.basename(astroDir)}/${astroFile}`

      // Match src or href pointing to this asset
      const regex = new RegExp(`(${attributes.join('|')})="/${assetRel}"`, 'g')
      html = html.replace(regex, (match, attr) => {
        const absPath = path.join(astroDir, astroFile) // absolute path to the asset
        let relativePath = path.relative(fileDir, absPath).split(path.sep).join('/')
        if (!relativePath.startsWith('.')) relativePath = './' + relativePath

        changes.push({
          type: RewriteChangeType.Rewrite,
          file: path.relative(distDir, file),
          from: `/${assetRel}`,
          to: relativePath,
        })

        return `${attr}="${relativePath}"`
      })
    }

    return html
  }

  public inlineAstroScripts(
    html: string,
    fileDir: string,
    distDir: string,
    changes: RewriteChange[],
  ) {
    // Match all <script type="module" src="..."></script>
    return html.replace(/<script\s+type="module"\s+src="([^"]+)"><\/script>/g, (match, srcPath) => {
      // Only inline scripts from _astro folder
      if (!srcPath.includes('/_astro/')) return match

      // Compute absolute path to the JS file
      let absPath
      if (srcPath.startsWith('/')) {
        absPath = path.join(distDir, srcPath.slice(1)) // remove leading /
      } else {
        absPath = path.resolve(fileDir, srcPath)
      }

      if (!this.FileSystemService.exists(absPath)) {
        this.Logger.warn(`[inlineAstroScripts] File not found: ${absPath}`)
        return match
      }

      // Read file contents
      const jsContent = this.FileSystemService.readFile(absPath, 'utf8')

      changes.push({
        type: RewriteChangeType.Inline,
        file: path.relative(distDir, path.join(fileDir, srcPath)),
        from: srcPath,
        to: 'inlined',
      })

      // Return <script> with inlined JS
      return `<script type="module">\n${jsContent}\n</script>`
    })
  }
}
