export interface RelativeUrlConfiguration {
  /**
   * Log every change instead of only the overview.
   * Default: false
   */
  logAllChanges?: boolean

  /**
   * Relative path to the public folder from the dist folder.
   * Default: "../public"
   */
  publicFolder?: string

  /**
   * HTML attributes that are searched for page URLs to change.
   * Default: ["href"]
   */
  pageLinkAttributesToChange?: string[]

  /**
   * HTML attributes that are searched for asset URLs (either in public or _astro folder).
   * Default: ["href", "src"]
   */
  assetAttributesToChange?: string[]
}

export const DEFAULT_CONFIGURATION: Required<RelativeUrlConfiguration> = {
  logAllChanges: false,
  publicFolder: '../public',
  pageLinkAttributesToChange: ['href'],
  assetAttributesToChange: ['src', 'href'],
}
