export interface Site {
  id: string;
  slug: string;
  domain: string;
  name: string;
  theme: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  site: string;
  slug: string;
  title: string;
  seo_title?: string;
  seo_description?: string;
  seo_image?: string;
  blocks: Block[];
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: string;
  page: string;
  type: string;
  sort: number;
  data: Record<string, unknown>;
}

// Editorial CMS entries for catalog browsing (collections/characters pages).
// Actual products live in Supabase — these just carry the story/imagery Directus authors edit.
export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  hero_image: string | null;
  series: string | null;
  status: "draft" | "published";
}

export interface Character {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  status: "draft" | "published";
}
