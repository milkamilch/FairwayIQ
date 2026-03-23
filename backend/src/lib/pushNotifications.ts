import Expo, { ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPush(tokens: string[], title: string, body: string, data?: Record<string, unknown>) {
  const messages: ExpoPushMessage[] = tokens
    .filter((t) => Expo.isExpoPushToken(t))
    .map((to) => ({ to, title, body, data, sound: 'default' }));

  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      console.error('Push error:', err);
    }
  }
}
