import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FAF7F2",
};

export const metadata: Metadata = {
  title: "Pairly - Our Little Reward Shop",
  description: "A cozy, playful couples reward & wish-granting space.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full min-h-[100dvh] antialiased font-sans">
      <body className="h-full min-h-[100dvh] flex flex-col bg-[#FAF7F2] text-[#24201D] selection:bg-[#E06D75]/20 selection:text-[#24201D]">
        {children}
      </body>
    </html>
  );
}
