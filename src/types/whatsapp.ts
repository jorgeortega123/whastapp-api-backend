// WhatsApp Cloud API Types
// Based on Meta's WhatsApp Business API documentation

// ============ Environment Bindings ============
export interface Env {
  WHATSAPP_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_VERIFY_TOKEN: string;
  WHATSAPP_API_VERSION: string;
  WHATSAPP_API_URL: string;
  API_KEY?: string;
  DB: D1Database;
}

// ============ Webhook Types ============
export interface WebhookVerification {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}

export interface WebhookPayload {
  object: 'whatsapp_business_account';
  entry: WebhookEntry[];
}

export interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

export interface WebhookChange {
  value: WebhookValue;
  field: string;
}

export interface WebhookValue {
  messaging_product: 'whatsapp';
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WebhookContact[];
  messages?: IncomingMessage[];
  statuses?: MessageStatus[];
  errors?: WebhookError[];
}

export interface WebhookContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface WebhookError {
  code: number;
  title: string;
  message: string;
  error_data?: {
    details: string;
  };
}

// ============ Incoming Message Types ============
export interface IncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: MessageType;
  text?: TextContent;
  image?: MediaContent;
  video?: MediaContent;
  audio?: MediaContent;
  document?: DocumentContent;
  sticker?: MediaContent;
  location?: LocationContent;
  contacts?: ContactContent[];
  interactive?: InteractiveResponse;
  button?: ButtonResponse;
  context?: MessageContext;
  referral?: Referral;
}

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contacts'
  | 'interactive'
  | 'button'
  | 'reaction'
  | 'order'
  | 'system'
  | 'unknown';

export interface TextContent {
  body: string;
}

export interface MediaContent {
  id: string;
  mime_type: string;
  sha256?: string;
  caption?: string;
}

export interface DocumentContent extends MediaContent {
  filename?: string;
}

export interface LocationContent {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface ContactContent {
  addresses?: ContactAddress[];
  birthday?: string;
  emails?: ContactEmail[];
  name: ContactName;
  org?: ContactOrg;
  phones?: ContactPhone[];
  urls?: ContactUrl[];
}

export interface ContactAddress {
  city?: string;
  country?: string;
  country_code?: string;
  state?: string;
  street?: string;
  type?: 'HOME' | 'WORK';
  zip?: string;
}

export interface ContactEmail {
  email?: string;
  type?: 'HOME' | 'WORK';
}

export interface ContactName {
  formatted_name: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  suffix?: string;
  prefix?: string;
}

export interface ContactOrg {
  company?: string;
  department?: string;
  title?: string;
}

export interface ContactPhone {
  phone?: string;
  type?: 'CELL' | 'MAIN' | 'IPHONE' | 'HOME' | 'WORK';
  wa_id?: string;
}

export interface ContactUrl {
  url?: string;
  type?: 'HOME' | 'WORK';
}

export interface InteractiveResponse {
  type: 'button_reply' | 'list_reply';
  button_reply?: {
    id: string;
    title: string;
  };
  list_reply?: {
    id: string;
    title: string;
    description?: string;
  };
}

export interface ButtonResponse {
  payload: string;
  text: string;
}

export interface MessageContext {
  from: string;
  id: string;
  forwarded?: boolean;
  frequently_forwarded?: boolean;
}

export interface Referral {
  source_url: string;
  source_type: 'ad' | 'post';
  source_id: string;
  headline?: string;
  body?: string;
  media_type?: 'image' | 'video';
  image_url?: string;
  video_url?: string;
  thumbnail_url?: string;
}

// ============ Message Status Types ============
export interface MessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  conversation?: Conversation;
  pricing?: Pricing;
  errors?: WebhookError[];
}

export interface Conversation {
  id: string;
  origin: {
    type: 'business_initiated' | 'user_initiated' | 'referral_conversion';
  };
  expiration_timestamp?: string;
}

export interface Pricing {
  billable: boolean;
  pricing_model: 'CBP';
  category: 'business_initiated' | 'user_initiated' | 'referral_conversion';
}

// ============ Outgoing Message Types ============
export interface SendMessageRequest {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
  type: OutgoingMessageType;
  context?: {
    message_id: string;
  };
  text?: OutgoingText;
  image?: OutgoingMedia;
  video?: OutgoingMedia;
  audio?: OutgoingMedia;
  document?: OutgoingDocument;
  sticker?: OutgoingSticker;
  location?: OutgoingLocation;
  contacts?: ContactContent[];
  interactive?: OutgoingInteractive;
  template?: OutgoingTemplate;
  reaction?: OutgoingReaction;
}

