import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import '@/css/fonts.css'
import 'remixicon/fonts/remixicon.css'
import dynamic from "next/dynamic";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Restaurant",
  description: "An online restaurant",
  icons: [{ rel: 'icon', url: '/restaurant_logo_3.jpg' }]
};
const NoSSR = dynamic(() => import('../components/providers-wrap'), { ssr: false })
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NoSSR>
          {children}
        </NoSSR>
      </body>
    </html>
  );
}
