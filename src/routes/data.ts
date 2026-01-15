import { Hono } from 'hono';
import type { Env } from '../types/whatsapp';
import { DatabaseService } from '../lib/database';

const data = new Hono<{ Bindings: Env }>();

// GET /data/stats - Get overall statistics
data.get('/stats', async (c) => {
  try {
    const db = new DatabaseService(c.env.DB);
    const stats = await db.getStats();
    return c.json({ success: true, data: stats });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// GET /data/contacts - Get all contacts
data.get('/contacts', async (c) => {
  try {
    const db = new DatabaseService(c.env.DB);
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const contacts = await db.getAllContacts(limit, offset);
    return c.json({ success: true, data: contacts });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// GET /data/contacts/:waId - Get a specific contact
data.get('/contacts/:waId', async (c) => {
  try {
    const db = new DatabaseService(c.env.DB);
    const waId = c.req.param('waId');

    const contact = await db.getContact(waId);
    if (!contact) {
      return c.json({ success: false, error: 'Contact not found' }, 404);
    }
    return c.json({ success: true, data: contact });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// GET /data/messages - Get messages with filters
data.get('/messages', async (c) => {
  try {
    const db = new DatabaseService(c.env.DB);

    const options = {
      contactWaId: c.req.query('contact') || undefined,
      direction: c.req.query('direction') as 'incoming' | 'outgoing' | undefined,
      type: c.req.query('type') || undefined,
      limit: parseInt(c.req.query('limit') || '50'),
      offset: parseInt(c.req.query('offset') || '0'),
      startDate: c.req.query('start_date') || undefined,
      endDate: c.req.query('end_date') || undefined,
    };

    const messages = await db.getMessages(options);
    return c.json({ success: true, data: messages });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// GET /data/messages/:waMessageId - Get a specific message
data.get('/messages/:waMessageId', async (c) => {
  try {
    const db = new DatabaseService(c.env.DB);
    const waMessageId = c.req.param('waMessageId');

    const message = await db.getMessage(waMessageId);
    if (!message) {
      return c.json({ success: false, error: 'Message not found' }, 404);
    }
    return c.json({ success: true, data: message });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// GET /data/conversations/:waId - Get conversation history with a contact
data.get('/conversations/:waId', async (c) => {
  try {
    const db = new DatabaseService(c.env.DB);
    const waId = c.req.param('waId');
    const limit = parseInt(c.req.query('limit') || '50');

    const messages = await db.getConversation(waId, limit);
    return c.json({ success: true, data: messages });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export { data };
