import Head from 'next/head';
import { APP_CONFIG } from '@/lib/constants';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogUrl?: string;
  noIndex?: boolean;
}

export default function SEO({
  title,
  description,
  keywords = [],
  ogImage,
  ogUrl,
  noIndex = false,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${APP_CONFIG.name}` : APP_CONFIG.name;
  const fullDescription = description || APP_CONFIG.description;
  const fullOgImage = ogImage || `${APP_CONFIG.url}/og-image.png`;
  const fullOgUrl = ogUrl || APP_CONFIG.url;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:url" content={fullOgUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={APP_CONFIG.name} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={fullOgImage} />
      
      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      
      {/* Theme Color */}
      <meta name="theme-color" content="#0f172a" />
    </Head>
  );
} 