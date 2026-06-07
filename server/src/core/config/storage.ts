import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import env from '@/core/config/env.js';

const createClient = (endpoint: string): S3Client =>
    new S3Client({
        endpoint,
        region: env.RUSTFS_REGION,
        credentials: {
            accessKeyId: env.RUSTFS_ACCESS_KEY,
            secretAccessKey: env.RUSTFS_SECRET_KEY
        },
        forcePathStyle: true
    });

let internalClient: S3Client | null = null;
let presignClient: S3Client | null = null;

export const getStorageClient = (): S3Client => {
    if (!internalClient) {
        internalClient = createClient(env.RUSTFS_ENDPOINT);
    }
    return internalClient;
};

/**
 * Client used solely to mint presigned URLs. It is bound to the public-facing
 * endpoint so the signature matches the host that external clients reach,
 * even when the server talks to storage over a private network address.
 */
const getPresignClient = (): S3Client => {
    if (!presignClient) {
        presignClient = createClient(env.RUSTFS_PUBLIC_ENDPOINT ?? env.RUSTFS_ENDPOINT);
    }
    return presignClient;
};

export interface PutObjectInput {
    bucket: string;
    key: string;
    body: Buffer | Uint8Array | string;
    contentType?: string;
}

export const putObject = async (input: PutObjectInput): Promise<void> => {
    const command = new PutObjectCommand({
        Bucket: input.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType
    });
    await getStorageClient().send(command);
};

export const getSignedDownloadUrl = async (
    bucket: string,
    key: string,
    ttlSeconds = 300
): Promise<string> => {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return awsGetSignedUrl(getPresignClient(), command, { expiresIn: ttlSeconds });
};

export const headObject = async (bucket: string, key: string): Promise<boolean> => {
    try {
        await getStorageClient().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        return true;
    } catch {
        return false;
    }
};

export const deleteObject = async (bucket: string, key: string): Promise<void> => {
    await getStorageClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
};
