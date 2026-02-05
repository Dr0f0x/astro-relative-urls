export interface RelativeUrlConfiguration {
  logAllChanges?: boolean
  pageLinkAttributesToChange?: string[]
  assetAttributesToChange?: string[]
}

export const DEFAULT_CONFIGURATION: Required<RelativeUrlConfiguration> = {
  logAllChanges: false,
  pageLinkAttributesToChange: ['href'],
  assetAttributesToChange: ['src', 'href'],
}
