import { defineConfig, loadEnv } from 'vite';
import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import process from 'node:process';

// Helper: Wrap raw 16-bit PCM audio in standard 44-byte RIFF WAV container
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20);  // Format (1 = PCM)
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Read API key from .env file directly if needed
function resolveApiKey(env: Record<string, string>): string {
  if (env.GEMINI_API_KEY) return env.GEMINI_API_KEY;
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/^GEMINI_API_KEY\s*=\s*([^\r\n#]+)/m);
      if (match) return match[1].trim();
    }
  } catch {
    // Ignore
  }
  return '';
}

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: {
    message?: string;
  };
}

// Local dev middleware plugin for Gemini TTS proxy
function geminiTtsPlugin(resolvedKey: string): Plugin {
  return {
    name: 'gemini-tts-proxy',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/tts', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer | string) => { body += chunk; });
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');
          const apiKey = resolvedKey || resolveApiKey({});

          if (!apiKey) {
            res.statusCode = 200;
            res.end(JSON.stringify({ error: 'NO_KEY', message: 'No GEMINI_API_KEY in environment' }));
            return;
          }

          try {
            const { text, language = 'en', voice = 'Puck' } = JSON.parse(body || '{}');

            let presenterPrompt = `Please read aloud this radio bulletin with a natural, warm, measured announcer cadence: "${text}"`;
            let selectedVoice = voice || 'Puck';

            if (language === 'hi') {
              selectedVoice = 'Aoede';
              presenterPrompt = `आप HAWA.fm मुंबई के एक पेशेवर, सहज और शांत रेडियो समाचार उद्घोषक हैं। शुद्ध और स्वाभाविक हिंदी उच्चारण, उचित ठहराव और समाचार वाचक के अंदाज़ में यह बुलेटिन पढ़ें: "${text}"`;
            } else if (language === 'mr') {
              selectedVoice = 'Aoede';
              presenterPrompt = `तुम्ही HAWA.fm मुंबईचे एक व्यावसायिक, शांत आणि अनुभवी मराठी रेडिओ उद्घोषक आहात. शुद्ध, स्पष्ट आणि अस्खलित मराठी भाषेत ही बातमी वाचा. इंग्रजीत बोलू नका, फक्त मराठीतच बोला: "${text}"`;
            } else {
              presenterPrompt = `You are a professional, warm, articulate Indian radio news presenter on HAWA.fm in Mumbai broadcasting an atmospheric news bulletin. Speak with a natural, clear Indian English accent, measured pacing, subtle pauses at commas and full stops, and a calm, reassuring tone. Read aloud this broadcast bulletin: "${text}"`;
            }

            // Use verified working Gemini TTS model
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: presenterPrompt }] }],
                  generationConfig: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                      voiceConfig: {
                        prebuiltVoiceConfig: {
                          voiceName: selectedVoice
                        }
                      }
                    }
                  }
                })
              }
            );

            const data = (await geminiRes.json()) as GeminiResponse;
            const candidate = data.candidates?.[0];
            const audioPart = candidate?.content?.parts?.find((p) => p.inlineData);

            if (audioPart && audioPart.inlineData) {
              const rawMime = audioPart.inlineData.mimeType || '';
              let base64Payload = audioPart.inlineData.data;
              let outMime = 'audio/wav';

              // If Gemini returned raw PCM (e.g. audio/L16;codec=pcm;rate=24000), wrap with standard 44-byte WAV header
              if (rawMime.includes('pcm') || rawMime.includes('L16')) {
                const pcmBuffer = Buffer.from(base64Payload, 'base64');
                const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
                base64Payload = wavBuffer.toString('base64');
              } else if (rawMime) {
                outMime = rawMime;
              }

              res.statusCode = 200;
              res.end(JSON.stringify({
                audioBase64: base64Payload,
                mimeType: outMime
              }));
            } else {
              res.statusCode = 200;
              res.end(JSON.stringify({
                error: 'TTS_FAILED',
                message: data.error?.message || 'No audio generated by model'
              }));
            }
          } catch (err: unknown) {
            res.statusCode = 500;
            const errorMsg = err instanceof Error ? err.message : String(err);
            res.end(JSON.stringify({ error: 'SERVER_ERROR', message: errorMsg }));
          }
        });
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = resolveApiKey(env);

  return {
    plugins: [
      tailwindcss(),
      react(),
      geminiTtsPlugin(apiKey)
    ],
    server: {
      port: 5173,
      host: true
    }
  };
});
