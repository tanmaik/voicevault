'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './voice-recorder.module.css';

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
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
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
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
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  };

  const uploadRecording = async (audioBlob: Blob) => {
    setIsUploading(true);
    
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
      alert('Recording uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload recording. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.recorder}>
        <h1 className={styles.title}>Voice Recorder</h1>
        
        <div className={styles.visualizer}>
          <div className={`${styles.recordingIndicator} ${isRecording && !isPaused ? styles.active : ''}`}>
            {isRecording ? (isPaused ? 'Paused' : 'Recording...') : 'Ready'}
          </div>
          <div className={styles.timer}>{formatTime(recordingTime)}</div>
        </div>

        <div className={styles.controls}>
          {!isRecording ? (
            <button 
              onClick={startRecording}
              className={styles.recordButton}
              aria-label="Start Recording"
            >
              <span className={styles.recordIcon}>🎤</span>
              Start Recording
            </button>
          ) : (
            <>
              <button 
                onClick={pauseRecording}
                className={styles.pauseButton}
                aria-label={isPaused ? "Resume Recording" : "Pause Recording"}
              >
                <span className={styles.pauseIcon}>{isPaused ? '▶️' : '⏸️'}</span>
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button 
                onClick={stopRecording}
                className={styles.stopButton}
                aria-label="Stop Recording"
              >
                <span className={styles.stopIcon}>⏹️</span>
                Stop
              </button>
            </>
          )}
        </div>

        {audioURL && !isRecording && (
          <div className={styles.playback}>
            <h3>Preview Recording</h3>
            <audio controls src={audioURL} className={styles.audioPlayer} />
          </div>
        )}

        {isUploading && (
          <div className={styles.uploadStatus}>
            Uploading recording to remote storage...
          </div>
        )}
      </div>
    </div>
  );
}