import { Moon, Sun } from 'lucide-react'

import { useTheme } from '@/shared'

import { Button } from '../button/button'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  const toggle = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Переключить тему">
      <span className="relative flex size-4">
        <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
      </span>
    </Button>
  )
}
