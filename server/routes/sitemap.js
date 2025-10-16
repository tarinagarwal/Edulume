import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

// Generate XML sitemap
router.get("/sitemap.xml", async (req, res) => {
  try {
    const baseUrl = process.env.CLIENT_URL || "https://your-domain.com";

    // Static pages
    const staticPages = [
      { url: "", priority: "1.0", changefreq: "daily" },
      { url: "/courses", priority: "0.9", changefreq: "daily" },
      { url: "/roadmaps", priority: "0.9", changefreq: "daily" },
      { url: "/discussions", priority: "0.8", changefreq: "daily" },
      { url: "/pdfs", priority: "0.7", changefreq: "weekly" },
      { url: "/ebooks", priority: "0.7", changefreq: "weekly" },
      { url: "/interview-resources", priority: "0.7", changefreq: "weekly" },
      { url: "/pdf-chatbot", priority: "0.6", changefreq: "monthly" },
      { url: "/suggest-feature", priority: "0.5", changefreq: "monthly" },
      { url: "/report-bug", priority: "0.5", changefreq: "monthly" },
      { url: "/verify-certificate", priority: "0.6", changefreq: "monthly" },
    ];

    // Fetch dynamic content
    const [courses, roadmaps, discussions] = await Promise.all([
      prisma.course.findMany({
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.roadmap.findMany({
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.discussion.findMany({
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    staticPages.forEach((page) => {
      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      xml += "  </url>\n";
    });

    // Add courses
    courses.forEach((course) => {
      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}/courses/${course.id}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `    <lastmod>${course.updatedAt.toISOString()}</lastmod>\n`;
      xml += "  </url>\n";
    });

    // Add roadmaps
    roadmaps.forEach((roadmap) => {
      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}/roadmaps/${roadmap.id}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `    <lastmod>${roadmap.updatedAt.toISOString()}</lastmod>\n`;
      xml += "  </url>\n";
    });

    // Add discussions
    discussions.forEach((discussion) => {
      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}/discussions/${discussion.id}</loc>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `    <lastmod>${discussion.updatedAt.toISOString()}</lastmod>\n`;
      xml += "  </url>\n";
    });

    xml += "</urlset>";

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
});

export default router;
