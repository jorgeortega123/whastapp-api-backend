import { Hono } from 'hono';
import type {
  Env,
  WebhookPayload,
  WebhookValue,
  IncomingMessage,
  MessageStatus,
} from '../types/whatsapp';
import { DatabaseService } from '../lib/database';

const webhook = new Hono<{ Bindings: Env }>();

// GET /webhook - Verification endpoint for Meta
webhook.get('/', (c) => {
  const mode = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token');
  const challenge = c.req.query('hub.challenge');

  if (!mode || !token || !challenge) {
    console.log('Webhook verification failed: Missing parameters');
    return c.text('Missing parameters', 400);
  }

  if (mode === 'subscribe' && token === c.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return c.text(challenge, 200);
  }

  console.log('Webhook verification failed: Invalid token');
  return c.text('Forbidden', 403);
});

// POST /webhook - Receive incoming messages and status updates
webhook.post('/', async (c) => {
  try {
    const payload = await c.req.json<WebhookPayload>();

    if (payload.object !== 'whatsapp_business_account') {
      return c.json({ error: 'Invalid webhook object' }, 400);
    }

    const db = new DatabaseService(c.env.DB);

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          await processMessagesChange(change.value, db);
        }
      }
    }

    return c.text('OK', 200);
  } catch (error) {
    console.error('Webhook processing error:', error);
    return c.text('OK', 200);
  }
});

// Process incoming messages and status updates
async function processMessagesChange(value: WebhookValue, db: DatabaseService): Promise<void> {
  const { metadata, messages, statuses, errors } = value;

  console.log(`Webhook received for phone: ${metadata.display_phone_number}`);

  // Handle incoming messages - SAVE TO DATABASE
  if (messages && messages.length > 0) {
    for (const message of messages) {
      await handleIncomingMessage(message, value, db);
    }
  }

  // Handle status updates - SAVE TO DATABASE
  if (statuses && statuses.length > 0) {
    for (const status of statuses) {
      await handleStatusUpdate(status, db);
    }
  }

  // Handle errors
  if (errors && errors.length > 0) {
    for (const error of errors) {
      console.error('Webhook error:', {
        code: error.code,
        title: error.title,
        message: error.message,
        details: error.error_data?.details,
      });
    }
  }
}

// Handle individual incoming messages
async function handleIncomingMessage(
  message: IncomingMessage,
  webhookValue: WebhookValue,
  db: DatabaseService
): Promise<void> {
  const contact = webhookValue.contacts?.find((c) => c.wa_id === message.from);
  const senderName = contact?.profile?.name || 'Unknown';

  console.log(`Message received from ${senderName} (${message.from}):`, {
    id: message.id,
    type: message.type,
  });

  // SAVE MESSAGE TO DATABASE
  try {
    const savedMessage = await db.saveIncomingMessage(message, contact);
    console.log(`Message saved to database with ID: ${savedMessage.id}`);

    // Log specific content based on type
    switch (message.type) {
      case 'text':
        console.log('Text:', message.text?.body);
        break;
      case 'image':
        console.log('Image received:', message.image?.id);
        break;
      case 'video':
        console.log('Video received:', message.video?.id);
        break;
      case 'audio':
        console.log('Audio received:', message.audio?.id);
        break;
      case 'document':
        console.log('Document:', message.document?.filename);
        break;
      case 'location':
        console.log('Location:', message.location?.name || `${message.location?.latitude}, ${message.location?.longitude}`);
        break;
      case 'interactive':
        if (message.interactive?.type === 'button_reply') {
          console.log('Button clicked:', message.interactive.button_reply?.title);
        } else if (message.interactive?.type === 'list_reply') {
          console.log('List selected:', message.interactive.list_reply?.title);
        }
        break;
      default:
        console.log('Message type:', message.type);
    }
  } catch (error) {
    console.error('Error saving message to database:', error);
  }
}

// Handle message status updates
async function handleStatusUpdate(status: MessageStatus, db: DatabaseService): Promise<void> {
  console.log('Status update:', {
    messageId: status.id,
    status: status.status,
    recipientId: status.recipient_id,
  });

  // SAVE STATUS UPDATE TO DATABASE
  try {
    await db.updateMessageStatus(status);
    console.log(`Status updated in database: ${status.status}`);
  } catch (error) {
    console.error('Error updating status in database:', error);
  }

  // Log delivery errors
  if (status.status === 'failed' && status.errors) {
    for (const error of status.errors) {
      console.error('Delivery failed:', {
        code: error.code,
        title: error.title,
        message: error.message,
      });
    }
  }
}

export { webhook };
