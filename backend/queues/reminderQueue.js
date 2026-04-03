import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { sendPushNotification } from '../utils/notifications.js';
import { pool } from '../connection.js';

// Connection to Redis
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // required by bullmq
});

// The queue — this is where jobs get added
export const reminderQueue = new Queue('reminders', { connection });

// The worker — this is what processes jobs when they fire
const worker = new Worker('reminders', async (job) => {
  const { reminderId, userId, documentId, title, message } = job.data;

  try {
    // 1. Get the user's device token from DB
    const tokenResult = await pool.query(
      'SELECT token FROM device_tokens WHERE user_id = $1',
      [userId]
    );

    if (tokenResult.rows.length === 0) {
      console.log(`No device token for user ${userId}`);
      return;
    }

    // 2. Send the push notification
    await sendPushNotification({
      token: tokenResult.rows[0].token,
      title,
      message,
    });

    // 3. Mark reminder as sent in DB
    await pool.query(
      'UPDATE reminders SET status = $1 WHERE id = $2',
      ['sent', reminderId]
    );

    console.log(`Reminder ${reminderId} sent successfully`);

  } catch (err) {
    console.error(`Reminder ${reminderId} failed:`, err);
    throw err; // throwing causes Bull to retry automatically
  }

}, { connection });

// Log failed jobs
worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});