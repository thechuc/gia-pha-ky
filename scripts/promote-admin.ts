import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const promoteUser = async (email: string) => {
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || 'D:/MyWorks/gia-pha-ky/dev.db';
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log(`正在 thúc đẩy người dùng: ${email}...`);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`Không tìm thấy người dùng với email: ${email}`);
      return;
    }

    const family = await prisma.family.findFirst();
    if (!family) {
      console.error('Không tìm thấy gia đình nào trong hệ thống. Hãy đảm bảo bạn đã chạy seed cơ bản.');
      return;
    }

    // 1. Phê duyệt tài khoản
    await prisma.user.update({
      where: { id: user.id },
      data: { isApproved: true },
    });

    // 2. Cấp quyền SUPER_ADMIN
    await prisma.familyRole.upsert({
      where: {
        userId_familyId: {
          userId: user.id,
          familyId: family.id,
        },
      },
      update: {
        role: 'SUPER_ADMIN',
      },
      create: {
        userId: user.id,
        familyId: family.id,
        role: 'SUPER_ADMIN',
      },
    });

    console.log(`✅ Thành công! Người dùng ${email} đã được phê duyệt và cấp quyền SUPER_ADMIN.`);
    console.log(`Giờ đây bạn có thể đăng nhập và truy cập các tính năng quản trị.`);
  } catch (error) {
    console.error('Đã xảy ra lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
};

const email = process.argv[2];
if (!email) {
  console.error('Vui lòng cung cấp email: npx tsx scripts/promote-admin.ts your-email@example.com');
  process.exit(1);
}

promoteUser(email);
