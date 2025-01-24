import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const BUCKET_NAME = import.meta.env.VITE_S3_BUCKET;
const REGION = import.meta.env.VITE_AWS_REGION;

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
  maxAttempts: 3,
});

export const uploadToS3 = async (
  file: File,
  key: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file size (max 100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 100MB limit');
    }

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: file.type
      },
      queueSize: 1, // Reduce concurrent uploads
      partSize: 10 * 1024 * 1024, // Increased part size to reduce number of parts
      leavePartsOnError: false,
      tags: [{ Key: 'source', Value: 'gametape-portal' }]
    });

    upload.on('httpUploadProgress', (progress) => {
      if (progress.loaded && progress.total) {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        onProgress?.(percentage);
      }
    });

    await upload.done();

    const url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
    return url;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('S3 Upload Error:', {
      message: errorMessage,
      bucket: BUCKET_NAME,
      region: REGION,
      fileType: file?.type,
      fileSize: file?.size
    });
    
    // Provide more specific error messages
    if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
      throw new Error('Network error: Please check your internet connection and try again');
    } else if (errorMessage.includes('Access Denied')) {
      throw new Error('Access denied: Please check your S3 bucket permissions');
    } else {
      throw new Error(`Upload failed: ${errorMessage}`);
    }
  }
};