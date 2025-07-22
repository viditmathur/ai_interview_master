import AgoraRTC, { IAgoraRTCClient, ILocalVideoTrack, ILocalAudioTrack } from 'agora-rtc-sdk-ng';

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID;

let client: IAgoraRTCClient | null = null;
let localVideoTrack: ILocalVideoTrack | null = null;
let localAudioTrack: ILocalAudioTrack | null = null;

export async function joinAgoraChannel(channel: string, uid: string | number = 0) {
  if (!AGORA_APP_ID) throw new Error('Agora App ID not set');
  // Fetch token from backend
  const response = await fetch('/api/agora/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, uid }),
  });
  const { token } = await response.json();
  client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  await client.join(AGORA_APP_ID, channel, token, uid);
  localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  localVideoTrack = await AgoraRTC.createCameraVideoTrack();
  await client.publish([localAudioTrack, localVideoTrack]);
  // Expose tracks for external use (e.g., InterviewSession)
  if (!(window as any).AgoraRTC) (window as any).AgoraRTC = {};
  (window as any).AgoraRTC.localTracks = [localAudioTrack, localVideoTrack];
  return { client, localVideoTrack, localAudioTrack };
}

export async function leaveAgoraChannel() {
  if (localAudioTrack) {
    localAudioTrack.stop();
    localAudioTrack.close();
    localAudioTrack = null;
  }
  if (localVideoTrack) {
    localVideoTrack.stop();
    localVideoTrack.close();
    localVideoTrack = null;
  }
  if (client) {
    await client.leave();
    client = null;
  }
}

export function getAgoraClient() {
  return client;
} 