import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");
  const isAuthRoute = ["/login", "/register", "/auth/error"].includes(nextUrl.pathname);

  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Middleware không còn chặn cứng Dashboard để cho phép xem công khai (Read-only)
  // Việc kiểm tra quyền sẽ được thực hiện tại cấp Layout (Server Component)
  // để có thể truy vấn Database và kiểm tra family.isPublic

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
