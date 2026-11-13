// Netlify Serverless Function for Gemini TTS proxy
function pcmToWav(pcmBuffer, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'NO_KEY', message: 'GEMINI_API_KEY not configured' })
    };
  }

  try {
    const { text, voice = 'Puck' } = JSON.parse(event.body || '{}');
    if (!text) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Text required' }) };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Please read aloud this radio broadcast bulletin with a natural, warm, measured cadence: "${text}"` }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice
                }
              }
            }
          }
        })
      }
    );

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(p => p.inlineData);

    if (audioPart && audioPart.inlineData) {
      const rawMime = audioPart.inlineData.mimeType || '';
      let base64Payload = audioPart.inlineData.data;
      let outMime = 'audio/wav';

      if (rawMime.includes('pcm') || rawMime.includes('L16')) {
        const pcmBuffer = Buffer.from(base64Payload, 'base64');
        const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
        base64Payload = wavBuffer.toString('base64');
      } else if (rawMime) {
        outMime = rawMime;
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Payload,
          mimeType: outMime
        })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'TTS_FAILED', message: data.error?.message || 'No audio returned from Gemini' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'SERVER_ERROR', message: err.message })
    };
  }
}
