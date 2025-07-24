import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { execFile } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tmpDir = path.resolve(__dirname, '../../attached_assets');
const tmpFile = path.join(tmpDir, 'tts_output.wav');

export async function generateTTS(text: string, provider: 'elevenlabs' | 'pyttsx3'): Promise<Buffer> {
  if (provider === 'elevenlabs') {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error('ElevenLabs API key not set');
    // Use ElevenLabs API (v1/text-to-speech)
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Default voice
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.7 }
      })
    });
    if (!response.ok) throw new Error('Failed to fetch audio from ElevenLabs');
    return Buffer.from(await response.arrayBuffer());
  } else {
    // Use Python pyttsx3 script to generate wav file
    await new Promise((resolve, reject) => {
      const python = execFile('python3', [path.join(__dirname, 'tts.py'), text, tmpFile], (err) => {
        if (err) reject(err);
        else resolve(null);
      });
    });
    const wavBuffer = fs.readFileSync(tmpFile);
    fs.unlinkSync(tmpFile);
    return wavBuffer;
  }
} 