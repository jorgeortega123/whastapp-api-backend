import { Hono } from 'hono';
import { WhatsAppClient, WhatsAppAPIError } from '../lib/whatsapp-client';
import type {
  Env,
  SendTextRequest,
  SendTemplateRequest,
  SendMediaRequest,
  SendLocationRequest,
  SendContactsRequest,
  SendInteractiveButtonsRequest,
  SendInteractiveListRequest,
  SendReactionRequest,
  MarkAsReadRequest,
} from '../types/whatsapp';

const messages = new Hono<{ Bindings: Env }>();

// Helper function to handle WhatsApp API errors
function handleError(error: unknown) {
  if (error instanceof WhatsAppAPIError) {
    return {
      success: false,
      error: error.toJSON(),
    };
  }
  return {
    success: false,
    error: {
      message: error instanceof Error ? error.message : 'Unknown error',
    },
  };
}

// POST /messages/text - Send a text message
messages.post('/text', async (c) => {
  try {
    const body = await c.req.json<SendTextRequest>();
    const client = new WhatsAppClient(c.env);

    if (!body.to || !body.message) {
      return c.json({ success: false, error: 'Missing required fields: to, message' }, 400);
    }

    const response = await client.sendText(
      body.to,
      body.message,
      body.preview_url,
      body.reply_to
    );

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return c.json(errorResponse, 500);
  }
});

// POST /messages/template - Send a template message
messages.post('/template', async (c) => {
  try {
    const body = await c.req.json<SendTemplateRequest>();
    const client = new WhatsAppClient(c.env);

    if (!body.to || !body.template_name || !body.language_code) {
      return c.json(
        { success: false, error: 'Missing required fields: to, template_name, language_code' },
        400
      );
    }

    const response = await client.sendTemplate(
      body.to,
      body.template_name,
      body.language_code,
      body.components
    );

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return c.json(errorResponse, 500);
  }
});

// POST /messages/image - Send an image
messages.post('/image', async (c) => {
  try {
    const body = await c.req.json<SendMediaRequest>();
    const client = new WhatsAppClient(c.env);

    if (!body.to || (!body.media_url && !body.media_id)) {
      return c.json(
        { success: false, error: 'Missing required fields: to, and either media_url or media_id' },
        400
      );
    }

    const response = await client.sendImage(
      body.to,
      {
        link: body.media_url,
        id: body.media_id,
        caption: body.caption,
      },
      body.reply_to
    );

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return c.json(errorResponse, 500);
  }
});

// POST /messages/video - Send a video
messages.post('/video', async (c) => {
  try {
    const body = await c.req.json<SendMediaRequest>();
    const client = new WhatsAppClient(c.env);

    if (!body.to || (!body.media_url && !body.media_id)) {
      return c.json(
        { success: false, error: 'Missing required fields: to, and either media_url or media_id' },
        400
      );
    }

    const response = await client.sendVideo(
      body.to,
      {
        link: body.media_url,
        id: body.media_id,
        caption: body.caption,
      },
      body.reply_to
    );

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return c.json(errorResponse, 500);
  }
});

// POST /messages/audio - Send an audio file
messages.post('/audio', async (c) => {
  try {
    const body = await c.req.json<SendMediaRequest>();
    const client = new WhatsAppClient(c.env);

    if (!body.to || (!body.media_url && !body.media_id)) {
      return c.json(
        { success: false, error: 'Missing required fields: to, and either media_url or media_id' },
        400
      );
    }

    const response = await client.sendAudio(
      body.to,
      {
        link: body.media_url,
        id: body.media_id,
      },
      body.reply_to
    );

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return c.json(errorResponse, 500);
  }
});

// POST /messages/document - Send a document
messages.post('/document', async (c) => {
  try {
    const body = await c.req.json<SendMediaRequest>();
    const client = new WhatsAppClient(c.env);

    if (!body.to || (!body.media_url && !body.media_id)) {
      return c.json(
        { success: false, error: 'Missing required fields: to, and either media_url or media_id' },
        400
      );
    }

    const response = await client.sendDocument(
      body.to,
      {
        link: body.media_url,
        id: body.media_id,
        caption: body.caption,
        filename: body.filename,
      },
      body.reply_to
    );

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return c.json(errorResponse, 500);
  }
});

// POST /messages/sticker - Send a sticker
messages.post('/sticker', async (c) => {
  try {
    const body = await c.req.json<SendMediaRequest>();
    const client = new WhatsAppClient(c.env);

    if (!body.to || (!body.media_url && !body.media_id)) {
      return c.json(
        { success: false, error: 'Missing required fields: to, and either media_url or media_id' },
        400
      );
    }

    const response = await client.sendSticker(
      body.to,
      {
        link: body.media_url,
        id: body.media_id,
      },
      body.reply_to
    );

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return c.json(errorResponse, 500);
  }
});

// POST /messages/location - Send a location
messages.post('/location', async (c) => {
  try {
    const body = await c.req.json<SendLocationRequest>();
    const client = new WhatsAppClient(c.env);

    if (!body.to || body.latitude === undefined || body.longitude === undefined) {
      return c.json(
        { success: false, error: 'Missing required fields: to, latitude, longitude' },
        400
      );
    }

    const response = await client.sendLocation(
      body.to,
      {
        latitude: body.latitude,
        longitude: body.longitude,
        name: body.name,
        address: body.address,
      },
      body.reply_to
    );

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return c.json(errorResponse, 500);
  }
});

