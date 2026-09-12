import { useEffect, useRef, useState, useCallback } from 'react';

export function useWakeWord(wakeWord: string, onWake: () => void, isActive: boolean) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isStoppingRef = useRef(false);

  const handleWake = useCallback(() => {
    onWake();
  }, [onWake]);

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US'; // Works for "Hey Zoya"

    recognition.onstart = () => {
      setIsListening(true);
      isStoppingRef.current = false;
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase();
        if (transcript.includes(wakeWord.toLowerCase()) || transcript.includes('hey joya') || transcript.includes('zoya')) {
          handleWake();
        }
      }
    };

    recognition.onerror = (event: any) => {
      // Ignore some common non-fatal errors
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
         console.warn("Wake word recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Automatically restart if it should be active but stopped
      if (isActive && !isStoppingRef.current) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isStoppingRef.current = true;
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [wakeWord, handleWake]);

  // Handle active state changes
  useEffect(() => {
    if (isActive) {
      if (recognitionRef.current && !isListening) {
         try {
           isStoppingRef.current = false;
           recognitionRef.current.start();
         } catch(e) {}
      }
    } else {
      if (recognitionRef.current) {
        isStoppingRef.current = true;
        try {
          recognitionRef.current.stop();
        } catch(e) {}
      }
    }
  }, [isActive, isListening]);

  return { isListening };
}
