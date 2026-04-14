import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./lib/db";
import authConfig from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        // Check if user is approved - Don't throw to avoid redirect
        if (!user.isApproved) {
          return null;
        }

        return user;
      },
    }),
  ],
  callbacks: {
    async session({ session, user, token }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
        // @ts-ignore
        session.user.isApproved = token.isApproved;

        // Get roles and branches
        const familyRoles = await prisma.familyRole.findMany({
          where: { userId: token.sub },
          include: { branch: true },
        });

        const roles = familyRoles.map(r => ({
          familyId: r.familyId,
          role: r.role,
          branchId: r.branchId,
        }));

        // Thêm vai trò Super Admin nếu là email hệ thống
        if (session.user.email === process.env.NEXT_PUBLIC_ADMIN_ID) {
          const hasSuperAdmin = roles.some(r => r.role === "SUPER_ADMIN");
          if (!hasSuperAdmin) {
            roles.push({
              familyId: familyRoles[0]?.familyId || "global",
              role: "SUPER_ADMIN" as any,
              branchId: null,
            });
          }
        }

        // @ts-ignore - Adding custom data to session
        session.user.roles = roles;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.isApproved = (user as any).isApproved;
      }
      
      // Periodic refresh of isApproved status from DB
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { isApproved: true }
        });
        if (dbUser) {
          token.isApproved = dbUser.isApproved;
        }
      }

      return token;
    },
    async signIn({ user, account, profile }) {
      // Sync social profile image if it's missing or changed
      if (account?.provider !== "credentials" && user?.id) {
        const socialImage = (profile as any)?.picture || (profile as any)?.image || (profile as any)?.avatar_url;
        
        if (socialImage && user.image !== socialImage) {
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { image: socialImage }
            });
          } catch (error) {
            console.error("Failed to sync social image:", error);
          }
        }
      }
      return true;
    },
  },
});
