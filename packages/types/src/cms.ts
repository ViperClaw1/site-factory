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
