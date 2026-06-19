import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-xl border border-zinc-800 bg-zinc-900/80 p-4', className)}>{children}</div>
}

export function Button({
  className,
  variant = 'default',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'danger' | 'ghost' }) {
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'default' && 'bg-white text-zinc-900 hover:bg-zinc-200',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-500',
        variant === 'ghost' && 'border border-zinc-700 hover:bg-zinc-800',
        className,
      )}
      {...props}
    />
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
      {...props}
    />
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'danger' | 'success' }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        tone === 'neutral' && 'bg-zinc-800 text-zinc-300',
        tone === 'danger' && 'bg-red-950 text-red-300',
        tone === 'success' && 'bg-emerald-950 text-emerald-300',
      )}
    >
      {children}
    </span>
  )
}
