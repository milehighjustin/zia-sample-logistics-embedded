import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link"; 
import "./globals.css";
const shopifyClientId = process.env.shopifyClientId || "missing_client_id";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zia Tile - Sample Fulfillment",
  description: "Fulfillment management for Zia Tile",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const UiNavMenu = 'ui-nav-menu' as any;
  return (
    <html lang="en">

      <head>
        <meta name="shopify-api-key" content={shopifyClientId} />
<script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" async={false}></script>
      </head>

      <body className={` antialiased`}>
        <UiNavMenu>
          <Link href="/samples/ps/expedited">Expedited Sample Orders</Link>
          <Link href="/samples/ps/trade">Trade Sample Orders</Link>
          <Link href="/samples/ps/priority">Priority Sample Orders</Link>
          <Link href="/samples/ps">All Sample Orders</Link>
          <Link href="/samples/labels">Create Labels</Link>
          <Link href="/reporting">Reporting</Link>
          <Link href="/samples/settings">Settings</Link>
        </UiNavMenu>
        <div className="px-5">{children}</div>
      </body>

    </html>
  );
}
