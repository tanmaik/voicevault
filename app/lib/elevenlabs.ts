export interface TranscriptionWord {
  text: string;
  start: number;
  end: number;
  type: 'word';
  speaker_id?: string;
}

export interface TranscriptionResponse {
  text: string;
  language_code: string;
  language_probability: number;
  words?: TranscriptionWord[];
  speakers?: string[];
}

export interface TranscriptionMetadata {
  audioUrl: string;
  transcriptionId: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  transcript?: TranscriptionResponse;
  error?: string;
  createdAt: string;
  completedAt?: string;
  duration?: number;
  numSpeakers?: number;
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResponse> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured');
  }

  const formData = new FormData();
  
  const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
  formData.append('audio', audioBlob, 'audio.webm');
  formData.append('model_id', 'scribe_v1');
  formData.append('diarize', 'true');
  formData.append('num_speakers', '10');
  formData.append('timestamps_granularity', 'word');

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  const uniqueSpeakers = data.words
    ? Array.from(new Set(data.words.map((w: TranscriptionWord) => w.speaker_id).filter(Boolean)))
    : [];

  return {
    ...data,
    speakers: uniqueSpeakers,
  };
}