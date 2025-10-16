export default async function handler(req, res) {
  try {
    const backendUrl = "https://server-late-sun-2066.fly.dev/sitemap.xml";

    const response = await fetch(backendUrl);

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const xml = await response.text();

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.status(200).send(xml);
  } catch (error) {
    console.error("Error fetching sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
}
