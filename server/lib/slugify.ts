// Moved verbatim from the original monolithic server/index.ts — behavior is unchanged.
export function slugify(value: string) {
  return `${value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`;
}
