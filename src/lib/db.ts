import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const prismaClientSingleton = () => {
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || 'D:/MyWorks/gia-pha-ky/dev.db'
  
  // Lưu ý: @prisma/adapter-better-sqlite3 không cho phép truyền instance Database trực tiếp
  // Chúng ta truyền cấu hình và thời gian timeout (busy_timeout) qua object config
  const adapter = new PrismaBetterSqlite3({ 
    url: dbPath,
    timeout: 30000 // Tương đương sqlite.pragma('busy_timeout = 30000')
  })

  return new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
