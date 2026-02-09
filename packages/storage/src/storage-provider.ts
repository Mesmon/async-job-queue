import type { DownloadUrlOptions, UploadUrlOptions } from "./types.js";

export abstract class StorageProvider {
  /**
   * Generates a pre-signed URL for uploading a file directly from the client.
   * @param path The path (key/blob name) where the file will be stored.
   * @param options Options for the upload URL.
   * @returns An object containing the upload URL and the key/path.
   */
  abstract generateUploadUrl(
    path: string,
    options?: UploadUrlOptions,
  ): Promise<{ uploadUrl: string; key: string }>;

  /**
   * Generates a pre-signed URL for downloading a file.
   * @param path The path (key/blob name) of the file.
   * @param options Options for the download URL.
   * @returns The download URL.
   */
  abstract generateDownloadUrl(path: string, options?: DownloadUrlOptions): Promise<string>;

  /**
   * Uploads data directly to the storage.
   * @param path The path (key/blob name) where the file will be stored.
   * @param body The data to upload.
   * @param options Optional bucket override.
   */
  abstract upload(
    path: string,
    body: Buffer | Uint8Array | string,
    options?: { bucket?: string },
  ): Promise<void>;

  /**
   * Downloads data directly from the storage.
   * @param path The path (key/blob name) of the file.
   * @param options Optional bucket override.
   * @returns The downloaded data as a Buffer.
   */
  abstract download(path: string, options?: { bucket?: string }): Promise<Buffer>;
}
