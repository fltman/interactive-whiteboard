import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Enable CORS for all origins in development
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Create uploads directory
const uploadsDir = join(__dirname, 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = file.originalname.split('.').pop();
    cb(null, `${uniqueSuffix}.${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Return relative URL so it works with any host (localhost, ngrok, etc)
  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
    success: true,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    url: fileUrl
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uploads: uploadsDir });
});

// OpenRouter client for AI image generation
const openrouterClient = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// AI Image generation endpoint
app.post('/api/generate-image', async (req, res) => {
  const { prompt, image, systemPrompt } = req.body;

  if (!prompt && !image) {
    return res.status(400).json({ error: 'Prompt or image is required' });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });
  }

  try {
    console.log(`🎨 Generating image with prompt: "${prompt || '(none)'}"${image ? ' (with input image)' : ''}`);

    // Build message content - text only or multimodal with image
    let messageContent;
    if (image) {
      // Multimodal request with image input
      let fullPrompt;
      if (systemPrompt && prompt) {
        fullPrompt = `${systemPrompt}\n\nThe user's instructions: ${prompt}`;
      } else if (systemPrompt) {
        fullPrompt = systemPrompt;
      } else if (prompt) {
        fullPrompt = `Generate an image: ${prompt}`;
      } else {
        fullPrompt = 'Generate a polished version of this sketch/drawing.';
      }

      messageContent = [
        {
          type: 'text',
          text: fullPrompt,
        },
        {
          type: 'image_url',
          image_url: {
            url: image, // Already a data URL from canvas
          },
        },
      ];
    } else {
      // Text-only request
      messageContent = `Generate an image: ${prompt}`;
    }

    const response = await openrouterClient.chat.completions.create({
      model: 'google/gemini-3-pro-image-preview',
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
    });

    // Extract the image from the response
    const message = response.choices[0]?.message;

    if (!message) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // Log text content if any
    if (message.content) {
      console.log('Text response:', message.content);
    }

    // Check for images in message.images (Gemini format)
    if (message.images && Array.isArray(message.images)) {
      for (const imageData of message.images) {
        if (imageData.type === 'image_url' && imageData.image_url?.url?.startsWith('data:image')) {
          const dataUrl = imageData.image_url.url;
          const base64Data = dataUrl.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const filename = `ai-${Date.now()}.png`;
          const filepath = join(uploadsDir, filename);
          writeFileSync(filepath, buffer);

          const imageUrl = `http://localhost:${PORT}/uploads/${filename}`;
          console.log(`✅ Image saved: ${imageUrl}`);
          return res.json({ success: true, url: imageUrl });
        }
      }
    }

    // If no image found, return error
    return res.status(500).json({
      error: 'No image in response',
      response: message.content?.substring(0, 500) || 'No content'
    });

  } catch (error) {
    console.error('AI Image generation error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate image'
    });
  }
});

// AI Web generation endpoint (Claude Opus 4.5)
app.post('/api/generate-web', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });
  }

  try {
    console.log(`🌐 Generating web content with prompt: "${prompt.substring(0, 100)}..."`);

    const response = await openrouterClient.chat.completions.create({
      model: 'anthropic/claude-sonnet-4.5',
      messages: [
        {
          role: 'system',
          content: `You are an expert web developer. Generate a complete, self-contained HTML page based on the user's request.

Rules:
- Return ONLY the HTML code, no explanations
- Include all CSS in a <style> tag in the <head>
- Include all JavaScript in a <script> tag before </body>
- CRITICAL: The content will be displayed in an iframe of unknown size. It MUST scale to fit the viewport perfectly:
  * Use width: 100vw and height: 100vh for the main container
  * Use relative units (%, vw, vh, vmin, vmax) instead of fixed pixels
  * Center content both vertically and horizontally
  * Remove all margins and padding from html/body (margin: 0; padding: 0)
  * Use "overflow: hidden" on body to prevent scrollbars
- Make it visually appealing with modern CSS
- The page should be fully functional and interactive
- Use a dark theme by default unless specified otherwise
- Do NOT use any external resources (CDNs, images, fonts) - everything must be inline
- Start with <!DOCTYPE html> and end with </html>`
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const message = response.choices[0]?.message;

    if (!message || !message.content) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // Extract HTML from response (handle markdown code blocks)
    let html = message.content;

    // Remove markdown code blocks if present
    const htmlMatch = html.match(/```html\n?([\s\S]*?)```/);
    if (htmlMatch) {
      html = htmlMatch[1];
    } else {
      // Try without language specifier
      const codeMatch = html.match(/```\n?([\s\S]*?)```/);
      if (codeMatch) {
        html = codeMatch[1];
      }
    }

    // Ensure it starts with DOCTYPE
    if (!html.trim().toLowerCase().startsWith('<!doctype')) {
      // Wrap in basic HTML structure if needed
      if (!html.includes('<html')) {
        html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${html}</body></html>`;
      }
    }

    console.log(`✅ Generated ${html.length} bytes of HTML`);
    return res.json({ success: true, html });

  } catch (error) {
    console.error('AI Web generation error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate web content'
    });
  }
});

app.listen(PORT, () => {
  console.log(`📁 File server running at http://localhost:${PORT}`);
  console.log(`   Upload endpoint: POST /api/upload`);
  console.log(`   Files served at: /uploads/`);
});
