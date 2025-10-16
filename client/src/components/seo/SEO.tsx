import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: "summary" | "summary_large_image";
  canonicalUrl?: string;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  ogImage = "https://edulume.site/og-image.png",
  ogType = "website",
  twitterCard = "summary_large_image",
  canonicalUrl,
}) => {
  const siteUrl = "https://edulume.site";
  const fullTitle = `${title} | Edulume`;
  const currentUrl = canonicalUrl || `${siteUrl}${window.location.pathname}`;

  useEffect(() => {
    // Update title
    document.title = fullTitle;

    // Helper to update or create meta tag
    const updateMetaTag = (
      selector: string,
      attribute: string,
      content: string
    ) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        if (selector.includes("property=")) {
          element.setAttribute("property", selector.split('"')[1]);
        } else if (selector.includes("name=")) {
          element.setAttribute("name", selector.split('"')[1]);
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, content);
    };

    // Basic meta tags
    updateMetaTag('meta[name="description"]', "content", description);
    if (keywords) {
      updateMetaTag('meta[name="keywords"]', "content", keywords);
    }

    // Open Graph tags
    updateMetaTag('meta[property="og:title"]', "content", fullTitle);
    updateMetaTag('meta[property="og:description"]', "content", description);
    updateMetaTag('meta[property="og:image"]', "content", ogImage);
    updateMetaTag('meta[property="og:url"]', "content", currentUrl);
    updateMetaTag('meta[property="og:type"]', "content", ogType);
    updateMetaTag('meta[property="og:site_name"]', "content", "Edulume");

    // Twitter Card tags
    updateMetaTag('meta[name="twitter:card"]', "content", twitterCard);
    updateMetaTag('meta[name="twitter:title"]', "content", fullTitle);
    updateMetaTag('meta[name="twitter:description"]', "content", description);
    updateMetaTag('meta[name="twitter:image"]', "content", ogImage);

    // Canonical URL
    let canonical = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", currentUrl);
  }, [
    title,
    description,
    keywords,
    ogImage,
    ogType,
    twitterCard,
    currentUrl,
    fullTitle,
  ]);

  return null;
};

export default SEO;
