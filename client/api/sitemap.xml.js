export default async function handler(req, res) {
  try {
    // Try to fetch dynamic sitemap from backend
    const response = await fetch(
      "https://server-late-sun-2066.fly.dev/sitemap.xml",
      {
        headers: { Accept: "application/xml" },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      }
    );

    if (response.ok) {
      const xml = await response.text();
      res.setHeader("Content-Type", "application/xml");
      res.status(200).send(xml);
      return;
    }
  } catch (error) {
    console.error(
      "Dynamic sitemap failed, using static fallback:",
      error.message
    );
  }

  // Fallback to static sitemap
  const staticSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://edulume.site</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://edulume.site/courses</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://edulume.site/roadmaps</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://edulume.site/discussions</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://edulume.site/pdfs</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://edulume.site/ebooks</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://edulume.site/interview-resources</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://edulume.site/pdf-chatbot</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://edulume.site/verify-certificate</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://edulume.site/suggest-feature</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://edulume.site/report-bug</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.status(200).send(staticSitemap);
}
