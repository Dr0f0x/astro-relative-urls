import fs from 'node:fs'
import path from 'node:path'
import { CombinedHtml } from '../file-contents'

/**
 * FileCreator is a utility to create a predefined folder and file structure for testing.
 * It supports safe creation (does not overwrite existing files) and cleanup of all created files.
 */
export class FileCreator {
  private publicDir: string
  private distDir: string

  constructor(private root: string) {
    this.publicDir = path.join(this.root, 'mocked-public')
    this.distDir = path.join(this.root, 'mocked-dist')
  }

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }

  /**
   * Creates the predefined file and folder structure:
   *
   * public/
   * ├─ img.jpg
   * └─ favicon.svg
   * dist/
   * ├─ index.html
   * ├─ img.jpg
   * ├─ stuff.js
   * ├─ favicon.svg
   * ├─ blog/index.html
   * ├─ about/index.html
   * └─ _astro/
   *     ├─ main.css
   *     ├─ main.js
   *     ├─ logo.png
   *     └─ hero.jpg
   */
  create() {
    // Public folder
    this.ensureDir(this.publicDir)
    fs.writeFileSync(path.join(this.publicDir, 'img.jpg'), 'dummy image content')
    fs.writeFileSync(path.join(this.publicDir, 'favicon.svg'), '<svg></svg>')

    // Dist folder
    this.ensureDir(this.distDir)
    fs.writeFileSync(path.join(this.distDir, 'index.html'), CombinedHtml)
    fs.writeFileSync(path.join(this.distDir, 'img.jpg'), 'dummy image content')
    fs.writeFileSync(path.join(this.distDir, 'stuff.js'), 'console.log("stuff")')
    fs.writeFileSync(path.join(this.distDir, 'favicon.svg'), '<svg></svg>')

    // Nested pages
    const blogDir = path.join(this.distDir, 'blog')
    this.ensureDir(blogDir)
    fs.writeFileSync(path.join(blogDir, 'index.html'), CombinedHtml)

    const aboutDir = path.join(this.distDir, 'about')
    this.ensureDir(aboutDir)
    fs.writeFileSync(path.join(aboutDir, 'index.html'), CombinedHtml)

    // Astro folder
    const astroDir = path.join(this.distDir, '_astro')
    this.ensureDir(astroDir)
    fs.writeFileSync(path.join(astroDir, 'main.css'), 'body { margin: 0; }')
    fs.writeFileSync(path.join(astroDir, 'main.js'), 'console.log("astro")')
    fs.writeFileSync(path.join(astroDir, 'logo.png'), 'dummy logo content')
    fs.writeFileSync(path.join(astroDir, 'hero.jpg'), 'dummy hero image')
    console.log('created files')
  }

  /**
   * Removes the entire `mocked-public` and `mocked-dist` directories recursively.
   */
  cleanup() {
    console.log('removing files')
    if (fs.existsSync(this.publicDir)) fs.rmSync(this.publicDir, { recursive: true, force: true })
    if (fs.existsSync(this.distDir)) fs.rmSync(this.distDir, { recursive: true, force: true })
  }
}
