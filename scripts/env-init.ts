import { existsSync, writeFileSync, readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env')

function ensureLine(k: string, v: string, content: string): string {
  const re = new RegExp(`^${k}=.*$`, 'm')
  if (re.test(content)) return content.replace(re, `${k}=${v}`)
  return content.endsWith('\n') ? `${content}${k}=${v}\n` : `${content}\n${k}=${v}\n`
}

let content = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''

// Database URL (SQLite local default)
content = ensureLine('DATABASE_URL', 'file:./prisma/dev.db', content)

// NextAuth secret
const random = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
content = ensureLine('NEXTAUTH_SECRET', process.env.NEXTAUTH_SECRET || random, content)

// NextAuth URL
content = ensureLine('NEXTAUTH_URL', process.env.NEXTAUTH_URL || 'http://localhost:3000', content)

writeFileSync(envPath, content, 'utf8')

console.log('✅ .env hazırlandı')

