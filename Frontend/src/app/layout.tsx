import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Outfit,
  Plus_Jakarta_Sans,
  Josefin_Sans,
  Dela_Gothic_One,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AppUpdateBanner from "@/components/ui/app-update-banner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Design system fonts (docs/downtown/design-guidelines.md §4.5): Geist (UI/sans),
// Geist Mono (code/metrics), Outfit (display/headings), Plus Jakarta Sans (body).
// Vietnamese subset on display+body since the app ships lang="vi".
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

// TopGo theme fonts (chỉ dùng trong nhánh .tg — xem khối .tg trong globals.css).
// Cả hai đều có subset "vietnamese" trên Google Fonts.
// Cal Sans chưa có trong next/font/google nên tiêu đề phụ dùng Josefin Sans 600.
const josefin = Josefin_Sans({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-josefin-sans",
  display: "swap",
});
const delaGothic = Dela_Gothic_One({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400"],
  variable: "--font-dela-gothic",
  display: "swap",
});

const siteTitle = "ITBA.AI - Nexus for Tech Assessments";
const siteDescription =
  "Next-gen AI Interview Testing Platform. Generate dynamic technical tests, automated evaluation, and deep neural analysis for IT/BA candidates.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "ITBA.CORE",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ITBA.CORE — Autonomous Digital Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} ${outfit.variable} ${plusJakarta.variable} ${josefin.variable} ${delaGothic.variable} antialiased bg-background text-foreground font-body`}
        suppressHydrationWarning
      >
        <TooltipProvider>
          {children}
          <AppUpdateBanner />
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
