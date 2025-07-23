import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
const say = require('say');

const sayExport = say.export || say.speak;
const tmpDir = path.resolve(__dirname, '../../attached_assets');
const tmpFile = path.join(tmpDir, 'tts_output.wav');
const tmpMp3 = path.join(tmpDir, 'tts_output.mp3');
const execAsync = promisify(exec);

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
    // Use 'say' to generate a wav file, then convert to mp3 (requires ffmpeg)
    await new Promise((resolve, reject) => {
      sayExport(text, null, 1.0, tmpFile, (err: any) => {
        if (err) reject(err);
        else resolve(null);
      });
    });
    // Convert wav to mp3 using ffmpeg
    await execAsync(`ffmpeg -y -i "${tmpFile}" -ar 44100 -ac 2 -b:a 192k "${tmpMp3}"`);
    const mp3Buffer = fs.readFileSync(tmpMp3);
    // Clean up temp files
    fs.unlinkSync(tmpFile);
    fs.unlinkSync(tmpMp3);
    return mp3Buffer;
  }
} 