import fs from 'node:fs'

export interface FileSystemService {
  readDir(path: string): string[]
  readFile(path: string, encoding?: BufferEncoding): string
  writeFile(path: string, content: string, encoding: BufferEncoding): void
  deleteFile(path: string): void
  stat(path: string): { isFile: () => boolean; isDirectory: () => boolean }
  removeDir(path: string): void
  exists(path: string): boolean
}

export class NodeFileSystem implements FileSystemService {
  readDir(path: string): string[] {
    return fs.readdirSync(path)
  }

  readFile(path: string, encoding: BufferEncoding = 'utf8'): string {
    return fs.readFileSync(path, encoding)
  }

  writeFile(
    path: string,
    content: string,
    encoding: BufferEncoding = 'utf8',
  ): void {
    fs.writeFileSync(path, content, encoding)
  }

  deleteFile(path: string): void {
    fs.unlinkSync(path)
  }

  stat(path: string): { isFile: () => boolean; isDirectory: () => boolean } {
    return fs.statSync(path)
  }

  removeDir(path: string): void {
    fs.rmdirSync(path)
  }

  exists(path: string): boolean {
    return fs.existsSync(path)
  }
}
