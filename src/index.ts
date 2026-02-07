import { rewriteLinksAndAssets } from './relative-urls'
import { RelativeUrlConfiguration, DEFAULT_CONFIGURATION } from './configuration'
import { AstroIntegrationLogger } from 'astro'
import { NodeFileSystem } from './filesystem'
export type { RelativeUrlConfiguration } from './configuration'

export default function relativeUrls(
  configuration: RelativeUrlConfiguration = DEFAULT_CONFIGURATION,
) {
  return {
    name: 'rewrite-links-and-assets',
    hooks: {
      'astro:build:done': async ({
        pages,
        dir,
        assets,
        logger,
      }: {
        pages: { pathname: string }[]
        dir: URL
        assets: Map<string, URL[]>
        logger: AstroIntegrationLogger
      }) => {
        await rewriteLinksAndAssets(pages, dir, assets, logger, new NodeFileSystem(), configuration)
      },
    },
  }
}
