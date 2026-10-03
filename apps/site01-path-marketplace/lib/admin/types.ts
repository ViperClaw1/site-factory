import type { ProductStatus } from "@repo/types";

export interface AdminProductRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: number;
  status: ProductStatus;
  stock: number;
  mediaCount: number;
  thumbUrl: string | null;
  updatedAt: string;
}

export interface AdminStats {
  total: number;
  byStatus: Record<ProductStatus, number>;
  byCategory: Record<string, number>;
}

export const ADMIN_PAGE_SIZE = 50;

export type UploadPhase = "queued" | "uploading" | "processing" | "done" | "error";
