export interface StorageProvider {
  /** Idempotent — creates the bucket and its public-read policy if missing. */
  ensureBucket(): Promise<void>;
  putObject(params: { key: string; body: Buffer; contentType: string }): Promise<void>;
  deleteObject(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
