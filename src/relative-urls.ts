import path from 'node:path'
import chalk from 'chalk'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import { FileSystemService, NodeFileSystem } from './filesystem-service'
import { UrlRewriter, UrlRewriterImpl, RewriteChange } from './url-rewriter'
import { getAllFiles } from './utils'
import { DEFAULT_CONFIGURATION, RelativeUrlConfiguration } from './configuration'
import { AstroIntegrationLogger } from 'astro'

export async function rewriteLinksAndAssets(
  pages: { pathname: string }[],
  dir: URL,
  assets: Map<string, URL[]>,
  logger: AstroIntegrationLogger,
  configuration: RelativeUrlConfiguration | null = null,
) {
  const config = {
    ...DEFAULT_CONFIGURATION,
    ...configuration,
  } satisfies Required<RelativeUrlConfiguration>

  const fs: FileSystemService = new NodeFileSystem()
  const urlRewriter: UrlRewriter = new UrlRewriterImpl(fs, logger, config)

  console.log(chalk.bgBlue.black(' running post-build link and asset rewrites '))
  const distDir = dir instanceof URL ? fileURLToPath(dir) : dir
  let totalDurationMs = 0

  // Collect valid routes (strip trailing slashes)
  const validRoutes = (pages || []).map((p) => p.pathname.replace(/\/$/, ''))

  const htmlFiles = getAllFiles(distDir, fs, undefined, ['.html'])

  const projectRoot = process.cwd() // your Astro project root
  const publicDir = path.join(projectRoot, 'public') // public folder
  const assetPaths = getAllFiles(publicDir, fs) // all files in public/

  for (let i = 0; i < htmlFiles.length; i++) {
    const fileRel = htmlFiles[i]
    const file = path.join(distDir, fileRel) // convert relative → absolute
    let html = fs.readFile(file, 'utf8')
    const changes: RewriteChange[] = []
    const fileDir = path.dirname(file)
    const startTime = performance.now()

    // Rewrite internal page links
    if (config.pageLinkAttributesToChange && config.pageLinkAttributesToChange.length > 0) {
      html = urlRewriter.rewritePageLinks(
        html,
        config.pageLinkAttributesToChange,
        validRoutes,
        fileDir,
        file,
        distDir,
        changes,
      )
    }
    // Rewrite public folder assets
    if (config.assetAttributesToChange && config.assetAttributesToChange.length > 0) {
      html = urlRewriter.rewritePublicAssets(
        html,
        config.assetAttributesToChange,
        assetPaths,
        file,
        fileDir,
        distDir,
        changes,
      )

      // Rewrite _astro processed assets
      html = urlRewriter.rewriteAstroAssets(
        html,
        config.assetAttributesToChange,
        file,
        fileDir,
        distDir,
        changes,
      )
    }

    // Inline all _astro scripts
    html = urlRewriter.inlineAstroScripts(html, fileDir, distDir, changes)

    const endTime = performance.now()
    const durationMs = Math.round(endTime - startTime)
    totalDurationMs += durationMs

    console.log(
      `${chalk.gray(new Date().toLocaleTimeString())}   ${chalk.cyan('▶')} ${chalk.white('/' + path.relative(distDir, file).replace('\\', '/'))}` +
        ` ${chalk.gray(`(+${durationMs}ms) (${i + 1}/${htmlFiles.length})`)}`,
    )

    if (changes.length) {
      fs.writeFile(file, html, 'utf8')
      if (config?.logAllChanges) {
        for (const c of changes) {
          console.log(`${chalk.gray(`    ${c.from} → ${c.to}`)}`)
        }
      }
    }
  }

  console.log(
    `${chalk.gray(new Date().toLocaleTimeString())} ${chalk.cyan(`✓ Completed in ${totalDurationMs}ms`)}\n`,
  )
}
