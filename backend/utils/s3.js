// utils/s3.js
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { configDotenv } from 'dotenv';
configDotenv();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = async (file, folder = 'uploads') => {
  const extension = file.originalname.split('.').pop();
  const key = `${folder}/${uuidv4()}.${extension}`;  // e.g. receipts/abc-123.jpg

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,          // this is the file in memory from multer
    ContentType: file.mimetype, // image/jpeg, application/pdf, etc.
  });

  await s3.send(command);

  // This is the permanent URL you save in your DB
  const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  return url;
};

export { uploadToS3 };