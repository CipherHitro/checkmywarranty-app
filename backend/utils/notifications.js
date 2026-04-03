import admin from 'firebase-admin';

// Initialize Firebase once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }),
  });
}

export const sendPushNotification = async ({ token, title, message }) => {
  if (!token) {
    console.warn("No token provided for push notification.");
    return;
  }

  const payload = {
    token, // This is now the native FCM or APNs token
    notification: { title, body: message },
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default' } } },
  };

  try {
    await admin.messaging().send(payload);
    console.log('Firebase Push API Response: Success');
  } catch (error) {
    console.error('Error sending push notification via Firebase:', error);
    throw error;
  }
};