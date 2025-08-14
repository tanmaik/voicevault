# VoiceVault - Voice Recording App with AI Transcription

A Next.js application that allows users to record voice audio, automatically transcribe it using ElevenLabs AI, and save both recordings and transcriptions to Vercel Blob Storage.

## Features

- 🎤 Browser-based voice recording using Web Audio API
- ⏸️ Pause/resume recording functionality
- 🎧 Preview recordings before upload
- ☁️ Automatic upload to Vercel Blob Storage or local storage
- 📱 Responsive design for mobile and desktop
- 🤖 AI-powered transcription using ElevenLabs scribe_v1
- 👥 Speaker diarization (identifies different speakers)
- ⏱️ Word-level timestamps for precise timing
- 🌐 Automatic language detection
- 🔄 Background transcription processing with Vercel's waitUntil

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Storage and AI Services

#### Vercel Blob Storage

1. Create a Vercel Blob store at https://vercel.com/dashboard/stores
2. Copy `.env.example` to `.env.local`
3. Add your tokens:

```env
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

#### ElevenLabs API

1. Sign up at https://elevenlabs.io
2. Get your API key from the profile settings
3. Add it to `.env.local` as shown above

#### Option B: Local Storage (Development)

For local development, recordings will be saved to the `uploads/` directory.

Update the frontend code in `app/voice-recorder/page.tsx` to use the local endpoint:

```typescript
// Change this line:
const response = await fetch('/api/upload-recording', {
// To:
const response = await fetch('/api/upload-recording-local', {
```

### 3. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to access the voice recorder.

## Usage

1. Click the microphone button to start recording
2. Allow microphone access when prompted
3. Click the stop button to finish recording
4. Recording automatically uploads to Vercel Blob Storage
5. Transcription begins processing in the background
6. View real-time transcription status and results
7. See speaker identification and word-level timestamps

## Project Structure

```
├── app/
│   ├── lib/
│   │   └── elevenlabs.ts       # ElevenLabs API integration
│   ├── api/
│   │   ├── upload-recording/    # Upload & transcription endpoint
│   │   ├── upload-recording-local/ # Local storage endpoint
│   │   └── transcription-status/[id]/ # Check transcription status
│   └── page.tsx                 # Main recording interface
├── uploads/                     # Local recordings (gitignored)
└── .env.local                   # Environment variables
```

## Transcription Features

### Speaker Diarization
Automatically identifies and labels different speakers in the recording (up to 10 speakers).

### Word-Level Timestamps
Each word in the transcript includes precise start and end times.

### Language Detection
Automatically detects the language of the audio with confidence scoring.

### Background Processing
Transcriptions are processed asynchronously using Vercel's `waitUntil` function, ensuring they complete even if the user navigates away.

## Security Notes

- Never commit `.env` files with real credentials
- Vercel Blob tokens should be kept secure
- ElevenLabs API keys should remain private
- Implement authentication before deploying to production
- Add file size limits and validation

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14.3+)
- Opera: Full support

Note: HTTPS is required for microphone access in production.