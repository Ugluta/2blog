/**
 * `<`  is escaped so admin/scraped content containing the literal text
 * "</script>" can't break out of the JSON-LD `<script>` tag — a standard
 * precaution for embedding JSON inside HTML (JSON.stringify alone doesn't
 * escape it, since `<` is meaningless in JSON itself).
 */
export function jsonLdScriptProps(data: unknown): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
