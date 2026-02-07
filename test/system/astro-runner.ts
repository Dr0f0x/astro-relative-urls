import { spawn } from 'node:child_process'
import { Dirent, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { cp, rm } from 'node:fs/promises'
import path from 'node:path'

type RunCommandOptions = {
  cwd?: string
  env?: NodeJS.ProcessEnv
  timeout?: number
  onStdout?: (data: string) => void
  onStderr?: (data: string) => void
}

export function runCommand(
  command: string,
  args: string[] = [],
  options: RunCommandOptions = {},
): Promise<number> {
  return new Promise((resolve, reject) => {
    console.log(`Running command ${command} with opts ${args} in ${options.cwd}`)
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      shell: true,
    })

    child.stdout.on('data', (data) => {
      const text = data.toString()
      options.onStdout?.(text)
    })

    child.stderr.on('data', (data) => {
      const text = data.toString()
      options.onStderr?.(text)
    })

    child.on('error', reject)

    child.on('close', (code) => {
      resolve(code ?? 0)
    })
  })
}

export class AstroRunner {
  private fixturesPath = path.resolve('test/fixtures/astro-project')
  private integrationPath = path.resolve('test/system/astro-integration')
  private packageName = 'astro-relative-urls'

  /**
   * Copies the astro-project fixture, links the lcoal astro-relative-urls package, and runs npm install
   */
  async setup(): Promise<void> {
    await this.copyFixture()
    await this.assertLocalPackageExists()
    await this.installLocalPackage()
    await this.npmInstall()
  }

  // 1) Copy fixtures/astro-project → astro-integration
  private async copyFixture() {
    console.log('Copying Astro fixture project...')
    console.log(`   from: ${this.fixturesPath}`)
    console.log(`   to:   ${this.integrationPath}`)
    if (!existsSync(this.fixturesPath)) {
      throw new Error(`Fixture not found at ${this.fixturesPath}`)
    }
    // Recursively copy, skipping node_modules and dist folders
    const entries: Dirent[] = readdirSync(this.fixturesPath, { withFileTypes: true })
    mkdirSync(this.integrationPath, { recursive: true })
    const dirIgnores: Set<string> = new Set(['node_modules', 'dist', 'expected_dist'])

    for (const entry of entries) {
      if (dirIgnores.has(entry.name)) continue // skip unwanted folders

      const src = path.join(this.fixturesPath, entry.name)
      const dest = path.join(this.integrationPath, entry.name)

      if (entry.isDirectory()) {
        await cp(src, dest, { recursive: true, force: true })
      } else if (entry.isFile()) {
        await cp(src, dest, { force: true })
      }
    }
  }

  // 2) Check that the package exists locally
  private async assertLocalPackageExists() {
    console.log(`Checking for globally linked package "${this.packageName}"...`)
    await this.runAstroCommand('npm', ['list', '-g', this.packageName], {
      allowFailure: false,
    })
  }

  private async installLocalPackage(): Promise<void> {
    console.log(`Installing local package "${this.packageName}" into integration folder...`)
    await this.runAstroCommand(
      'npm',
      ['install', path.resolve(`.`)], // path to the local package
      { cwd: this.integrationPath },
    )
  }

  // 4) run npm install
  private async npmInstall() {
    console.log('Installing npm dependencies')
    await this.runAstroCommand('npm', ['install'], {
      cwd: this.integrationPath,
    })
  }

  /**
   * Deletes the astro-integration directory created by setup()
   */
  async cleanup(): Promise<void> {
    if (!existsSync(this.integrationPath)) {
      return
    }

    console.log(`Removing astro-integration directory: ${this.integrationPath}`)

    const maxRetries = 5
    const retryDelay = 100 // ms

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await rm(this.integrationPath, { recursive: true, force: true })
        console.log(`Cleanup complete: ${this.integrationPath}`)
        return
      } catch (err) {
        if (attempt === maxRetries) {
          console.warn(
            `Could not fully remove directory: ${this.integrationPath}. Continuing anyway. ${err}`,
          )
          return
        }
        console.log(`Cleanup attempt ${attempt} failed. Retrying in ${retryDelay}ms...`)
        await new Promise((r) => setTimeout(r, retryDelay))
      }
    }
  }

  private runAstroCommand(
    command: string,
    args: string[],
    options: {
      cwd?: string
      allowFailure?: boolean
    } = {},
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options.cwd,
        shell: true,
        stdio: 'inherit',
      })

      child.on('error', reject)

      child.on('close', (code) => {
        if (code !== 0 && !options.allowFailure) {
          reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`))
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Run a command inside the astro-integration directory
   */
  runInAstro(
    command: string,
    args: string[] = [],
    options: RunCommandOptions = {},
  ): Promise<number> {
    return runCommand(command, args, {
      ...options,
      cwd: this.integrationPath,
    })
  }
}
