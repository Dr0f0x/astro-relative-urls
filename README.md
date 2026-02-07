# astro-relative-urls

This **Astro integration** transforms resource and page URLs from absolute to
relative, making it so you can view the built website by simply opening its
`index.html` in your browser.

> ⚠️ **Disclaimer:** This integration currently does **not support Astro
> Islands**. Components rendered as islands will not have their URLs or scripts
> transformed correctly.

- **[Why](#why)**
- **[How it works](#how-it-works)**
- **[Installation](#installation)**
- **[Usage](#usage)**
- **[Configuration](#configuration)**

## Why?

The whole motivation behind this was that i had to share the built website with
people that have nothing to do with Programming. And when i say nothing here i
mean nothing: No node environment, no docker and not even VS Code with the
live-server extension.

### How it works

Most Operating Systems simply open html files in your browser and for single
file sharing thats fine, but as soon as you starts using links or URLs it gets a
bit difficult. The reason here being that astro assumes all your URLs to be
absolute Paths from the `dist`-Folder (e.g. the link `/subpage` means the file
`dist/subpage/.index.html`).

That is usually no Problem, as long as the `dist`-folder is used as the actual
root of an http-Server of some sorts, but simply opening the html-file in a
Browser uses the actual Filepaths on your Disk. When you then try to access URLs
like `/subpage` they will lead to the root of your partition instead of where
the file you referred to actually is.

This integration fixes this by transforming all URLs to relative Paths that
always point to the correct resource. For script tags however it gets a bit more
difficult as most browser will still report a CORS Error and refuse to load the
file. The solution to this is to simply inline every loaded source file, which
this plugin also does. This will of course increase bundle size by quite a bit
but this Integration shouldnt be used for production builds anyways, it is only
intended as means for easy sharing of your website.

### Installation

#### Automatic installation

Run the following command to install and set it up for you automatically

```sh
astro add astro-relative-urls # Follow the instructions
```

#### Manual installation

The `astro add` command-line tool automates the installation for you. Run one of
the following commands in a new terminal window. (If you aren't sure which
package manager you're using, run the first command.) Then, follow the prompts,
and type "y" in the terminal (meaning "yes") for each one.

```sh
# Using NPM
npx astro add -D astro-relative-urls
# Using Yarn
yarn astro add -D astro-relative-urls
# Using PNPM
pnpx astro add -D astro-relative-urls
```

**`astro.config.mjs`**

```js
import relativeUrls from 'astro-relative-urls'

export default {
  // ...
  integrations: [relativeUrls()],
}
```

Then, restart the dev server.

## Usage

This integration will run after the build process finishes, using
`astro:build:done` hook. It will iterate over all files in the build-Directory
and apply the needed changes, displaying an overview in the process.

![Astro Relative URLs Logse](./docs/build-logs.png)

## Configuration

```typescript
interface RelativeUrlConfiguration {
  /* log every change instead of only the overview, default=false */
  logAllChanges?: boolean

  /* relative Path to the public Folder from the dist folder, default=..dist */
  publicFolder?: string

  /* html attributes that are searched for PageUrls to change, default=["href"] */
  pageLinkAttributesToChange?: string[]

  /* html attributes that are searched for AssetUrls (either to Assets in the */
  /* public or _astro Folder) to change, default=["href", "src"] */
  assetAttributesToChange?: string[]
}
```

**Example: Search the extra attribute `data-url` for PageUrls to change**

```typescript
import relativeUrls from 'astro-relative-urls'

export default defineConfig({
  integrations: [
    relativeUrls({ pageLinkAttributesToChange: ['href', 'data-url'] }),
  ],
})
```
