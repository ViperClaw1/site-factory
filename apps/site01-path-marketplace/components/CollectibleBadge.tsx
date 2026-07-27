import { Badge } from "@repo/ui";

export interface CollectibleBadgeProps {
  isCollectible: boolean;
  isBlindBox?: boolean;
}

// Purely derived from product flags — picks the right @repo/ui Badge variant,
// or renders nothing for a regular (non-collectible) product.
export function CollectibleBadge({ isCollectible, isBlindBox }: CollectibleBadgeProps) {
  if (!isCollectible) return null;

  if (isBlindBox) {
    return <Badge variant="blindbox">Blind Box</Badge>;
  }

  return <Badge variant="limited">Limited Edition</Badge>;
}
