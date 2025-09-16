import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const generateCsvEntityId = (name: string, type: string, parentId?: string, index?: number): string => {
  const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'unknown';
  // Using a combination of parent, type, slug, and index for more uniqueness.
  // Adding a small random string to further reduce collision likelihood if names are very similar.
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  let baseId = `${type}-${slug}`;
  if (parentId) {
    baseId = `${parentId}_${baseId}`;
  }
  if (index !== undefined) {
    baseId = `${baseId}-${index}`;
  }
  return `${baseId}-${randomSuffix}`;
};
