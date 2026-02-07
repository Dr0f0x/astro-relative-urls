import { describe, it, expect, beforeEach } from 'vitest'
import { getAllFiles } from '../../src/utils'
import { MockDirectory, MockFileSystem, MockFile } from './mocked-filesystem'

describe('getAllFiles', () => {
  let fsMock: MockFileSystem

  beforeEach(() => {
    /* creates a mocked filesystem with the following structure:
    dist/
    ├─ index.html
    ├─ blog/
    │  └─ index.html
    ├─ about/
    │  └─ index.html
    └─ _astro/
        ├─ main.css
        ├─ logo.png
        └─ hero.jpg
    */
    const root = new MockDirectory('')
    const dist = new MockDirectory('dist')
    root.setChild(dist)
    dist
      .setChild(new MockFile('index.html', '<a href="/blog">Blog</a>', dist))
      .setChild(
        new MockDirectory('blog', dist, [new MockFile('index.html', '<a href="/">Home</a>', null)]),
      )
      .setChild(
        new MockDirectory('about', dist, [
          new MockFile('index.html', '<a href="/">Home</a>', null),
        ]),
      )

    // _astro assets
    dist.setChild(
      new MockDirectory('_astro', dist, [
        new MockFile('main.css', 'body { background: red }', null),
        new MockFile('logo.png', '<binary>', null),
        new MockFile('hero.jpg', '<binary>', null),
      ]),
    )
    fsMock = new MockFileSystem(root)
  })

  it('should recursively return all files', () => {
    const files = getAllFiles('/dist', fsMock)
    expect(files).toContain('index.html')
    expect(files).toContain('blog/index.html')
    expect(files).toContain('about/index.html')
    expect(files).toContain('_astro/main.css')
    expect(files).toContain('_astro/logo.png')
    expect(files).toContain('_astro/hero.jpg')
  })

  it('should filter by extension', () => {
    const files = getAllFiles('/dist', fsMock, undefined, ['.html'])
    expect(files).toContain('index.html')
    expect(files).toContain('blog/index.html')
    expect(files).toContain('about/index.html')
  })
})
