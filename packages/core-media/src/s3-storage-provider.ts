import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import type { StorageProvider } from "./storage-provider";

export interface S3StorageConfig {
  endpoint: string;
  port: number;
  useSSL: boolean;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region?: string;
}

/**
 * Works against MinIO today and against AWS S3 / Cloudflare R2 later with
 * only this config changing (ARCHITECTURE.md madde 13) — nothing above this
 * class knows it's talking to MinIO specifically.
 */
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly baseUrl: string;

  constructor(private readonly config: S3StorageConfig) {
    this.bucket = config.bucket;
    const protocol = config.useSSL ? "https" : "http";
    this.baseUrl = `${protocol}://${config.endpoint}:${config.port}`;

    this.client = new S3Client({
      endpoint: this.baseUrl,
      region: config.region ?? "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      } catch (createError) {
        const code = (createError as { name?: string }).name;
        if (code !== "BucketAlreadyOwnedByYou" && code !== "BucketAlreadyExists") {
          throw createError;
        }
      }
    }

    await this.client.send(
      new PutBucketPolicyCommand({
        Bucket: this.bucket,
        Policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: "*",
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        }),
      }),
    );
  }

  async putObject(params: { key: string; body: Buffer; contentType: string }): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
      }),
    );
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/${this.bucket}/${encodeURIComponent(key)}`;
  }
}
