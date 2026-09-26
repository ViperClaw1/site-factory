import "server-only";

import { decode } from "blurhash";

// Blurhash → tiny inline BMP data URL for next/image's `blurDataURL`.
// Decoded on the server so no blurhash code ships to the browser and SSR and
// hydration render the identical placeholder. 8×8 is enough: next/image
// scales it up behind a blur filter, and it keeps each URL ~350 bytes.
const SIZE = 8;

export function blurhashToDataUrl(hash: string | undefined | null): string | undefined {
  if (!hash) return undefined;
  try {
    const rgba = decode(hash, SIZE, SIZE);

    // 24-bit BMP: 54-byte header + bottom-up BGR rows (8×3 = 24 bytes, already 4-aligned).
    const rowBytes = SIZE * 3;
    const pixelBytes = rowBytes * SIZE;
    const buf = Buffer.alloc(54 + pixelBytes);
    buf.write("BM", 0, "ascii");
    buf.writeUInt32LE(54 + pixelBytes, 2); // file size
    buf.writeUInt32LE(54, 10); // pixel data offset
    buf.writeUInt32LE(40, 14); // DIB header size
    buf.writeInt32LE(SIZE, 18); // width
    buf.writeInt32LE(SIZE, 22); // height (positive → bottom-up)
    buf.writeUInt16LE(1, 26); // color planes
    buf.writeUInt16LE(24, 28); // bits per pixel
    buf.writeUInt32LE(pixelBytes, 34); // image size

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const src = (y * SIZE + x) * 4;
        const dst = 54 + (SIZE - 1 - y) * rowBytes + x * 3;
        buf[dst] = rgba[src + 2]!; // B
        buf[dst + 1] = rgba[src + 1]!; // G
        buf[dst + 2] = rgba[src]!; // R
      }
    }
    return `data:image/bmp;base64,${buf.toString("base64")}`;
  } catch {
    return undefined; // malformed hash → just no placeholder
  }
}
