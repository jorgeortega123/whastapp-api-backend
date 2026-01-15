import type {
  Env,
  SendMessageRequest,
  SendMessageResponse,
  OutgoingText,
  OutgoingMedia,
  OutgoingDocument,
  OutgoingLocation,
  OutgoingInteractive,
  OutgoingTemplate,
  OutgoingReaction,
  ContactContent,
  InteractiveButton,
  InteractiveSection,
  ErrorResponse,
  MediaUrlResponse,
} from '../types/whatsapp';

export class WhatsAppClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly phoneNumberId: string;

  constructor(env: Env) {
    this.baseUrl = `${env.WHATSAPP_API_URL}/${env.WHATSAPP_API_VERSION}`;
    this.token = env.WHATSAPP_TOKEN;
    this.phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  }

  private get messagesUrl(): string {
    return `${this.baseUrl}/${this.phoneNumberId}/messages`;
  }

  private get mediaUrl(): string {
    return `${this.baseUrl}/${this.phoneNumberId}/media`;
  }

  private async request<T>(
    url: string,
    method: 'GET' | 'POST' | 'DELETE' = 'POST',
    body?: unknown
  ): Promise<T> {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ErrorResponse;
      throw new WhatsAppAPIError(
        error.error?.message || 'Unknown error',
        error.error?.code || response.status,
        error.error?.error_subcode,
        error.error?.error_data?.details
      );
    }

    return data as T;
  }

  // ============ Send Message Methods ============

  async sendText(
    to: string,
    text: string,
    previewUrl = false,
    replyToMessageId?: string
  ): Promise<SendMessageResponse> {
    const message: SendMessageRequest = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body: text,
        preview_url: previewUrl,
      } as OutgoingText,
    };

    if (replyToMessageId) {
      message.context = { message_id: replyToMessageId };
    }

    return this.request<SendMessageResponse>(this.messagesUrl, 'POST', message);
  }

  async sendImage(
    to: string,
    media: { id?: string; link?: string; caption?: string },
    replyToMessageId?: string
  ): Promise<SendMessageResponse> {
    const message: SendMessageRequest = {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: media as OutgoingMedia,
    };

    if (replyToMessageId) {
      message.context = { message_id: replyToMessageId };
    }

    return this.request<SendMessageResponse>(this.messagesUrl, 'POST', message);
  }

  async sendVideo(
    to: string,
    media: { id?: string; link?: string; caption?: string },
    replyToMessageId?: string
  ): Promise<SendMessageResponse> {
    const message: SendMessageRequest = {
      messaging_product: 'whatsapp',
      to,
      type: 'video',
      video: media as OutgoingMedia,
    };

    if (replyToMessageId) {
      message.context = { message_id: replyToMessageId };
    }

    return this.request<SendMessageResponse>(this.messagesUrl, 'POST', message);
  }

  async sendAudio(
    to: string,
    media: { id?: string; link?: string },
    replyToMessageId?: string
  ): Promise<SendMessageResponse> {
    const message: SendMessageRequest = {
      messaging_product: 'whatsapp',
      to,
      type: 'audio',
      audio: media as OutgoingMedia,
    };

    if (replyToMessageId) {
      message.context = { message_id: replyToMessageId };
    }

    return this.request<SendMessageResponse>(this.messagesUrl, 'POST', message);
  }

  async sendDocument(
    to: string,
    media: { id?: string; link?: string; caption?: string; filename?: string },
    replyToMessageId?: string
  ): Promise<SendMessageResponse> {
    const message: SendMessageRequest = {
      messaging_product: 'whatsapp',
      to,
      type: 'document',
      document: media as OutgoingDocument,
    };

    if (replyToMessageId) {
      message.context = { message_id: replyToMessageId };
    }

    return this.request<SendMessageResponse>(this.messagesUrl, 'POST', message);
  }

  async sendSticker(
    to: string,
    media: { id?: string; link?: string },
    replyToMessageId?: string
  ): Promise<SendMessageResponse> {
    const message: SendMessageRequest = {
      messaging_product: 'whatsapp',
      to,
      type: 'sticker',
      sticker: media,
    };

    if (replyToMessageId) {
      message.context = { message_id: replyToMessageId };
    }

    return this.request<SendMessageResponse>(this.messagesUrl, 'POST', message);
  }

  async sendLocation(
    to: string,
    location: { latitude: number; longitude: number; name?: string; address?: string },
    replyToMessageId?: string
  ): Promise<SendMessageResponse> {
    const message: SendMessageRequest = {
      messaging_product: 'whatsapp',
      to,
      type: 'location',
      location: location as OutgoingLocation,
    };

    if (replyToMessageId) {
      message.context = { message_id: replyToMessageId };
    }

    return this.request<SendMessageResponse>(this.messagesUrl, 'POST', message);
  }

  async sendContacts(
    to: string,
    contacts: ContactContent[],
    replyToMessageId?: string
  ): Promise<SendMessageResponse> {
    const message: SendMessageRequest = {
      messaging_product: 'whatsapp',
      to,
      type: 'contacts',
      contacts,
    };

    if (replyToMessageId) {
      message.context = { message_id: replyToMessageId };
    }

    return this.request<SendMessageResponse>(this.messagesUrl, 'POST', message);
  }

  async sendInteractiveButtons(
    to: string,
    body: string,
    buttons: { id: string; title: string }[],
    options?: {
      header?: {
        type: 'text' | 'image' | 'video' | 'document';
        text?: string;
        image?: OutgoingMedia;
        video?: OutgoingMedia;
        document?: OutgoingDocument;
      };
      footer?: string;
      replyToMessageId?: string;
    }
  ): Promise<SendMessageResponse> {
    const interactive: OutgoingInteractive = {
      type: 'button',
      body: { text: body },
      action: {
        buttons: buttons.map((btn) => ({
          type: 'reply' as const,
          reply: { id: btn.id, title: btn.title },
        })) as InteractiveButton[],
      },
    };

    if (options?.header) {
      interactive.header = options.header;
    }

    if (options?.footer) {
      interactive.footer = { text: options.footer };
    }

    const message: SendMessageRequest = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive,
    };

    if (options?.replyToMessageId) {
      message.context = { message_id: options.replyToMessageId };
    }

    return this.request<SendMessageResponse>(this.messagesUrl, 'POST', message);
  }

  async sendInteractiveList(
    to: string,
    body: string,
    buttonText: string,
    sections: {
      title?: string;
      rows: { id: string; title: string; description?: string }[];
    }[],
    options?: {
      header?: string;
      footer?: string;
      replyToMessageId?: string;
    }
  ): Promise<SendMessageResponse> {
    const interactive: OutgoingInteractive = {
      type: 'list',
      body: { text: body },
      action: {
        button: buttonText,
        sections: sections as InteractiveSection[],
      },
    };

    if (options?.header) {
      interactive.header = { type: 'text', text: options.header };
    }

    if (options?.footer) {
      interactive.footer = { text: options.footer };
    }

    const message: SendMessageRequest = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive,
    };

    if (options?.replyToMessageId) {
      message.context = { message_id: options.replyToMessageId };
    }

    return this.request<SendMessageResponse>(this.messagesUrl, 'POST', message);
  }

  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string,
    components?: OutgoingTemplate['components']
  ): Promise<SendMessageResponse> {
    const template: OutgoingTemplate = {
      name: templateName,
      language: { code: languageCode },
    };

    if (components) {
      template.components = components;
    }

    const message: SendMessageRequest = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template,
    };

    return this.request<SendMessageResponse>(this.messagesUrl, 'POST', message);
  }

  async sendReaction(
    to: string,
    messageId: string,
    emoji: string
  ): Promise<SendMessageResponse> {
    const message: SendMessageRequest = {
      messaging_product: 'whatsapp',
      to,
      type: 'reaction',
      reaction: {
        message_id: messageId,
        emoji,
      } as OutgoingReaction,
    };

    return this.request<SendMessageResponse>(this.messagesUrl, 'POST', message);
  }

  async removeReaction(to: string, messageId: string): Promise<SendMessageResponse> {
    return this.sendReaction(to, messageId, '');
  }

  // ============ Message Status Methods ============

  async markAsRead(messageId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(this.messagesUrl, 'POST', {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    });
  }

  // ============ Media Methods ============

  async getMediaUrl(mediaId: string): Promise<MediaUrlResponse> {
    return this.request<MediaUrlResponse>(
      `${this.baseUrl}/${mediaId}`,
      'GET'
    );
  }

  async downloadMedia(mediaUrl: string): Promise<ArrayBuffer> {
    const response = await fetch(mediaUrl, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new WhatsAppAPIError(
        'Failed to download media',
        response.status
      );
    }

    return response.arrayBuffer();
  }

  async uploadMedia(
    file: ArrayBuffer | Blob,
    mimeType: string,
    filename: string
  ): Promise<{ id: string }> {
    const formData = new FormData();
    const blob = file instanceof Blob ? file : new Blob([file], { type: mimeType });
    formData.append('file', blob, filename);
    formData.append('messaging_product', 'whatsapp');
    formData.append('type', mimeType);

    const response = await fetch(this.mediaUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ErrorResponse;
      throw new WhatsAppAPIError(
        error.error?.message || 'Failed to upload media',
        error.error?.code || response.status
      );
    }

    return data as { id: string };
  }

  async deleteMedia(mediaId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `${this.baseUrl}/${mediaId}`,
      'DELETE'
    );
  }
}

// ============ Custom Error Class ============

export class WhatsAppAPIError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly subcode?: number,
    public readonly details?: string
  ) {
    super(message);
    this.name = 'WhatsAppAPIError';
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      code: this.code,
      subcode: this.subcode,
      details: this.details,
    };
  }
}
