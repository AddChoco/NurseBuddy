export const PLACEHOLDER_PREFIX = '[PLACEHOLDER — Awaiting facility guideline document]';

const PLACEHOLDER_LIST_ITEM = `${PLACEHOLDER_PREFIX}. Pending facility document.`;

export function placeholderInstruction(section: string): string {
  return `${PLACEHOLDER_PREFIX}: ${section}. Use general nursing documentation standards until replaced.`;
}

export function placeholderDescription(guidelineName: string): string {
  return `${PLACEHOLDER_PREFIX}: ${guidelineName} facility guideline description pending.`;
}

export function placeholderListItem(): string {
  return PLACEHOLDER_LIST_ITEM;
}

export function isPlaceholderContent(content: string): boolean {
  return content.startsWith(PLACEHOLDER_PREFIX);
}

export function isPlaceholderListItem(item: string): boolean {
  return item.startsWith(PLACEHOLDER_PREFIX);
}

export function filterPlaceholderItems(items: string[]): string[] {
  return items.filter((item) => !isPlaceholderListItem(item));
}

export function formatItemList(items: string[], emptyMessage: string): string {
  const filtered = filterPlaceholderItems(items);
  return filtered.length > 0
    ? filtered.map((item) => `- ${item}`).join('\n')
    : `- ${emptyMessage}`;
}
