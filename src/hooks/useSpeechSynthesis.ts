import { useState, useEffect, useRef } from 'react';

export const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const onEndCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = (text: string, onEnd?: () => void) => {
    if (!isSupported || !text.trim()) return;

    // Store the callback
    onEndCallbackRef.current = onEnd || null;

    // Stop any current speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Try to find a Turkish voice, fallback to default
    const turkishVoice = voices.find(voice => 
      voice.lang.startsWith('tr') || voice.name.toLowerCase().includes('turkish')
    );
    
    if (turkishVoice) {
      utterance.voice = turkishVoice;
    }

    utterance.lang = 'tr-TR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      // Call the callback if provided
      if (onEndCallbackRef.current) {
        onEndCallbackRef.current();
        onEndCallbackRef.current = null;
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
      // Call the callback even on error
      if (onEndCallbackRef.current) {
        onEndCallbackRef.current();
        onEndCallbackRef.current = null;
      }
    };

    speechSynthesis.speak(utterance);
  };

  const stop = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    // Clear any pending callback
    onEndCallbackRef.current = null;
  };

  const pause = () => {
    speechSynthesis.pause();
  };

  const resume = () => {
    speechSynthesis.resume();
  };

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported,
    voices
  };
};