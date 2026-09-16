import * as cheerio from "cheerio";

export function extractText(html: string, selector: string): string | null {
  const $ = cheerio.load(html);
  const el = $(selector).first();
  if (el.length === 0) return null;
  const text = el.text().replace(/\s+/g, " ").trim();
  return text || null;
}

export function extractAttr(html: string, selector: string, attr: string): string | null {
  const $ = cheerio.load(html);
  const el = $(selector).first();
  if (el.length === 0) return null;
  return el.attr(attr)?.trim() || null;
}

/** Resolves relative `href`s against `baseUrl` and de-duplicates. */
export function extractLinks(html: string, selector: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  $(selector).each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      links.add(new URL(href, baseUrl).toString());
    } catch {
      // invalid href — skip rather than fail the whole crawl
    }
  });
  return [...links];
}