// POST /messages/contacts - Send contacts
messages.post('/contacts', async (c) => {
  try {
    const body = await c.req.json<SendContactsRequest>();
    const client = new WhatsAppClient(c.env);

    if (!body.to || !body.contacts || body.contacts.length === 0) {
      return c.json(
        { success: false, error: 'Missing required fields: to, contacts' },
        400
      );
    }

    const response = await client.sendContacts(body.to, body.contacts, body.reply_to);

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return c.json(errorResponse, 500);
  }
});

// POST /messages/interactive/buttons - Send interactive buttons
messages.post('/interactive/buttons', async (c) => {
  try {
    const body = await c.req.json<SendInteractiveButtonsRequest>();
    const client = new WhatsAppClient(c.env);

    if (!body.to || !body.body || !body.buttons || body.buttons.length === 0) {
      return c.json(
        { success: false, error: 'Missing required fields: to, body, buttons' },
        400
      );
    }

    if (body.buttons.length > 3) {
      return c.json(
        { success: false, error: 'Maximum 3 buttons allowed' },
        400
      );
    }

    const options: Parameters<typeof client.sendInteractiveButtons>[3] = {};

    if (body.header) {
      if (body.header.type === 'text' && body.header.text) {
        options.header = { type: 'text', text: body.header.text };
      } else if (body.header.type === 'image' && (body.header.media_url || body.header.media_id)) {
        options.header = {
          type: 'image',
          image: { link: body.header.media_url, id: body.header.media_id },
        };
      } else if (body.header.type === 'video' && (body.header.media_url || body.header.media_id)) {
        options.header = {
          type: 'video',
          video: { link: body.header.media_url, id: body.header.media_id },
        };
      } else if (body.header.type === 'document' && (body.header.media_url || body.header.media_id)) {
        options.header = {
          type: 'document',
          document: { link: body.header.media_url, id: body.header.media_id },
        };
      }
    }

    if (body.footer) {
      options.footer = body.footer;
    }

    if (body.reply_to) {
      options.replyToMessageId = body.reply_to;
    }

    const response = await client.sendInteractiveButtons(
      body.to,
      body.body,
      body.buttons,
      options
    );

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return c.json(errorResponse, 500);
  }
});

// POST /messages/interactive/list - Send interactive list
messages.post('/interactive/list', async (c) => {
  try {
    const body = await c.req.json<SendInteractiveListRequest>();
    const client = new WhatsAppClient(c.env);

    if (!body.to || !body.body || !body.button_text || !body.sections || body.sections.length === 0) {
      return c.json(
        { success: false, error: 'Missing required fields: to, body, button_text, sections' },
        400
      );
    }

    if (body.sections.length > 10) {
      return c.json(
        { success: false, error: 'Maximum 10 sections allowed' },
        400
      );
    }

    const totalRows = body.sections.reduce((sum, section) => sum + section.rows.length, 0);
    if (totalRows > 10) {
      return c.json(
        { success: false, error: 'Maximum 10 rows allowed across all sections' },
        400
      );
    }

    const options: Parameters<typeof client.sendInteractiveList>[4] = {};

    if (body.header) {
      options.header = body.header;
    }

    if (body.footer) {
      options.footer = body.footer;
    }

    if (body.reply_to) {
      options.replyToMessageId = body.reply_to;
    }

    const response = await client.sendInteractiveList(
      body.to,
      body.body,
      body.button_text,
      body.sections,
      options
    );

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return c.json(errorResponse, 500);
  }
});

// POST /messages/reaction - Send a reaction to a message
messages.post('/reaction', async (c) => {
  try {
    const body = await c.req.json<SendReactionRequest>();
    const client = new WhatsAppClient(c.env);

    if (!body.to || !body.message_id || !body.emoji) {
      return c.json(
        { success: false, error: 'Missing required fields: to, message_id, emoji' },
        400
      );
    }

    const response = await client.sendReaction(body.to, body.message_id, body.emoji);

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return c.json(errorResponse, 500);
  }
});

// DELETE /messages/reaction - Remove a reaction from a message
messages.delete('/reaction', async (c) => {
  try {
    const body = await c.req.json<Omit<SendReactionRequest, 'emoji'>>();
    const client = new WhatsAppClient(c.env);

    if (!body.to || !body.message_id) {
      return c.json(
        { success: false, error: 'Missing required fields: to, message_id' },
        400
      );
    }

    const response = await client.removeReaction(body.to, body.message_id);

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return c.json(errorResponse, 500);
  }
});

// POST /messages/read - Mark a message as read
messages.post('/read', async (c) => {
  try {
    const body = await c.req.json<MarkAsReadRequest>();
    const client = new WhatsAppClient(c.env);

    if (!body.message_id) {
      return c.json(
        { success: false, error: 'Missing required field: message_id' },
        400
      );
    }

    const response = await client.markAsRead(body.message_id);

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return c.json(errorResponse, 500);
  }
});

export { messages };
