// utils/s3.js
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
  // const extension = file.originalname.split('.').pop();
  const s3Key = `${folder}/${uuidv4()}.enc`; 

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: s3Key,
    Body: file.buffer,          // this is the file in memory from multer
    ContentType: 'application/octet-stream', // always octet-stream for encrypted files
  });

  await s3.send(command);
  return s3Key; 
};

const getFileFromS3 = async (s3Key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: s3Key,
  });

  const response = await s3.send(command);

  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

const generateSignedUrl = async (fileUrl) => {
  const bucketUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
  if (!fileUrl.startsWith(bucketUrl)) {
    return fileUrl;
  }

  const key = fileUrl.replace(bucketUrl, '');
  
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
  return signedUrl;
};

export { uploadToS3, generateSignedUrl, getFileFromS3 };