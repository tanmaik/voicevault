# VoiceVault - Voice Recording App

A Next.js application that allows users to record voice audio and save recordings to Vercel Blob Storage or local filesystem.

## Features

- 🎤 Browser-based voice recording using Web Audio API
- ⏸️ Pause/resume recording functionality
- 🎧 Preview recordings before upload
- ☁️ Automatic upload to Vercel Blob Storage or local storage
- 📱 Responsive design for mobile and desktop

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Storage

#### Option A: Vercel Blob Storage (Production)

1. Create a Vercel Blob store at https://vercel.com/dashboard/stores
2. Copy `.env.example` to `.env.local`
3. Add your Vercel Blob token:

```env
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

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

Visit `http://localhost:3000` and click "Start Recording" to access the voice recorder.

## Usage

1. Click "Start Recording" on the home page
2. Allow microphone access when prompted
3. Click the red "Start Recording" button to begin
4. Use Pause/Resume buttons as needed
5. Click "Stop" to finish recording
6. Preview your recording with the audio player
7. Recording automatically uploads to configured storage

## Project Structure

```
├── app/
│   ├── voice-recorder/          # Voice recording page
│   │   ├── page.tsx             # Recording component
│   │   └── voice-recorder.module.css
│   ├── api/
│   │   ├── upload-recording/    # Vercel Blob upload endpoint
│   │   └── upload-recording-local/ # Local storage endpoint
│   └── page.tsx                 # Home page
├── uploads/                     # Local recordings (gitignored)
└── .env.example                 # Environment variables template
```

## Security Notes

- Never commit `.env` files with real credentials
- Vercel Blob tokens should be kept secure
- Implement authentication before deploying to production
- Add file size limits and validation

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14.3+)
- Opera: Full support

Note: HTTPS is required for microphone access in production.