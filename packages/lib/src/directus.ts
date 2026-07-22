import { createDirectus, readItems, rest, staticToken } from "@directus/sdk";
import type { Block, Page, Site } from "@repo/types";

export interface DirectusSchema {
  sites: Site[];
  pages: Page[];
  blocks: Block[];
}

export function createDirectusClient(token?: string) {
  const url = process.env.DIRECTUS_URL;
  if (!url) {
    throw new Error("DIRECTUS_URL is not set");
  }

  const client = createDirectus<DirectusSchema>(url).with(rest());
  return token ? client.with(staticToken(token)) : client;
}

export { readItems };
