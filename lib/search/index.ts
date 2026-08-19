import { sqlite } from "@/lib/db";

export interface SearchResult {
  rowid: number;
  title: string;
  content: string;
  contentType: string;
  contentId: number;
  snippet: string;
}

function sanitizeFtsQuery(query: string): string {
  return `"${query.replace(/"/g, '""')}"`;
}

export async function searchContent(
  query: string,
  options?: {
    contentType?: string;
    limit?: number;
  }
): Promise<SearchResult[]> {
  try {
    const limit = options?.limit || 20;
    const safeQuery = sanitizeFtsQuery(query.trim());
    
    const sqlQuery = `
      SELECT 
        rowid,
        title,
        content,
        content_type AS contentType,
        content_id AS contentId,
        snippet(search_index, 0, '', '', '...', 20) AS snippet
      FROM search_index
      WHERE search_index MATCH ?
      ${options?.contentType ? 'AND content_type = ?' : ''}
      ORDER BY rank
      LIMIT ?
    `;
    
    const params: any[] = options?.contentType 
      ? [safeQuery, options.contentType, limit] 
      : [safeQuery, limit];
    
    const results = sqlite.prepare(sqlQuery).all(...params) as SearchResult[];
    return results || [];
  } catch (error) {
    console.error("Search failed:", error);
    return [];
  }
}

export async function searchAllContent(query: string): Promise<SearchResult[]> {
  return searchContent(query);
}

export async function searchByType(query: string, contentType: string): Promise<SearchResult[]> {
  return searchContent(query, { contentType });
}
