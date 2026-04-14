import type { Metadata } from "next";
import { Playfair_Display, Be_Vietnam_Pro } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";
import AuthModal from "@/components/auth/AuthModal";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

// Be Vietnam Pro: tối ưu cho tiếng Việt, modern sans-serif
const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gia Phả Ký - Di Sản Số Gia Đình Việt",
  description: "Giải pháp quản lý gia phả chuyên nghiệp, kết nối thế hệ và gìn giữ văn hóa dòng họ Việt Nam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${playfair.variable} ${beVietnamPro.variable} h-full antialiased`}
    >
      <body 
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground font-sans transition-colors duration-500"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <ToastProvider>
              {children}
              <AuthModal />
            </ToastProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
