import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist_Mono, Lora, Merriweather } from "next/font/google";
import { Providers } from "./providers";
import { CssStudioDev } from "@/app/components/css-studio-dev";
import { DocsShell } from "@/app/components/docs-shell";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const merriweatherHeading = Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s · Commandry",
    default: "Commandry",
  },
  description:
    "TypeScript-first command registry for React — palettes, context menus, toolbars, and shortcuts from one source of truth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lora.variable} ${merriweatherHeading.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background pt-4 font-sans sm:pt-6">
        <Providers>
          <CssStudioDev />
          <DocsShell>{children}</DocsShell>
        </Providers>
      </body>
    </html>
  );
}
