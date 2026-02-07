export interface RelativeUrlConfiguration {
  logAllChanges?: boolean
  publicFolder?: string
  pageLinkAttributesToChange?: string[]
  assetAttributesToChange?: string[]
}

export const DEFAULT_CONFIGURATION: Required<RelativeUrlConfiguration> = {
  logAllChanges: false,
  publicFolder: '../public',
  pageLinkAttributesToChange: ['href'],
  assetAttributesToChange: ['src', 'href'],
}
