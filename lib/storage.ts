import "server-only";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env, hasStorageConfig } from "@/lib/env";

const getStorageClient = () => {
  if (!hasStorageConfig()) {
    return null;
  }

  return new S3Client({
    region: env.bucketRegion,
    endpoint: env.bucketEndpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.bucketAccessKeyId!,
      secretAccessKey: env.bucketSecretAccessKey!,
    },
  });
};

const getStorageContext = () => {
  const client = getStorageClient();

  if (!client || !env.bucketName) {
    throw new Error("Railway bucket -asetukset puuttuvat.");
  }

  return {
    client,
    bucketName: env.bucketName,
  };
};

export const buildAttachmentKey = (userId: string, fileName: string) => {
  const safeName = fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const extension = safeName.includes(".") ? safeName.slice(safeName.lastIndexOf(".")) : "";

  return `jobs/${new Date().toISOString().slice(0, 10)}/${userId}/${crypto.randomUUID()}${extension}`;
};

export const createSignedUploadUrl = async (key: string, contentType: string) => {
  const { client, bucketName } = getStorageContext();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: 60 * 5 });
};

export const getStoredObject = async (key: string) => {
  const { client, bucketName } = getStorageContext();

  return client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
  );
};
