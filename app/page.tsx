'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    setUploadStatus('idle');
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
    <div className="flex flex-col items-center justify-center min-h-screen">
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
    </div>
  );
}