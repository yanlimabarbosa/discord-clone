export type ReorderChannel = {
  id: string;
  categoryId: string | null;
  position: number;
};

export type ReorderCategory = {
  id: string;
  position: number;
};

export type DropTarget =
  | { type: 'channel'; channelId: string }
  | { type: 'category'; categoryId: string | null };

export type ReorderResult = {
  id: string;
  categoryId: string | null;
  position: number;
};

// Group display order: uncategorized first, then categories by position.
function groupOrder(categories: ReorderCategory[]): (string | null)[] {
  const sorted = [...categories].sort((a, b) => a.position - b.position);
  return [null, ...sorted.map((c) => c.id)];
}

function channelsIn(
  channels: ReorderChannel[],
  categoryId: string | null,
): ReorderChannel[] {
  return channels
    .filter((c) => (c.categoryId ?? null) === categoryId)
    .sort((a, b) => a.position - b.position);
}

// Compute the full new ordering after dragging `draggedId` onto `target`.
// Returns every channel with its new categoryId + position (position is the
// global index across all groups in display order).
export function reorderChannels(
  channels: ReorderChannel[],
  categories: ReorderCategory[],
  draggedId: string,
  target: DropTarget,
): ReorderResult[] {
  const dragged = channels.find((c) => c.id === draggedId);
  if (!dragged) return [];

  const order = groupOrder(categories);
  const groups = new Map<string | null, ReorderChannel[]>();
  for (const g of order) {
    groups.set(
      g,
      channelsIn(channels, g).filter((c) => c.id !== draggedId),
    );
  }

  if (target.type === 'category') {
    const list = groups.get(target.categoryId) ?? [];
    list.push({ ...dragged, categoryId: target.categoryId });
    groups.set(target.categoryId, list);
  } else {
    const targetChannel = channels.find((c) => c.id === target.channelId);
    if (!targetChannel || targetChannel.id === draggedId) {
      // no-op drop; return unchanged flattened order
      return flatten(order, groups, channels);
    }
    const catId = targetChannel.categoryId ?? null;
    const list = groups.get(catId) ?? [];
    const idx = list.findIndex((c) => c.id === target.channelId);
    list.splice(idx, 0, { ...dragged, categoryId: catId });
    groups.set(catId, list);
  }

  return flatten(order, groups, channels);
}

function flatten(
  order: (string | null)[],
  groups: Map<string | null, ReorderChannel[]>,
  original: ReorderChannel[],
): ReorderResult[] {
  const result: ReorderResult[] = [];
  let position = 0;
  for (const g of order) {
    for (const ch of groups.get(g) ?? []) {
      result.push({ id: ch.id, categoryId: g, position });
      position += 1;
    }
  }
  // Include any channels whose category isn't in `order` (safety) unchanged.
  const seen = new Set(result.map((r) => r.id));
  for (const c of original) {
    if (!seen.has(c.id)) {
      result.push({ id: c.id, categoryId: c.categoryId ?? null, position });
      position += 1;
    }
  }
  return result;
}
