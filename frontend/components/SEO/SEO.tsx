import Head from 'next/head';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

export default function SEO({ title, description, image, url }: SEOProps) {
  const siteTitle = "SPORTSHUB - Social Sports Events";
  const fullTitle = `${title} | ${siteTitle}`;
  const defaultImage = "https://www.sportshub.net.au/images/default-event.png";
  const baseUrl = "https://www.sportshub.net.au";
  
  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph (Facebook, LinkedIn) */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:url" content={url || baseUrl} />
      <meta property="og:type" content="website" />
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      {url && <link rel="canonical" href={url} />}
    </Head>
  );
}