export type OutgoingMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contacts'
  | 'interactive'
  | 'template'
  | 'reaction';

export interface OutgoingText {
  body: string;
  preview_url?: boolean;
}

export interface OutgoingMedia {
  id?: string;
  link?: string;
  caption?: string;
}

export interface OutgoingDocument extends OutgoingMedia {
  filename?: string;
}

export interface OutgoingSticker {
  id?: string;
  link?: string;
}

export interface OutgoingLocation {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface OutgoingReaction {
  message_id: string;
  emoji: string;
}

// ============ Interactive Message Types ============
export interface OutgoingInteractive {
  type: 'button' | 'list' | 'product' | 'product_list' | 'cta_url' | 'flow';
  header?: InteractiveHeader;
  body: {
    text: string;
  };
  footer?: {
    text: string;
  };
  action: InteractiveAction;
}

export interface InteractiveHeader {
  type: 'text' | 'image' | 'video' | 'document';
  text?: string;
  image?: OutgoingMedia;
  video?: OutgoingMedia;
  document?: OutgoingDocument;
}

export interface InteractiveAction {
  buttons?: InteractiveButton[];
  button?: string;
  sections?: InteractiveSection[];
  catalog_id?: string;
  product_retailer_id?: string;
  name?: string;
  parameters?: FlowParameters;
}

export interface InteractiveButton {
  type: 'reply';
  reply: {
    id: string;
    title: string;
  };
}

export interface InteractiveSection {
  title?: string;
  rows?: InteractiveRow[];
  product_items?: ProductItem[];
}

export interface InteractiveRow {
  id: string;
  title: string;
  description?: string;
}

export interface ProductItem {
  product_retailer_id: string;
}

export interface FlowParameters {
  flow_message_version: string;
  flow_token: string;
  flow_id: string;
  flow_cta: string;
  flow_action: 'navigate' | 'data_exchange';
  flow_action_payload?: {
    screen: string;
    data?: Record<string, unknown>;
  };
}

// ============ Template Message Types ============
export interface OutgoingTemplate {
  name: string;
  language: {
    code: string;
  };
  components?: TemplateComponent[];
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: 'quick_reply' | 'url';
  index?: number;
  parameters?: TemplateParameter[];
}

export interface TemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'video' | 'document' | 'payload';
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
  };
  image?: OutgoingMedia;
  video?: OutgoingMedia;
  document?: OutgoingDocument;
  payload?: string;
}

// ============ API Response Types ============
export interface SendMessageResponse {
  messaging_product: 'whatsapp';
  contacts: {
    input: string;
    wa_id: string;
  }[];
  messages: {
    id: string;
    message_status?: string;
  }[];
}

export interface MediaUploadResponse {
  id: string;
}

export interface MediaUrlResponse {
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
  id: string;
  messaging_product: 'whatsapp';
}

export interface ErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
    error_data?: {
      messaging_product: string;
      details: string;
    };
  };
}

// ============ API Request Types (for your public API) ============
export interface SendTextRequest {
  to: string;
  message: string;
  preview_url?: boolean;
  reply_to?: string;
}

export interface SendTemplateRequest {
  to: string;
  template_name: string;
  language_code: string;
  components?: TemplateComponent[];
}

export interface SendMediaRequest {
  to: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  media_url?: string;
  media_id?: string;
  caption?: string;
  filename?: string;
  reply_to?: string;
}

export interface SendLocationRequest {
  to: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  reply_to?: string;
}

export interface SendContactsRequest {
  to: string;
  contacts: ContactContent[];
  reply_to?: string;
}

export interface SendInteractiveButtonsRequest {
  to: string;
  body: string;
  buttons: {
    id: string;
    title: string;
  }[];
  header?: {
    type: 'text' | 'image' | 'video' | 'document';
    text?: string;
    media_url?: string;
    media_id?: string;
  };
  footer?: string;
  reply_to?: string;
}

export interface SendInteractiveListRequest {
  to: string;
  body: string;
  button_text: string;
  sections: {
    title?: string;
    rows: {
      id: string;
      title: string;
      description?: string;
    }[];
  }[];
  header?: string;
  footer?: string;
  reply_to?: string;
}

export interface SendReactionRequest {
  to: string;
  message_id: string;
  emoji: string;
}

export interface MarkAsReadRequest {
  message_id: string;
}
