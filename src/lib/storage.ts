import { S3Client } from "@aws-sdk/client-s3"

export const storage = new S3Client({
  credentials: {
    accessKeyId: process.env.STORAGE_ID!,
    secretAccessKey: process.env.STORAGE_SECRET!,
  },
})
