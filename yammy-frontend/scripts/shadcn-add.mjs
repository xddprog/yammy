#!/usr/bin/env node
/**
 * Добавляет компоненты shadcn и размещает их в shared/ui/{component}/{component}.tsx
 * Использование: npm run shadcn-add -- button card
 *
 * Важно: при наличии pnpm-lock.yaml shadcn CLI выберет pnpm для установки зависимостей.
 * Для npm достаточно package-lock.json (pnpm-lock.yaml в репозитории не держим).
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
  console.log('Использование: npm run shadcn-add -- <component> [component...]')
  console.log('Пример: npm run shadcn-add -- button card')
  process.exit(1)
}

try {
  execSync(`npx --yes shadcn@latest add ${components.join(' ')}`, {
    stdio: 'inherit',
  })
  moveToFolder()
} catch {
  process.exit(1)
}
