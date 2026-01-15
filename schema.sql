-- WhatsApp Messages Database Schema

-- Contacts table: stores information about WhatsApp contacts
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wa_id TEXT UNIQUE NOT NULL,
  name TEXT,
  phone_number TEXT,
  first_seen_at TEXT DEFAULT (datetime('now')),
  last_message_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Messages table: stores all incoming and outgoing messages
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wa_message_id TEXT UNIQUE NOT NULL,
  contact_id INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  type TEXT NOT NULL,
  content TEXT,
  media_id TEXT,
  media_url TEXT,
  media_mime_type TEXT,
  media_filename TEXT,
  caption TEXT,
  latitude REAL,
  longitude REAL,
  location_name TEXT,
  location_address TEXT,
  reply_to_message_id TEXT,
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'sent', 'delivered', 'read', 'failed')),
  timestamp TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

-- Message statuses table: tracks status changes for outgoing messages
CREATE TABLE IF NOT EXISTS message_statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wa_message_id TEXT NOT NULL,
  status TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  error_code INTEGER,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Conversations table: tracks conversation windows for billing
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wa_conversation_id TEXT UNIQUE NOT NULL,
  contact_id INTEGER NOT NULL,
  origin_type TEXT NOT NULL,
  started_at TEXT NOT NULL,
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

-- Interactive responses table: stores button/list selections
CREATE TABLE IF NOT EXISTS interactive_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  response_type TEXT NOT NULL CHECK (response_type IN ('button_reply', 'list_reply')),
  response_id TEXT NOT NULL,
  response_title TEXT NOT NULL,
  response_description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (message_id) REFERENCES messages(id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_contacts_wa_id ON contacts(wa_id);
CREATE INDEX IF NOT EXISTS idx_message_statuses_wa_message_id ON message_statuses(wa_message_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact_id ON conversations(contact_id);
