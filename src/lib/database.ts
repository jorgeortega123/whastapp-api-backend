import type { IncomingMessage, MessageStatus, WebhookContact, Conversation } from '../types/whatsapp';

// Database record types
export interface ContactRecord {
  id: number;
  wa_id: string;
  name: string | null;
  phone_number: string | null;
  first_seen_at: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: number;
  wa_message_id: string;
  contact_id: number;
  direction: 'incoming' | 'outgoing';
  type: string;
  content: string | null;
  media_id: string | null;
  media_url: string | null;
  media_mime_type: string | null;
  media_filename: string | null;
  caption: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  location_address: string | null;
  reply_to_message_id: string | null;
  status: 'received' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  created_at: string;
}

export interface MessageWithContact extends MessageRecord {
  contact_name: string | null;
  contact_wa_id: string;
}

export class DatabaseService {
  constructor(private db: D1Database) {}

  // ============ Contact Methods ============

  async findOrCreateContact(waId: string, name?: string): Promise<ContactRecord> {
    // Try to find existing contact
    const existing = await this.db
      .prepare('SELECT * FROM contacts WHERE wa_id = ?')
      .bind(waId)
      .first<ContactRecord>();

    if (existing) {
      // Update name and last_message_at if contact exists
      await this.db
        .prepare(
          `UPDATE contacts
           SET name = COALESCE(?, name),
               last_message_at = datetime('now'),
               updated_at = datetime('now')
           WHERE wa_id = ?`
        )
        .bind(name || null, waId)
        .run();

      return { ...existing, name: name || existing.name };
    }

    // Create new contact
    const result = await this.db
      .prepare(
        `INSERT INTO contacts (wa_id, name, phone_number)
         VALUES (?, ?, ?)
         RETURNING *`
      )
      .bind(waId, name || null, waId)
      .first<ContactRecord>();

    return result!;
  }

  async getContact(waId: string): Promise<ContactRecord | null> {
    return this.db
      .prepare('SELECT * FROM contacts WHERE wa_id = ?')
      .bind(waId)
      .first<ContactRecord>();
  }

