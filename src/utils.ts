import path from 'node:path'
import { FileSystemService } from './filesystem'

/**
 * Recursively get all files in a folder
 * @param {string} dir - folder to scan
 * @param {string[]} baseDir - used internally for relative paths
 * @param {string[]} [extensions] - optional array of file extensions to include (e.g., [".txt",".svg"])
 * @returns {string[]} - array of relative file paths
 */
export function getAllFiles(
  dir: string,
  fs: FileSystemService,
  baseDir: string = dir,
  extensions: string[] | null = null,
): string[] {
  let results: string[] = []
  for (const file of fs.readDir(dir)) {
    const fullPath = path.join(dir, file)
    const stat = fs.stat(fullPath)

    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, fs, baseDir, extensions))
    } else {
      const relativePath = path.relative(baseDir, fullPath).split(path.sep).join('/')

      // If extensions array is provided, only include matching files
      if (!extensions || extensions.some((ext) => relativePath.endsWith(ext))) {
        results.push(relativePath)
      }
    }
  }
  return results
}
