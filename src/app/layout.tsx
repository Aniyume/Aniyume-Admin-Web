import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/features/auth/auth-provider";
import { UiProvider } from "@/features/ui/ui-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Aniyume Admin",
  description: "Aniyume operations, moderation and content management console",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <UiProvider>
          <AuthProvider>{children}</AuthProvider>
        </UiProvider>
      </body>
    </html>
  );
}
