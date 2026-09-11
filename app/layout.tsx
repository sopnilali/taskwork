import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

import { getSeoSettings, DEFAULT_SEO } from "@/lib/seo";
import { getThemeSettings, DEFAULT_THEME, themeToCssVars } from "@/lib/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings().catch(() => DEFAULT_SEO);
  const siteUrl = seo.site_url;
  const keywords = seo.keywords.split(",").map((k) => k.trim()).filter(Boolean);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: seo.title, template: `%s | ${seo.site_name}` },
    description: seo.description,
    applicationName: seo.site_name,
    generator: "Next.js",
    keywords,
    authors: [{ name: seo.author, url: siteUrl }],
    creator: seo.author,
    publisher: seo.site_name,
    referrer: "origin-when-cross-origin",
    formatDetection: { email: false, address: false, telephone: false },
    alternates: { canonical: seo.canonical_url || "/" },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName: seo.site_name,
      title: seo.title,
      description: seo.description,
      images: [{ url: seo.og_image, width: 512, height: 512, alt: `${seo.site_name} Logo` }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [seo.og_image],
      creator: seo.twitter_handle,
    },
    robots: {
      index: seo.robots_index,
      follow: seo.robots_follow,
      googleBot: { index: seo.robots_index, follow: seo.robots_follow, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    icons: { icon: "/tasktimer-logo.svg", apple: "/tasktimer-logo.svg" },
    manifest: "/manifest.webmanifest",
    category: "productivity",
    verification: {
      google: seo.google_verification || undefined,
      other: seo.bing_verification ? { "msvalidate.01": seo.bing_verification } : undefined,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [seo, theme] = await Promise.all([getSeoSettings().catch(()=> DEFAULT_SEO), getThemeSettings().catch(()=> DEFAULT_THEME)]);
  const vars = themeToCssVars(theme);
  const jsonLd = seo.json_ld_enabled ? {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${seo.site_url}/#organization`,
        name: seo.site_name,
        url: seo.site_url,
        logo: { "@type": "ImageObject", url: `${seo.site_url}${seo.og_image}` },
      },
      {
        "@type": "WebSite",
        "@id": `${seo.site_url}/#website`,
        url: seo.site_url,
        name: seo.site_name,
        publisher: { "@id": `${seo.site_url}/#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "SoftwareApplication",
        name: seo.site_name,
        operatingSystem: "Web",
        applicationCategory: "ProductivityApplication",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: seo.description,
        url: seo.site_url,
        image: `${seo.site_url}${seo.og_image}`,
      },
    ],
  } : null;
   const varStyle = Object.entries(vars).map(([k,v])=> `${k}:${v}`).join(';') + `;--surface:${theme.surface};background:${theme.background}`;
   return (
     <html lang="en" className={inter.variable} suppressHydrationWarning data-theme={theme.mode === 'dark' ? 'dark' : 'light'}>
       <head>
         <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
         <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
         <meta name="theme-color" content={theme.primary} />
         {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
         <style dangerouslySetInnerHTML={{ __html: `:root{${varStyle}}` }} />
       </head>
       <body suppressHydrationWarning>
         <ThemeProvider serverTheme={theme}><AuthProvider>{children}</AuthProvider></ThemeProvider>
       </body>
     </html>
   );
 }
