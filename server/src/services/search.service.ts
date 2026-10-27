/**
 * DuckDuckGo Web Search Service
 * Strictly constrained to coding and technical software research.
 */

const CODING_KEYWORDS = [
  "react", "next", "nextjs", "vite", "vue", "angular", "svelte", "astro", "node", "npm", "yarn", "pnpm", "bun",
  "typescript", "javascript", "ts", "js", "css", "tailwind", "postcss", "html", "jsx", "tsx",
  "component", "hook", "state", "props", "import", "export", "package", "dependency",
  "api", "sdk", "function", "class", "interface", "type", "error", "bug", "syntax",
  "lucide", "framer-motion", "recharts", "zustand", "redux", "zod", "prisma", "sql",
  "database", "backend", "frontend", "express", "router", "route", "http", "fetch",
  "axios", "json", "dom", "event", "async", "await", "promise", "webcontainer",
  "documentation", "docs", "guide", "tutorial", "code", "github", "git", "web",
  "library", "framework", "module", "webpack", "rollup", "babel", "eslint", "prettier",
  "shadcn", "radix", "headlessui", "ui", "button", "input", "form", "table", "card",
  "modal", "navbar", "accordion", "slider", "carousel", "layout", "grid", "flex",
  "animation", "icon", "icons", "chart", "dashboard", "auth", "supabase", "firebase",
  "stripe", "svg", "font", "seo", "app", "page", "props", "style", "styles"
];

export function isCodingResearchQuery(query: string): boolean {
  if (!query || typeof query !== "string") return false;

  const clean = query.toLowerCase();

  return CODING_KEYWORDS.some((kw) => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(clean);
  }) || /\b(npm|install|import|export|error|fix|create|build|run|test|config)\b/i.test(clean);
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
}

export class SearchService {
  static async searchDuckDuckGo(query: string): Promise<{
    success: boolean;
    query: string;
    results?: SearchResultItem[];
    error?: string;
  }> {
    if (!isCodingResearchQuery(query)) {
      return {
        success: false,
        query,
        error:
          "Constraint Violation: Web search access is strictly restricted to software engineering, programming libraries, API documentation, syntax, and coding troubleshooting. General non-programming search is prohibited.",
      };
    }

    try {
      const response = await fetch("https://html.duckduckgo.com/html/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: `q=${encodeURIComponent(query)}`,
      });

      if (!response.ok) {
        throw new Error(`DuckDuckGo returned status ${response.status}`);
      }

      const html = await response.text();
      const results: SearchResultItem[] = [];

      const stripHtml = (str: string) =>
        str
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/\s+/g, " ")
          .trim();

      // Primary regex matching result link and snippet
      const regex =
        /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
      let match;

      while ((match = regex.exec(html)) !== null && results.length < 5) {
        let rawUrl = match[1] || "";
        if (rawUrl.includes("uddg=")) {
          const decoded = decodeURIComponent(rawUrl.split("uddg=")[1]?.split("&")[0] || "");
          if (decoded) rawUrl = decoded;
        }

        const title = stripHtml(match[2] || "");
        const snippet = stripHtml(match[3] || "");

        if (title && snippet) {
          results.push({
            title,
            url: rawUrl,
            snippet,
          });
        }
      }

      // Fallback regex if snippet is inside a different container tag
      if (results.length === 0) {
        const fallbackRegex =
          /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|div|span)>/g;
        while ((match = fallbackRegex.exec(html)) !== null && results.length < 5) {
          let rawUrl = match[1] || "";
          if (rawUrl.includes("uddg=")) {
            const decoded = decodeURIComponent(rawUrl.split("uddg=")[1]?.split("&")[0] || "");
            if (decoded) rawUrl = decoded;
          }

          const title = stripHtml(match[2] || "");
          const snippet = stripHtml(match[3] || "");

          if (title) {
            results.push({
              title,
              url: rawUrl,
              snippet: snippet || "No description available.",
            });
          }
        }
      }

      // If DuckDuckGo returned 0 results or triggered bot challenge, fall back to package registry
      if (results.length === 0) {
        const fallbackResults = await SearchService.searchNpmRegistry(query);
        if (fallbackResults.length > 0) {
          return {
            success: true,
            query,
            results: fallbackResults,
          };
        }
      }

      return {
        success: true,
        query,
        results: results.slice(0, 5),
      };
    } catch (err: unknown) {
      // On network or DDG error, try NPM fallback
      try {
        const fallbackResults = await SearchService.searchNpmRegistry(query);
        if (fallbackResults.length > 0) {
          return {
            success: true,
            query,
            results: fallbackResults,
          };
        }
      } catch {
        // preserve original error
      }

      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        query,
        error: `DuckDuckGo search error: ${errorMsg}`,
      };
    }
  }

  /**
   * High-reliability fallback search using NPM package registry
   */
  static async searchNpmRegistry(query: string): Promise<SearchResultItem[]> {
    try {
      const cleanQuery = query.replace(/[^\w\s-]/g, " ").trim();
      const res = await fetch(
        `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(cleanQuery)}&size=5`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) return [];
      const data = (await res.json()) as any;
      return (data.objects || []).map((item: any) => ({
        title: `${item.package.name} (v${item.package.version})`,
        url:
          item.package.links?.homepage ||
          item.package.links?.npm ||
          `https://www.npmjs.com/package/${item.package.name}`,
        snippet: item.package.description || `NPM library: ${item.package.name}`,
      }));
    } catch {
      return [];
    }
  }
}
