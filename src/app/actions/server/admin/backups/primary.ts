"use server"

import { Logger } from '@/lib/logger';
import { srv_authAdminUser } from '@/lib/useUser';
import { S3 } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3({
  region: process.env.AWS_REGION!,
  endpoint: "https://s3.us-east-va.io.cloud.ovh.us",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for non-AWS S3 services
});

export interface S3BackupFile {
  key: string;
  lastModified: Date;
  size: number;
  downloadUrl?: string;
}

export async function srv_listBackups(prefix: string = 'appliedtrack', maxFiles: number = 50): Promise<{
  success: boolean;
  data?: S3BackupFile[];
  error?: string;
}> {
  try {
    const authAdminUser = await srv_authAdminUser();
    if (!authAdminUser) {
      await Logger.warning('Non-admin user attempted to list backups', {
        error: "Forbidden"
      });
      throw new Error('Forbidden');
    }

    const response = await s3.listObjectsV2({
      Bucket: process.env.AWS_BUCKET_NAME!,
      MaxKeys: maxFiles
    });
    console.log(response.Contents)
    const backups = response.Contents
      ?.filter(obj => obj.Key?.endsWith('.sql.gz'))
      .map(obj => ({
        key: obj.Key!,
        lastModified: obj.LastModified!,
        size: obj.Size!
      }))
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()) || [];

    await Logger.info('Successfully listed backup files', {
      count: backups.length,
      prefix
    });

    return {
      success: true,
      data: backups
    };

  } catch (error) {
    await Logger.error('Error listing backup files', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      success: false,
      error: 'Failed to list backup files'
    };
  }
}

export async function srv_getBackupDownloadUrl(key: string): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    const authAdminUser = await srv_authAdminUser();
    if (!authAdminUser) {
      await Logger.warning('Non-admin user attempted to get backup download URL', {
        error: "Forbidden",
        key
      });
      throw new Error('Forbidden');
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    await Logger.info('Generated backup download URL', {
      key,
    });

    return {
      success: true,
      url
    };

  } catch (error) {
    await Logger.error('Error generating backup download URL', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      key
    });

    return {
      success: false,
      error: 'Failed to generate download URL'
    };
  }
}
