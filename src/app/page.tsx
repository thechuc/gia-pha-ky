import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { Navbar, Hero, Features } from "@/components/landing/LandingSections";

export default async function Home() {
  const session = await auth();
  const family = await prisma.family.findFirst();

  // Nếu người dùng đã đăng nhập, vào thẳng Dashboard
  if (session) {
    redirect("/dashboard");
  }

  // Nếu dòng họ công khai, cũng có thể vào thẳng Dashboard (Tùy chọn)
  // Nhưng thông thường ta nên hiện Landing Page để giới thiệu
  if (family?.isPublic) {
    // redirect("/dashboard"); 
  }

  return (
    <main className="min-h-screen">
      <Navbar isPublic={!!family?.isPublic} />
      <Hero isPublic={!!family?.isPublic} coverImage={family?.coverImage || undefined} />
      <Features />
    </main>
  );
}

