import { randomUUID } from 'crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'fs/promises';
import path from 'path';
import { config } from '../../config/env';
import { logger } from '../../lib/logger';
import { ALLOWED_UPLOAD_CONTENT_TYPES, SaveFileInput, StorageService, StoredFile, StorageValidationError } from './StorageService';

// Local-disk implementation of StorageService, per Phase 1.5 Part 4: "Use LOCAL STORAGE as the
// implementation... Future providers should be swappable without changing application logic."
// Files live under STORAGE_DIR/<category>/<uuid>-<originalName>. The `key` returned to callers
// is the path relative to STORAGE_DIR — treat it as opaque; don't build filesystem paths from it
// outside this class.
export class LocalStorageService implements StorageService {
  private readonly root: string;

  constructor(root: string = config.storage.dir) {
    this.root = path.resolve(root);
  }

  private resolveKey(key: string): string {
    const resolved = path.resolve(this.root, key);
    // Reject path traversal — a key must resolve to somewhere inside the storage root.
    if (!resolved.startsWith(this.root + path.sep) && resolved !== this.root) {
      throw new StorageValidationError('Invalid storage key.');
    }
    return resolved;
  }

  private validate(contentType: string, sizeBytes: number) {
    if (!ALLOWED_UPLOAD_CONTENT_TYPES.includes(contentType as (typeof ALLOWED_UPLOAD_CONTENT_TYPES)[number])) {
      throw new StorageValidationError(`Unsupported file type: ${contentType}. Allowed: PDF, image, DOCX, PPT, ZIP.`);
    }
    if (sizeBytes > config.storage.maxFileSizeBytes) {
      throw new StorageValidationError(`File exceeds the ${config.storage.maxFileSizeBytes / (1024 * 1024)}MB limit.`);
    }
    if (sizeBytes <= 0) {
      throw new StorageValidationError('File is empty.');
    }
  }

  async save({ buffer, originalName, contentType, category }: SaveFileInput): Promise<StoredFile> {
    this.validate(contentType, buffer.byteLength);
    const safeCategory = category.replace(/[^a-z0-9_-]/gi, '') || 'misc';
    const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(-150);
    const key = path.join(safeCategory, `${randomUUID()}-${safeName}`);
    const fullPath = this.resolveKey(key);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, buffer);
    logger.debug({ key, sizeBytes: buffer.byteLength }, 'Stored file locally');
    return { key, originalName, contentType, sizeBytes: buffer.byteLength };
  }

  async read(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.resolveKey(key));
    } catch (err: any) {
      if (err?.code === 'ENOENT') return null;
      throw err;
    }
  }

  urlFor(key: string): string {
    // Served by the /files/:key route (added alongside the file-upload feature in Phase 3).
    // Kept as a plain path here — same contract a cloud backend's signed URL would satisfy.
    return `/files/${encodeURIComponent(key)}`;
  }

  async replace(key: string, input: Omit<SaveFileInput, 'category'>): Promise<StoredFile> {
    this.validate(input.contentType, input.buffer.byteLength);
    const fullPath = this.resolveKey(key);
    const exists = await stat(fullPath).catch(() => null);
    if (!exists) throw new StorageValidationError('Cannot replace a file that does not exist.');
    await writeFile(fullPath, input.buffer);
    return { key, originalName: input.originalName, contentType: input.contentType, sizeBytes: input.buffer.byteLength };
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolveKey(key), { force: true });
  }
}
