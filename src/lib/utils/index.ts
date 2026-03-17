import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

/** Truncate a string to maxLen chars, appending '...' */
export function truncate(str: string, maxLen = 40): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

/** Generate a consistent color from a string (for avatars) */
export function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const colors = ['#f26060', '#5b8ff9', '#3ecf8e', '#9c7aff', '#ff8c42', '#e8b84b', '#ff6b9d']
  return colors[Math.abs(hash) % colors.length]
}

export function getCurrentYearMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function buildApiUrl(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(path, process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v))
    })
  }
  return url.pathname + url.search
}
