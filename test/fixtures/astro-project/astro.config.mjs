// @ts-check
import { defineConfig } from 'astro/config';
import relativeUrls from 'astro-relative-urls';

// https://astro.build/config
export default defineConfig({
  integrations: [relativeUrls({ logAllChanges: false , pageLinkAttributesToChange: ["href", "data-url"]})],
});
