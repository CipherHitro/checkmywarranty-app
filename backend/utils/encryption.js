import crypto from 'crypto';
import { configDotenv } from 'dotenv';
configDotenv();

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

// Generate your key once and put it in .env:
// node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

const encryptBuffer = (buffer) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return {
    encrypted,
    iv: iv.toString('hex'),
  };
};

const decryptBuffer = (encryptedBuffer, ivHex) => {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
};

export { encryptBuffer, decryptBuffer };