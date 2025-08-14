'use client';

import { useState, useRef, useEffect } from 'react';
import { TranscriptionMetadata } from './lib/elevenlabs';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [transcription, setTranscription] = useState<TranscriptionMetadata | null>(null);
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptionPollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      if (transcriptionPollingRef.current) {
        clearInterval(transcriptionPollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (transcriptionId) {
      const pollTranscriptionStatus = async () => {
        try {
          const response = await fetch(`/api/transcription-status/${transcriptionId}`);
          if (response.ok) {
            const data = await response.json();
            setTranscription(data);
            
            if (data.status === 'complete' || data.status === 'failed') {
              if (transcriptionPollingRef.current) {
                clearInterval(transcriptionPollingRef.current);
              }
            }
          }
        } catch (error) {
          console.error('Error polling transcription status:', error);
        }
      };

      pollTranscriptionStatus();
      transcriptionPollingRef.current = setInterval(pollTranscriptionStatus, 2000);

      return () => {
        if (transcriptionPollingRef.current) {
          clearInterval(transcriptionPollingRef.current);
        }
      };
    }
  }, [transcriptionId]);

  const startRecording = async () => {
    setUploadStatus('idle');
    setTranscription(null);
    setTranscriptionId(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await uploadRecording(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const uploadRecording = async (audioBlob: Blob) => {
    setUploadStatus('uploading');
    
    const formData = new FormData();
    const fileName = `recording-${Date.now()}.webm`;
    formData.append('audio', audioBlob, fileName);
    
    try {
      const response = await fetch('/api/upload-recording', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      console.log('Upload successful:', data);
      setUploadStatus('success');
      
      if (data.transcriptionId) {
        setTranscriptionId(data.transcriptionId);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
    }
    
    statusTimeoutRef.current = setTimeout(() => {
      setUploadStatus('idle');
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getButtonContent = () => {
    if (uploadStatus === 'uploading') {
      return <span className="text-2xl animate-pulse">⏳</span>;
    }
    if (uploadStatus === 'success') {
      return <span className="text-4xl">✅</span>;
    }
    if (uploadStatus === 'error') {
      return <span className="text-4xl">❌</span>;
    }
    if (isRecording) {
      return (
        <div className="flex flex-col items-center">
          <span className="text-2xl">⏹️</span>
          <span className="text-sm mt-1">{formatTime(recordingTime)}</span>
        </div>
      );
    }
    return <span className="text-3xl">🎤</span>;
  };

  const getButtonColor = () => {
    if (uploadStatus === 'success') return 'bg-green-500 hover:bg-green-600';
    if (uploadStatus === 'error') return 'bg-red-500 hover:bg-red-600';
    if (isRecording) return 'bg-red-500 hover:bg-red-600 scale-110';
    return 'bg-blue-500 hover:bg-blue-600';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <button 
        onClick={isRecording ? stopRecording : startRecording}
        className={`
          relative w-32 h-32 rounded-full transition-all duration-300
          ${getButtonColor()}
          text-white font-bold text-lg
          shadow-lg hover:shadow-xl
          flex items-center justify-center
        `}
        disabled={uploadStatus === 'uploading'}
      >
        {getButtonContent()}
      </button>

      {transcription && (
        <div className="mt-8 w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Transcription Status: {transcription.status}
          </h2>
          
          {transcription.status === 'pending' && (
            <p className="text-gray-600">Waiting to process...</p>
          )}
          
          {transcription.status === 'processing' && (
            <p className="text-gray-600 animate-pulse">Transcribing audio...</p>
          )}
          
          {transcription.status === 'failed' && (
            <div className="text-red-600">
              <p>Transcription failed</p>
              {transcription.error && <p className="text-sm mt-2">{transcription.error}</p>}
            </div>
          )}
          
          {transcription.status === 'complete' && transcription.transcript && (
            <div>
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Language: {transcription.transcript.language_code} 
                  ({Math.round((transcription.transcript.language_probability || 0) * 100)}% confidence)
                </p>
                {transcription.transcript.speakers && transcription.transcript.speakers.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Speakers detected: {transcription.transcript.speakers.length}
                  </p>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2 text-gray-700">Transcript:</h3>
                <p className="text-gray-800 whitespace-pre-wrap">{transcription.transcript.text}</p>
              </div>

              {transcription.transcript.words && transcription.transcript.words.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2 text-gray-700">Speaker Timeline:</h3>
                  <div className="bg-gray-50 p-4 rounded max-h-60 overflow-y-auto">
                    {transcription.transcript.words.map((word, index) => (
                      <span key={index} className="inline-block mr-1 mb-1">
                        {word.speaker_id && (
                          <span className={`text-xs px-1 py-0.5 rounded mr-1 ${
                            word.speaker_id === 'speaker_1' ? 'bg-blue-200' :
                            word.speaker_id === 'speaker_2' ? 'bg-green-200' :
                            word.speaker_id === 'speaker_3' ? 'bg-yellow-200' :
                            word.speaker_id === 'speaker_4' ? 'bg-purple-200' :
                            'bg-gray-200'
                          }`}>
                            {word.speaker_id.replace('speaker_', 'S')}
                          </span>
                        )}
                        <span className="text-gray-800">{word.text}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}