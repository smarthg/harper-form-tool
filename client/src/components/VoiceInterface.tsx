import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Settings, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import { transcribeAudio, processCommandWithAI, isOpenAIInitialized, initializeOpenAI } from "@/lib/openaiService";
import AudioRecorderPolyfill from 'audio-recorder-polyfill';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [apiKeySet, setApiKeySet] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Add styles for the loader and animation
  useEffect(() => {
    const styles = document.createElement('style');
    styles.innerHTML = `
      @keyframes pulse-ring {
        0% {
          transform: scale(0.9);
          opacity: 0.7;
        }
        50% {
          transform: scale(1);
          opacity: 0.3;
        }
        100% {
          transform: scale(0.9);
          opacity: 0.7;
        }
      }
      
      .loader {
        width: 1.5rem;
        height: 1.5rem;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styles);
    
    // Clean up on unmount
    return () => {
      document.head.removeChild(styles);
    };
  }, []);

  // Check if the API key is available
  useEffect(() => {
    // Check if the API key is available from environment or localStorage
    const storedApiKey = localStorage.getItem("openai_api_key");
    
    if (storedApiKey) {
      // If key is in localStorage, initialize with it
      setApiKey(storedApiKey);
      setApiKeySet(true);
      initializeOpenAI(storedApiKey);
    } else if (isOpenAIInitialized()) {
      // If OpenAI is already initialized with an environment key
      setApiKeySet(true);
    }
  }, []);

  const saveApiKey = () => {
    if (apiKey) {
      localStorage.setItem("openai_api_key", apiKey);
      initializeOpenAI(apiKey);
      setApiKeySet(true);
      setIsDialogOpen(false);
    }
  };

  // Setup the audio recorder polyfill
  useEffect(() => {
    // Register the polyfill if necessary
    if (typeof window !== 'undefined' && !window.MediaRecorder) {
      window.MediaRecorder = AudioRecorderPolyfill;
    }
  }, []);

  const startListening = async () => {
    if (!apiKeySet) {
      setIsDialogOpen(true);
      return;
    }

    try {
      setIsListening(true);
      setErrorMsg(null);
      setTranscript("");
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Check if we should use the polyfill
      const shouldUsePolyfill = !window.MediaRecorder || 
        (!MediaRecorder.isTypeSupported('audio/mp3') && 
         !MediaRecorder.isTypeSupported('audio/webm') && 
         !MediaRecorder.isTypeSupported('audio/wav'));
      
      // Determine the best mime type for recording
      const recordingMimeType = MediaRecorder.isTypeSupported('audio/mp3') 
        ? 'audio/mp3' 
        : MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/wav';
      
      if (shouldUsePolyfill) {
        console.log("Using audio-recorder-polyfill");
        mediaRecorderRef.current = new AudioRecorderPolyfill(stream);
      } else {
        console.log(`Using native MediaRecorder with mime type: ${recordingMimeType}`);
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: recordingMimeType });
      }

      if (!mediaRecorderRef.current) {
        throw new Error("Failed to initialize MediaRecorder");
      }
      
      const recorder = mediaRecorderRef.current;
        
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsProcessing(true);
        try {
          // Get the mime type from the recorder if possible, otherwise use a safe default
          const blobMimeType = shouldUsePolyfill 
            ? 'audio/wav' // The polyfill outputs WAV format
            : recorder.mimeType || 'audio/wav';
            
          const audioBlob = new Blob(audioChunksRef.current, { type: blobMimeType });
          console.log(`Audio blob created: type=${audioBlob.type}, size=${audioBlob.size} bytes`);
          
          // Transcribe audio with OpenAI
          const text = await transcribeAudio(audioBlob);
          setTranscript(text);

          // Process command with OpenAI
          const result = await processCommandWithAI(text);
          
          if (result) {
            onCommand(result.field, result.value, text);
          } else {
            setErrorMsg("Couldn't understand that command. Please try again.");
          }
        } catch (error: any) {
          console.error("Error processing speech:", error);
          setErrorMsg(`Error: ${error.message || "Something went wrong"}`);
        } finally {
          setIsProcessing(false);
          setIsListening(false);
          
          // Stop all audio tracks
          stream.getTracks().forEach(track => track.stop());
        }
      };

      // Start recording with 1 second timeslice to ensure we get data
      recorder.start(1000);
      console.log("Recording started with media recorder state:", recorder.state);
    } catch (error: any) {
      console.error("Error starting audio recording:", error);
      setErrorMsg(`Error: ${error.message || "Could not access microphone"}`);
      setIsListening(false);
    }
  };
  
  const stopListening = () => {
    try {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium text-neutral-500">Voice Commands</h2>
        {!isOpenAIInitialized() && (
          <button
            onClick={() => setIsDialogOpen(true)}
            className="text-neutral-400 hover:text-primary"
            title="API Settings"
          >
            <Settings size={18} />
          </button>
        )}
      </div>
      
      <div className="mb-6">
        <button 
          onClick={toggleListening}
          disabled={isProcessing || !apiKeySet}
          className={`relative flex items-center justify-center w-16 h-16 mx-auto mb-3 rounded-full text-white focus:outline-none hover:bg-primary/90 transition-colors ${
            isListening 
              ? "bg-primary mic-listening" 
              : isProcessing
                ? "bg-neutral-300"
                : !apiKeySet
                  ? "bg-neutral-300"
                  : "bg-primary"
          }`}
          style={{
            boxShadow: isListening ? '0 0 0 8px rgba(66, 133, 244, 0.2)' : 'none'
          }}
        >
          {isListening ? (
            <Mic className="w-6 h-6" />
          ) : isProcessing ? (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <Mic className="w-6 h-6" />
          )}
          
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
        
        <p className={`text-center text-sm font-medium ${
          isListening 
            ? 'text-primary' 
            : isProcessing
              ? 'text-neutral-400'
              : !apiKeySet
                ? 'text-neutral-400'
                : 'text-neutral-400'
        }`}>
          {isListening 
            ? 'Listening...' 
            : isProcessing
              ? 'Processing...'
              : !apiKeySet
                ? 'Set API key first'
                : 'Click to start speaking'}
        </p>
      </div>
      
      <div className="mb-6 p-4 bg-neutral-100 rounded-lg">
        <h3 className="text-sm font-medium text-neutral-400 mb-2">Try saying:</h3>
        <ul className="text-sm text-neutral-400 space-y-2">
          <li className="flex items-start">
            <ChevronRight className="text-primary h-4 w-4 mr-2 mt-0.5" />
            "Change the deductible to $2,000"
          </li>
          <li className="flex items-start">
            <ChevronRight className="text-primary h-4 w-4 mr-2 mt-0.5" />
            "Update my email to name@example.com"
          </li>
          <li className="flex items-start">
            <ChevronRight className="text-primary h-4 w-4 mr-2 mt-0.5" />
            "Set the coverage amount to $200,000"
          </li>
          <li className="flex items-start">
            <ChevronRight className="text-primary h-4 w-4 mr-2 mt-0.5" />
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
            className={`rounded-lg p-3 mb-2 text-sm font-medium flex items-start ${
              errorMsg 
                ? "bg-destructive/10 text-destructive" 
                : lastCommand?.type === "success" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-destructive/10 text-destructive"
            }`}
          >
            {errorMsg || lastCommand?.type === "error" ? (
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            )}
            <span>{errorMsg || lastCommand?.message}</span>
          </div>
        )}
      </div>
      
      {/* OpenAI API Key Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>OpenAI API Key</DialogTitle>
            <DialogDescription>
              Enter your OpenAI API key to enable speech-to-text and command processing.
              Your key is stored locally and never sent to our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-neutral-400">
                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary">OpenAI</a>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={saveApiKey} disabled={!apiKey.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoiceInterface;