import path from 'node:path'
import { FileSystemService } from '../../src/filesystem'

const sep = path.sep

export abstract class MockFsNode {
  constructor(
    public name: string,
    private parent: MockDirectory | null,
  ) {}

  getName(): string {
    return this.name
  }

  setParent(parent: MockDirectory) {
    this.parent = parent
  }

  getParent(): MockDirectory | null {
    return this.parent
  }

  getPath(): string {
    if (!this.parent) {
      return this.name
    }
    return `${this.parent.getPath()}${sep}${this.name}`
  }

  delete(): void {
    if (!this.parent) {
      throw new Error('Cannot delete element without parent')
    }
    this.parent.children.delete(this.name)
  }

  abstract getPathsFromParent(): string[]
}

export class MockFile extends MockFsNode {
  constructor(
    name: string,
    public content: string,
    parent: MockDirectory | null = null,
  ) {
    super(name, parent)
  }

  getPathsFromParent(): string[] {
    return [this.name]
  }
}

export class MockDirectory extends MockFsNode {
  children = new Map<string, MockFsNode>()

  constructor(name: string, parent: MockDirectory | null = null, children: MockFsNode[] = []) {
    super(name, parent)
    for (const child of children) {
      child.setParent(this)
      this.children.set(child.name, child)
    }
  }

  setChild(node: MockFsNode): this {
    node.setParent(this)
    this.children.set(node.name, node)
    return this
  }

  getChild(name: string): MockFsNode | undefined {
    return this.children.get(name)
  }

  getPathsFromParent(): string[] {
    return Array.from(this.children.values()).flatMap((child) =>
      child.getPathsFromParent().map((p) => `${this.name}${sep}${p}`),
    )
  }
}

export class MockFileSystem implements FileSystemService {
  private root: MockDirectory

  constructor(root: MockDirectory)
  constructor(source: FileSystemService)
  constructor(arg: MockDirectory | FileSystemService) {
    if (arg instanceof MockFileSystem) {
      this.root = MockFileSystem.cloneDirectory(arg.root, null)
    } else if (arg instanceof MockDirectory) {
      this.root = arg
    } else {
      throw new TypeError(
        'Invalid argument for MockFileSystem constructor, no root could be constructed',
      )
    }
  }

  private static cloneDirectory(
    source: MockDirectory,
    parent: MockDirectory | null,
  ): MockDirectory {
    const dir = new MockDirectory(source.name, parent)

    for (const child of source.children.values()) {
      let cloned: MockFsNode
      if (child instanceof MockDirectory) cloned = MockFileSystem.cloneDirectory(child, dir)
      else if (child instanceof MockFile) cloned = new MockFile(child.name, child.content, dir)
      else throw new Error('Unknown node type')

      dir.children.set(cloned.name, cloned)
    }

    return dir
  }

  private resolveNode(p: string): MockFsNode {
    const parts = path.normalize(p).split(sep).filter(Boolean)
    let current: MockFsNode = this.root

    for (const part of parts) {
      if (!(current instanceof MockDirectory)) {
        throw new TypeError(
          `Path is includes part which is not a directory but treated as one: ${p} - ${part}`,
        )
      }
      const next = current.getChild(part)
      if (!next) {
        throw new Error(`Path does not exist: ${p}`)
      }
      current = next
    }

    return current
  }

  readDir(p: string): string[] {
    const node = this.resolveNode(p)
    if (!(node instanceof MockDirectory)) {
      throw new TypeError(`Not a directory: ${p}`)
    }
    return [...node.children.keys()]
  }

  readFile(p: string): string {
    const node = this.resolveNode(p)
    if (!(node instanceof MockFile)) {
      throw new TypeError(`Not a file: ${p}`)
    }
    return node.content
  }

  writeFile(p: string, content: string): void {
    const dir = path.dirname(p)
    const name = path.basename(p)
    const parent = this.resolveNode(dir)

    if (!(parent instanceof MockDirectory)) {
      throw new TypeError(`Not a directory: ${dir}`)
    }

    parent.setChild(new MockFile(name, content, parent))
  }

  deleteFile(p: string): void {
    this.removeElement(p)
  }

  stat(p: string) {
    const node = this.resolveNode(p)
    return {
      isFile: () => node instanceof MockFile,
      isDirectory: () => node instanceof MockDirectory,
    }
  }

  removeDir(p: string): void {
    this.removeElement(p)
  }

  private removeElement(p: string): void {
    const node = this.resolveNode(p)

    if (!node.getParent()) {
      throw new Error(`Element to remove has no parent: ${p}`)
    }

    node.delete()
  }

  exists(p: string): boolean {
    try {
      this.resolveNode(p)
      return true
    } catch {
      return false
    }
  }

  resolve(...paths: string[]): string {
    const joined = path.join(...paths)
    return path.isAbsolute(joined) ? joined : path.join(this.root.getPath(), joined)
  }
}
