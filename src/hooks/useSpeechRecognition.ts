import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onSpeechEndRef = useRef<((text: string) => void) | null>(null);
  const finalTranscriptRef = useRef('');
  const isVoiceModeRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback((onSpeechEnd?: (text: string) => void) => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Cleanup any existing recognition
    cleanup();

    console.log('🎤 Starting speech recognition', onSpeechEnd ? '(Voice Mode)' : '(Manual Mode)');
    
    // Set mode flags
    isVoiceModeRef.current = !!onSpeechEnd;
    onSpeechEndRef.current = onSpeechEnd || null;
    finalTranscriptRef.current = '';

    // Create new recognition instance
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Settings
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'tr-TR';

    recognition.onstart = () => {
      console.log('✅ Speech recognition started');
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
          finalTranscriptRef.current += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update transcript (interim + final)
      const currentTranscript = finalTranscriptRef.current + interimTranscript;
      console.log('📝 Transcript updated:', currentTranscript);
      setTranscript(currentTranscript);

      // For voice mode, process final results immediately
      if (finalTranscript && isVoiceModeRef.current && onSpeechEndRef.current) {
        console.log('🎯 Final result for voice mode:', finalTranscriptRef.current);
        const fullText = finalTranscriptRef.current.trim();
        if (fullText) {
          recognition.stop();
          // Process the speech immediately
          const callback = onSpeechEndRef.current;
          setTimeout(() => {
            if (callback) {
              callback(fullText);
            }
          }, 100);
        }
      }
    };

    recognition.onend = () => {
      console.log('🛑 Speech recognition ended');
      setIsListening(false);
      recognitionRef.current = null;
      
      // For manual mode, keep the transcript
      if (!isVoiceModeRef.current && finalTranscriptRef.current) {
        console.log('💾 Keeping transcript for manual input:', finalTranscriptRef.current);
        setTranscript(finalTranscriptRef.current);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('❌ Speech recognition error:', event.error);
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('❌ Error starting recognition:', error);
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [isSupported, cleanup]);

  const stopListening = useCallback(() => {
    console.log('⏹️ Stopping speech recognition');
    isVoiceModeRef.current = false;
    onSpeechEndRef.current = null;
    cleanup();
  }, [cleanup]);

  const resetTranscript = useCallback(() => {
    console.log('🔄 Resetting transcript');
    setTranscript('');
    finalTranscriptRef.current = '';
  }, []);

  // Function specifically for voice mode to restart listening
  const restartListening = useCallback((onSpeechEnd: (text: string) => void) => {
    console.log('🔄 Restarting listening for voice mode');
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a timeout to restart listening
    timeoutRef.current = setTimeout(() => {
      if (isVoiceModeRef.current) {
        startListening(onSpeechEnd);
      }
    }, 1000);
  }, [startListening]);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    restartListening
  };
};