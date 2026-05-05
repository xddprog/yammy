#!/usr/bin/env node
/**
 * Добавляет компоненты shadcn и размещает их в shared/ui/{component}/{component}.tsx
 * Использование: pnpm shadcn-add button card
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UI_DIR = path.resolve(__dirname, '../src/shared/ui')

function moveToFolder() {
  if (!fs.existsSync(UI_DIR)) return

  const files = fs.readdirSync(UI_DIR)
  for (const file of files) {
    if (!file.endsWith('.tsx')) continue

    const componentName = file.replace(/\.tsx$/, '')
    const componentDir = path.join(UI_DIR, componentName)
    const srcPath = path.join(UI_DIR, file)

    if (fs.statSync(srcPath).isFile() && !fs.existsSync(componentDir)) {
      fs.mkdirSync(componentDir, { recursive: true })
      const destPath = path.join(componentDir, file)
      fs.renameSync(srcPath, destPath)
      console.log(`  ✓ ${file} → ${componentName}/${file}`)
    }
  }
}

const components = process.argv.slice(2)
if (components.length === 0) {
  console.log('Использование: pnpm shadcn-add <component> [component...]')
  console.log('Пример: pnpm shadcn-add button card')
  process.exit(1)
}

try {
  execSync(`pnpm dlx shadcn@latest add ${components.join(' ')}`, {
    stdio: 'inherit',
  })
  moveToFolder()
} catch {
  process.exit(1)
}
