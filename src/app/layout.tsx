import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kaiton — Your AI Running Coach",
  description:
    "Open source AI-powered running coach. Clone, add your API key, and train smarter.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#04170c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${manrope.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#04170c] text-[#d0e8d6]">
        {children}
      </body>
    </html>
  );
}
