import { useState, useEffect, useRef } from "react";
import { processCommand } from "@/lib/nlpProcessor";
import { Mic } from "lucide-react";

interface VoiceInterfaceProps {
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
  transcript: string;
  setTranscript: (transcript: string) => void;
  onCommand: (field: string, value: string, command: string) => void;
  lastCommand: { type: "success" | "error"; message: string } | null;
}

const VoiceInterface = ({
  isListening,
  setIsListening,
  transcript,
  setTranscript,
  onCommand,
  lastCommand,
}: VoiceInterfaceProps) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        
        try {
          const result = processCommand(transcript);
          if (result) {
            onCommand(result.field, result.value, transcript);
          } else {
            setErrorMsg("Couldn't understand that command. Please try again.");
          }
        } catch (error) {
          console.error("Error processing command:", error);
          setErrorMsg("Error processing command. Please try again.");
        }
        
        stopListening();
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setErrorMsg(`Speech recognition error: ${event.error}`);
        stopListening();
      };
      
      recognitionRef.current.onend = () => {
        stopListening();
      };
    } else {
      setErrorMsg("Speech recognition is not supported in this browser.");
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [setTranscript, onCommand]);
  
  const startListening = () => {
    try {
      if (recognitionRef.current) {
        setIsListening(true);
        setErrorMsg(null);
        setTranscript("");
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setErrorMsg("Error starting speech recognition.");
      setIsListening(false);
    }
  };
  
  const stopListening = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } finally {
      setIsListening(false);
    }
  };
  
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-medium text-neutral-500 mb-4">Voice Commands</h2>
      
      <div className="mb-6">
        <button 
          onClick={toggleListening}
          className={`relative flex items-center justify-center w-16 h-16 mx-auto mb-3 rounded-full text-white focus:outline-none hover:bg-primary/90 transition-colors ${
            isListening 
              ? "bg-primary mic-listening" 
              : "bg-primary"
          }`}
          style={{
            boxShadow: isListening ? '0 0 0 8px rgba(66, 133, 244, 0.2)' : 'none'
          }}
        >
          <Mic className="w-6 h-6" />
          {isListening && (
            <span 
              className="absolute inset-0 rounded-full animate-ping" 
              style={{ 
                animation: 'pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
                backgroundColor: 'rgba(66, 133, 244, 0.3)'
              }}
            />
          )}
        </button>
        
        <p className={`text-center text-sm font-medium ${isListening ? 'text-primary' : 'text-neutral-400'}`}>
          {isListening ? 'Listening...' : 'Click to start speaking'}
        </p>
      </div>
      
      <div className="mb-6 p-4 bg-neutral-100 rounded-lg">
        <h3 className="text-sm font-medium text-neutral-400 mb-2">Try saying:</h3>
        <ul className="text-sm text-neutral-400 space-y-2">
          <li className="flex items-start">
            <span className="material-icons text-primary text-sm mr-2">arrow_right</span>
            "Change the deductible to $2,000"
          </li>
          <li className="flex items-start">
            <span className="material-icons text-primary text-sm mr-2">arrow_right</span>
            "Update my email to name@example.com"
          </li>
          <li className="flex items-start">
            <span className="material-icons text-primary text-sm mr-2">arrow_right</span>
            "Set the coverage amount to $200,000"
          </li>
          <li className="flex items-start">
            <span className="material-icons text-primary text-sm mr-2">arrow_right</span>
            "Change the policy type to Home Insurance"
          </li>
        </ul>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-2">Recognition Status</h3>
        
        <div className="p-3 bg-neutral-100 rounded-lg mb-3 min-h-[80px] max-h-[150px] overflow-y-auto">
          <p className={`text-sm ${transcript ? 'text-neutral-500' : 'text-neutral-400 italic'}`}>
            {transcript || "Your voice input will appear here..."}
          </p>
        </div>
        
        {(lastCommand || errorMsg) && (
          <div 
            className={`rounded-lg p-3 mb-2 text-sm font-medium ${
              errorMsg 
                ? "bg-destructive/10 text-destructive" 
                : lastCommand?.type === "success" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-destructive/10 text-destructive"
            }`}
          >
            <span className={`material-icons mr-1 text-sm ${
              errorMsg || lastCommand?.type === "error" ? "text-destructive" : "text-green-800"
            }`}>
              {errorMsg || lastCommand?.type === "error" ? "error" : "check_circle"}
            </span>
            {errorMsg || lastCommand?.message}
          </div>
        )}
      </div>
    </div>
  );
};

// Add Web Speech API typings
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default VoiceInterface;