  async getAllContacts(limit = 50, offset = 0): Promise<ContactRecord[]> {
    const result = await this.db
      .prepare(
        `SELECT * FROM contacts
         ORDER BY last_message_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(limit, offset)
      .all<ContactRecord>();

    return result.results;
  }

  // ============ Message Methods ============

  async saveIncomingMessage(
    message: IncomingMessage,
    contact: WebhookContact | undefined
  ): Promise<MessageRecord> {
    // Find or create contact
    const contactRecord = await this.findOrCreateContact(
      message.from,
      contact?.profile?.name
    );

    // Extract message content based on type
    let content: string | null = null;
    let mediaId: string | null = null;
    let mediaMimeType: string | null = null;
    let mediaFilename: string | null = null;
    let caption: string | null = null;
    let latitude: number | null = null;
    let longitude: number | null = null;
    let locationName: string | null = null;
    let locationAddress: string | null = null;

    switch (message.type) {
      case 'text':
        content = message.text?.body || null;
        break;
      case 'image':
        mediaId = message.image?.id || null;
        mediaMimeType = message.image?.mime_type || null;
        caption = message.image?.caption || null;
        break;
      case 'video':
        mediaId = message.video?.id || null;
        mediaMimeType = message.video?.mime_type || null;
        caption = message.video?.caption || null;
        break;
      case 'audio':
        mediaId = message.audio?.id || null;
        mediaMimeType = message.audio?.mime_type || null;
        break;
      case 'document':
        mediaId = message.document?.id || null;
        mediaMimeType = message.document?.mime_type || null;
        mediaFilename = message.document?.filename || null;
        caption = message.document?.caption || null;
        break;
      case 'sticker':
        mediaId = message.sticker?.id || null;
        mediaMimeType = message.sticker?.mime_type || null;
        break;
      case 'location':
        latitude = message.location?.latitude || null;
        longitude = message.location?.longitude || null;
        locationName = message.location?.name || null;
        locationAddress = message.location?.address || null;
        break;
      case 'interactive':
        if (message.interactive?.type === 'button_reply') {
          content = JSON.stringify(message.interactive.button_reply);
        } else if (message.interactive?.type === 'list_reply') {
          content = JSON.stringify(message.interactive.list_reply);
        }
        break;
      case 'button':
        content = message.button?.text || null;
        break;
      case 'contacts':
        content = JSON.stringify(message.contacts);
        break;
      default:
        content = JSON.stringify(message);
    }

    // Convert Unix timestamp to ISO string
    const timestamp = new Date(parseInt(message.timestamp) * 1000).toISOString();

    // Insert message
    const result = await this.db
      .prepare(
        `INSERT INTO messages (
          wa_message_id, contact_id, direction, type, content,
          media_id, media_mime_type, media_filename, caption,
          latitude, longitude, location_name, location_address,
          reply_to_message_id, status, timestamp
        ) VALUES (?, ?, 'incoming', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?)
        RETURNING *`
      )
      .bind(
        message.id,
        contactRecord.id,
        message.type,
        content,
        mediaId,
        mediaMimeType,
        mediaFilename,
        caption,
        latitude,
        longitude,
        locationName,
        locationAddress,
        message.context?.id || null,
        timestamp
      )
      .first<MessageRecord>();

    // Save interactive response if applicable
    if (message.type === 'interactive' && message.interactive && result) {
      const responseType = message.interactive.type;
      const response =
        responseType === 'button_reply'
          ? message.interactive.button_reply
          : message.interactive.list_reply;

      if (response) {
        await this.db
          .prepare(
            `INSERT INTO interactive_responses (message_id, response_type, response_id, response_title, response_description)
             VALUES (?, ?, ?, ?, ?)`
          )
          .bind(
            result.id,
            responseType,
            response.id,
            response.title,
            'description' in response ? response.description : null
          )
          .run();
      }
    }

    return result!;
  }

  async saveOutgoingMessage(
    waMessageId: string,
    to: string,
    type: string,
    content: string | null,
    options?: {
      mediaId?: string;
      caption?: string;
      filename?: string;
      latitude?: number;
      longitude?: number;
      locationName?: string;
      locationAddress?: string;
      replyToMessageId?: string;
    }
  ): Promise<MessageRecord> {
    const contactRecord = await this.findOrCreateContact(to);

    const result = await this.db
      .prepare(
        `INSERT INTO messages (
          wa_message_id, contact_id, direction, type, content,
          media_id, caption, latitude, longitude, location_name, location_address,
          reply_to_message_id, status, timestamp
        ) VALUES (?, ?, 'outgoing', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', datetime('now'))
        RETURNING *`
      )
      .bind(
        waMessageId,
        contactRecord.id,
        type,
        content,
        options?.mediaId || null,
        options?.caption || null,
        options?.latitude || null,
        options?.longitude || null,
        options?.locationName || null,
        options?.locationAddress || null,
        options?.replyToMessageId || null
      )
      .first<MessageRecord>();

    return result!;
  }

  async updateMessageStatus(status: MessageStatus): Promise<void> {
    const timestamp = new Date(parseInt(status.timestamp) * 1000).toISOString();

    // Update message status
    await this.db
      .prepare('UPDATE messages SET status = ? WHERE wa_message_id = ?')
      .bind(status.status, status.id)
      .run();

    // Log status change
    const errorCode = status.errors?.[0]?.code || null;
    const errorMessage = status.errors?.[0]?.message || null;

    await this.db
      .prepare(
        `INSERT INTO message_statuses (wa_message_id, status, timestamp, error_code, error_message)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(status.id, status.status, timestamp, errorCode, errorMessage)
      .run();

    // Save conversation info if present
    if (status.conversation) {
      const contact = await this.db
        .prepare(
          'SELECT c.id FROM contacts c JOIN messages m ON m.contact_id = c.id WHERE m.wa_message_id = ?'
        )
        .bind(status.id)
        .first<{ id: number }>();

      if (contact) {
        await this.db
          .prepare(
            `INSERT OR IGNORE INTO conversations (wa_conversation_id, contact_id, origin_type, started_at, expires_at)
             VALUES (?, ?, ?, datetime('now'), ?)`
          )
          .bind(
            status.conversation.id,
            contact.id,
            status.conversation.origin.type,
            status.conversation.expiration_timestamp || null
          )
          .run();
      }
    }
  }

  async getMessages(options: {
    contactWaId?: string;
    direction?: 'incoming' | 'outgoing';
    type?: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<MessageWithContact[]> {
    const { contactWaId, direction, type, limit = 50, offset = 0, startDate, endDate } = options;

    let query = `
      SELECT m.*, c.name as contact_name, c.wa_id as contact_wa_id
      FROM messages m
      JOIN contacts c ON m.contact_id = c.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (contactWaId) {
      query += ' AND c.wa_id = ?';
      params.push(contactWaId);
    }

    if (direction) {
      query += ' AND m.direction = ?';
      params.push(direction);
    }

    if (type) {
      query += ' AND m.type = ?';
      params.push(type);
    }

    if (startDate) {
      query += ' AND m.timestamp >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND m.timestamp <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY m.timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = this.db.prepare(query);
    const result = await stmt.bind(...params).all<MessageWithContact>();

    return result.results;
  }

  async getMessage(waMessageId: string): Promise<MessageWithContact | null> {
    return this.db
      .prepare(
        `SELECT m.*, c.name as contact_name, c.wa_id as contact_wa_id
         FROM messages m
         JOIN contacts c ON m.contact_id = c.id
         WHERE m.wa_message_id = ?`
      )
      .bind(waMessageId)
      .first<MessageWithContact>();
  }

  async getConversation(contactWaId: string, limit = 50): Promise<MessageWithContact[]> {
    const result = await this.db
      .prepare(
        `SELECT m.*, c.name as contact_name, c.wa_id as contact_wa_id
         FROM messages m
         JOIN contacts c ON m.contact_id = c.id
         WHERE c.wa_id = ?
         ORDER BY m.timestamp DESC
         LIMIT ?`
      )
      .bind(contactWaId, limit)
      .all<MessageWithContact>();

    return result.results;
  }

  // ============ Stats Methods ============

  async getStats(): Promise<{
    totalContacts: number;
    totalMessages: number;
    incomingMessages: number;
    outgoingMessages: number;
    messagesByType: { type: string; count: number }[];
  }> {
    const [contacts, messages, incoming, outgoing, byType] = await Promise.all([
      this.db.prepare('SELECT COUNT(*) as count FROM contacts').first<{ count: number }>(),
      this.db.prepare('SELECT COUNT(*) as count FROM messages').first<{ count: number }>(),
      this.db
        .prepare("SELECT COUNT(*) as count FROM messages WHERE direction = 'incoming'")
        .first<{ count: number }>(),
      this.db
        .prepare("SELECT COUNT(*) as count FROM messages WHERE direction = 'outgoing'")
        .first<{ count: number }>(),
      this.db
        .prepare('SELECT type, COUNT(*) as count FROM messages GROUP BY type ORDER BY count DESC')
        .all<{ type: string; count: number }>(),
    ]);

    return {
      totalContacts: contacts?.count || 0,
      totalMessages: messages?.count || 0,
      incomingMessages: incoming?.count || 0,
      outgoingMessages: outgoing?.count || 0,
      messagesByType: byType.results,
    };
  }
}
