import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

/** Page-level metadata used by Next.js for SEO, PWA, and Apple Web App support. */
export const metadata: Metadata = {
  applicationName: "Receipt Extractor",
  title: "Receipt Extractor",
  description:
    "Extract structured data from receipt images and PDFs using AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Receipt Extractor",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

/** Viewport configuration with PWA theme color. */
export const viewport: Viewport = {
  themeColor: "#2563EB",
};

/**
 * Root layout component that wraps all pages. Applies global styles and fonts.
 * @param children - The child components to render within the layout.
 * @param children.children - The React nodes to be rendered inside the layout.
 * @returns A JSX element representing the root layout.
 *
 * This component sets up the HTML structure and applies global CSS classes for styling.
 * It also integrates custom fonts using Next.js's `localFont` utility, making them available via CSS variables.
 *
 * The `metadata` export provides page metadata that can be used by Next.js for SEO and other purposes.
 *
 * Note: The actual content of the `metadata` object should be updated to reflect the specific details of the application.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
