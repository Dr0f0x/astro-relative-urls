export const html = (strings: TemplateStringsArray, ...values: unknown[]) =>
  strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '').trim()

export const PageLinkHtml = html`<a href="/">Home</a>
  <div>
    <h1>Test</h1>
    <h6 data-url="/">This is a test page.</h6>
    <a href="/unknown">About</a>
    <p data-url="/blog">
      Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nihil laboriosam natus doloribus,
      quod cum nobis harum beatae quidem, repudiandae autem perspiciatis facilis, ducimus
      perferendis. Doloremque unde ducimus rerum mollitia?
    </p>
    <a href="/about">About</a>
  </div>`

export function EditedPageLinkHtml(
  relativePathToDist: string,
  relativePathToBlog: string,
  relativePathToAbout: string,
): string {
  return html`
    <a href="${relativePathToDist}/index.html">Home</a>
    <div>
      <h1>Test</h1>
      <h6 data-url="${relativePathToDist}/index.html">This is a test page.</h6>
      <a href="/unknown">About</a>
      <p data-url="${relativePathToBlog}/index.html">
        Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nihil laboriosam natus doloribus,
        quod cum nobis harum beatae quidem, repudiandae autem perspiciatis facilis, ducimus
        perferendis. Doloremque unde ducimus rerum mollitia?
      </p>
      <a href="${relativePathToAbout}/index.html">About</a>
    </div>
  `
}

export const PublicAssetHtml = html`<html lang="de">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" href="/favicon.ico" />
    <title>{pageTitle}</title>
    <style lang="scss">
      @use './PageLayout.scss';
    </style>
  </head>
  <body>
    <p data-src="/img.jpg">Lorem ipsum dolor sit amet.</p>
    <img src="/unknown.jpg" alt="Test image" />
    <img src="/img.jpg" alt="Test image" />
  </body>
</html>`

export function EditedPublicAssetHtml(relativePathToDist: string): string {
  return html`<html lang="de">
    <head>
      <meta charset="utf-8" />
      <link rel="icon" type="image/svg+xml" href="${relativePathToDist}/favicon.svg" />
      <link rel="icon" href="${relativePathToDist}/favicon.ico" />
      <title>{pageTitle}</title>
      <style lang="scss">
        @use './PageLayout.scss';
      </style>
    </head>
    <body>
      <p data-src="${relativePathToDist}/img.jpg">Lorem ipsum dolor sit amet.</p>
      <img src="/unknown.jpg" alt="Test image" />
      <img src="${relativePathToDist}/img.jpg" alt="Test image" />
    </body>
  </html>`
}

export const AstroAssetHtml = html` <div>
  <h1>Test</h1>
  <link href="/_astro/main.css" rel="stylesheet" />
  <img src="/_astro/logo.png" alt="Logo" />
  <h6>This is a test page.</h6>
  <p data-url="/_astro/main.css">
    Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nihil laboriosam natus doloribus, in
    quod cum nobis harum beatae quidem, repudiandae autem perspiciatis facilis, ducimus
  </p>
  <script src="/_astro/main.js"></script>
</div>`

export function EditedAstroAssetHtml(relativePathToDist: string): string {
  return html` <div>
    <h1>Test</h1>
    <link href="${relativePathToDist}/_astro/main.css" rel="stylesheet" />
    <img src="${relativePathToDist}/_astro/logo.png" alt="Logo" />
    <h6>This is a test page.</h6>
    <p data-url="${relativePathToDist}/_astro/main.css">
      Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nihil laboriosam natus doloribus, in
      quod cum nobis harum beatae quidem, repudiandae autem perspiciatis facilis, ducimus
    </p>
    <script src="${relativePathToDist}/_astro/main.js"></script>
  </div>`
}

export const InlineScriptHtml = html` <div>
  <h1>Test</h1>
  <h6>This is a test page.</h6>
  <p>
    Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nihil laboriosam natus doloribus, in
    quod cum nobis harum beatae quidem, repudiandae autem perspiciatis facilis
  </p>
  <script type="module" src="/_astro/main.js"></script>
  <script type="module" src="/stuff.js"></script>
  <script src="/_astro/main.js"></script>
</div>`

export const mainJsContent = `console.log("astro")`

export function EditedInlineScriptHtml(relativePathToDist: string): string {
  return html` <div>
    <h1>Test</h1>
    <h6>This is a test page.</h6>
    <p>
      Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nihil laboriosam natus doloribus, in
      quod cum nobis harum beatae quidem, repudiandae autem perspiciatis facilis
    </p>
    <script type="module">
      ${mainJsContent}
    </script>
    <script type="module" src="/stuff.js"></script>
    <script src="${relativePathToDist}/_astro/main.js"></script>
  </div>`
}

export const CombinedHtml = `
  ${PageLinkHtml}\n${PublicAssetHtml}\n${AstroAssetHtml}\n${InlineScriptHtml}
`
export function CombinedEditedHtml(
  relativePathToDist: string,
  relativePathToAbout: string,
  relativePathToBlog: string,
): string {
  return `
    ${EditedPageLinkHtml(relativePathToDist, relativePathToBlog, relativePathToAbout)}\n${EditedPublicAssetHtml(relativePathToDist)}\n
    ${EditedAstroAssetHtml(relativePathToDist)}\n${EditedInlineScriptHtml(relativePathToDist)}
  `
}

export function normalizeHtml(html: string): string {
  return html
    .replace(/\r\n/g, '\n') // normalize line endings
    .replace(/[ \t]+/g, ' ') // collapse spaces/tabs
    .replace(/\n\s*/g, '\n') // trim indentation
    .trim()
}
