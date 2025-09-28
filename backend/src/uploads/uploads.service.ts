import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3 } from 'aws-sdk';

@Injectable()
export class UploadsService {
  private s3: S3;

  constructor(private prisma: PrismaService) {
    this.s3 = new S3({
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
      region: process.env.S3_REGION,
    });
  }

  async uploadFile(file: Express.Multer.File, tenantId: string) {
    const filename = `${tenantId}/${Date.now()}-${file.originalname}`;
    
    const uploadResult = await this.s3.upload({
      Bucket: process.env.S3_BUCKET,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private',
    }).promise();

    // Save upload record
    const upload = await this.prisma.upload.create({
      data: {
        tenantId,
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: uploadResult.Location,
      },
    });

    return upload;
  }

  async getUploadUrl(id: string, tenantId: string) {
    const upload = await this.prisma.upload.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!upload) {
      throw new Error('Upload not found');
    }

    // Generate signed URL for private access
    const signedUrl = this.s3.getSignedUrl('getObject', {
      Bucket: process.env.S3_BUCKET,
      Key: upload.filename,
      Expires: 3600, // 1 hour
    });

    return {
      ...upload,
      signedUrl,
    };
  }

  async deleteUpload(id: string, tenantId: string) {
    const upload = await this.prisma.upload.findFirst({
      where: { id, tenantId },
    });

    if (!upload) {
      throw new Error('Upload not found');
    }

    // Delete from S3
    await this.s3.deleteObject({
      Bucket: process.env.S3_BUCKET,
      Key: upload.filename,
    }).promise();

    // Delete from database
    return this.prisma.upload.delete({
      where: { id },
    });
  }
}