import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types/whatsapp';
import { webhook } from './routes/webhook';
import { messages } from './routes/messages';
import { data } from './routes/data';
import { apiKeyAuth, rateLimit, requestLogger, corsConfig } from './middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', cors(corsConfig));
app.use('*', requestLogger);

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    name: 'WhatsApp Business API',
    version: '1.0.0',
    status: 'healthy',
    endpoints: {
      webhook: '/webhook',
      messages: '/messages/*',
      media: '/media/*',
      data: '/data/*',
    },
  });
});

// Webhook routes (no API key auth - Meta needs to access this)
app.route('/webhook', webhook);

// Protected API routes
app.use('/messages/*', apiKeyAuth);
app.use('/messages/*', rateLimit({ windowMs: 60000, maxRequests: 100 }));
app.route('/messages', messages);

// Data routes (query messages and contacts)
app.use('/data/*', apiKeyAuth);
app.use('/data/*', rateLimit({ windowMs: 60000, maxRequests: 100 }));
app.route('/data', data);

// Media routes
app.use('/media/*', apiKeyAuth);
app.use('/media/*', rateLimit({ windowMs: 60000, maxRequests: 50 }));

// GET /media/:id - Get media URL
app.get('/media/:id', async (c) => {
  const { WhatsAppClient } = await import('./lib/whatsapp-client');
  const client = new WhatsAppClient(c.env);

  try {
    const mediaId = c.req.param('id');
    const response = await client.getMediaUrl(mediaId);
    return c.json({ success: true, data: response });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// DELETE /media/:id - Delete media
app.delete('/media/:id', async (c) => {
  const { WhatsAppClient } = await import('./lib/whatsapp-client');
  const client = new WhatsAppClient(c.env);

  try {
    const mediaId = c.req.param('id');
    const response = await client.deleteMedia(mediaId);
    return c.json({ success: true, data: response });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Not Found',
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      success: false,
      error: 'Internal Server Error',
      message: err.message,
    },
    500
  );
});

export default app;
