/**
 * Generates `public/sitemap.xml` and the `Sitemap:` line of `public/robots.txt`
 * from the deployment's own domain — never a hardcoded URL.
 *
 * Usage:
 *   VITE_SITE_URL=https://example.com npm run sitemap
 *   npm run sitemap -- --domain=https://example.com
 *
 * Without a domain the script exits non-zero and leaves
 * existing files untouched.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const arg = process.argv.find((a) => a.startsWith("--domain="));
const domain = (arg?.slice("--domain=".length) ?? process.env.VITE_SITE_URL ?? "").replace(
  /\/+$/,
  "",
);

if (!domain) {
  console.error(
    "[sitemap] No domain. Set VITE_SITE_URL or pass --domain=https://your-domain.",
  );
  process.exit(1);
}

// Static public routes from resources/js/app.tsx.
// Dynamic detail routes (e.g. /tours/:slug, /hotels/:id) are intentionally
// excluded — their slugs only exist at runtime via the API.
const paths = [
  ["/", "weekly", "1.0"],
  ["/destinations", "weekly", "0.9"],
  ["/hotels", "weekly", "0.9"],
  ["/tours", "weekly", "0.9"],
  ["/travels", "weekly", "0.9"],
  ["/deals", "weekly", "0.9"],
  ["/blog", "weekly", "0.8"],
  ["/cars", "weekly", "0.8"],
  ["/flights", "weekly", "0.8"],
  ["/promos", "weekly", "0.8"],
  ["/events", "weekly", "0.8"],
  ["/gallery", "monthly", "0.7"],
  ["/team", "monthly", "0.6"],
  ["/partners", "monthly", "0.6"],
  ["/visa", "monthly", "0.8"],
  ["/contact", "monthly", "0.7"],
  ["/legal", "monthly", "0.5"],
  ["/privacy-policy", "yearly", "0.3"],
  ["/purchase-policy", "yearly", "0.3"],
];

const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  paths
    .map(
      ([path, changefreq, priority]) =>
        `  <url><loc>${domain}${path}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`,
    )
    .join("\n") +
  `\n</urlset>\n`;

writeFileSync(new URL("../public/sitemap.xml", import.meta.url), sitemap);

// Update only the Sitemap: line in robots.txt, preserving existing rules
// (e.g. Disallow: /admin). Append it if missing; create a minimal file if absent.
const robotsUrl = new URL("../public/robots.txt", import.meta.url);
const sitemapLine = `Sitemap: ${domain}/sitemap.xml`;
let robots;
if (existsSync(robotsUrl)) {
  robots = readFileSync(robotsUrl, "utf8");
  if (/^Sitemap:.*$/m.test(robots)) {
    robots = robots.replace(/^Sitemap:.*$/m, sitemapLine);
  } else {
    robots = `${robots.replace(/\s*$/, "")}\n${sitemapLine}\n`;
  }
} else {
  robots = `User-agent: *\nAllow: /\n\n${sitemapLine}\n`;
}
writeFileSync(robotsUrl, robots);
console.log(`[sitemap] Wrote sitemap.xml + robots.txt for ${domain}`);
