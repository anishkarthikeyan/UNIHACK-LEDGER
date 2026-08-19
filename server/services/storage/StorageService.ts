// Storage abstraction. Nothing in the route/application layer should ever touch a filesystem,
// S3 SDK, or cloud bucket directly — everything goes through this interface, so swapping the
// local disk implementation for S3/Supabase/Firebase Storage later means writing one new class
// that implements this interface and changing one line in server/services/index.ts. No route,
// controller, or frontend code should need to change.

export interface StoredFile {
  /** Opaque key identifying the file within the storage backend. Never a raw filesystem path —
   *  callers must not assume anything about its shape beyond "pass it back to retrieve/delete". */
  key: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
}

export interface SaveFileInput {
  buffer: Buffer;
  originalName: string;
  contentType: string;
  /** Logical folder, e.g. 'certificates' | 'projects' | 'avatars' — kept separate from `key` so
   *  backends that support prefixes/buckets-per-category can use it directly. */
  category: string;
}

export class StorageValidationError extends Error {}

export interface StorageService {
  /** Persists a file and returns its metadata + key. Throws StorageValidationError for
   *  disallowed content types or files over the configured size limit. */
  save(input: SaveFileInput): Promise<StoredFile>;
  /** Returns a Buffer for the given key, or null if it doesn't exist. */
  read(key: string): Promise<Buffer | null>;
  /** Returns a URL (or path) the frontend can use to preview/download the file. For local
   *  storage this is an API-served path; for a future cloud backend it could be a signed URL. */
  urlFor(key: string): string;
  /** Replaces the file at an existing key with new content, preserving the key. */
  replace(key: string, input: Omit<SaveFileInput, 'category'>): Promise<StoredFile>;
  delete(key: string): Promise<void>;
}

// Content types the Certificate Module (Phase 4) and Project Files need to support, per the
// project spec: PDF, image, DOCX, PPT, ZIP.
export const ALLOWED_UPLOAD_CONTENT_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // legacy .doc
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-powerpoint', // legacy .ppt
  'application/zip',
  'application/x-zip-compressed',
] as const;
