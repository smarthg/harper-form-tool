import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Settings, ChevronRight, CheckCircle, AlertCircle, Send } from "lucide-react";
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
  formType?: 'acord125' | 'acord126';
}

const VoiceInterface = ({
  isListening,
  setIsListening,
  transcript,
  setTranscript,
  onCommand,
  lastCommand,
  formType = 'acord125',
}: VoiceInterfaceProps) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualInput, setManualInput] = useState<string>("");
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

  // Function to check API key status and log it
  const checkApiKeyStatus = () => {
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    const lsKey = localStorage.getItem("openai_api_key");
    
    const status = {
      "OpenAI Initialized": isOpenAIInitialized(),
      "Component State (apiKeySet)": apiKeySet,
      "Environment Key Available": !!envKey,
      "Environment Key Length": envKey ? envKey.length : 0,
      "LocalStorage Key Available": !!lsKey
    };
    
    console.log("API Key Status Check:", status);
    
    // Force reinitialize OpenAI with env key if available
    if (envKey && envKey.length > 10) {
      initializeOpenAI(envKey);
      setApiKeySet(true);
      console.log("Manually initialized OpenAI with env key");
      
      // Show alert with status for debugging in production
      setTimeout(() => {
        alert(`OpenAI API key status updated:\n\n` + 
              `• API Initialized: ${isOpenAIInitialized()}\n` +
              `• Component State: ${apiKeySet}\n` +
              `• Environment Key: ${!!envKey}\n` +
              `• Local Storage Key: ${!!lsKey}`);
      }, 500);
    } else if (lsKey) {
      initializeOpenAI(lsKey);
      setApiKeySet(true);
      console.log("Manually initialized OpenAI with localStorage key");
    }
    
    return isOpenAIInitialized();
  };
  
  // Check if the API key is available
  useEffect(() => {
    // Check if the API key is available from environment or localStorage
    const storedApiKey = localStorage.getItem("openai_api_key");
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    console.log("VoiceInterface - OpenAI environment key available:", !!envApiKey, 
                "length:", envApiKey ? envApiKey.length : 0);
    
    const checkAndSetApiKey = async () => {
      try {
        // First check if OpenAI is already initialized
        if (isOpenAIInitialized()) {
          setApiKeySet(true);
          console.log("VoiceInterface - OpenAI API already initialized and ready");
          return;
        }
        
        // If not, try with environment key first (prioritize over localStorage)
        if (envApiKey && envApiKey.length > 10) {
          console.log("VoiceInterface - Initializing OpenAI with environment key");
          initializeOpenAI(envApiKey);
          setApiKeySet(true);
          return;
        }
        
        // Then try with localStorage key
        if (storedApiKey) {
          console.log("VoiceInterface - Initializing OpenAI with localStorage key");
          initializeOpenAI(storedApiKey);
          setApiKey(storedApiKey);
          setApiKeySet(true);
          return;
        }
        
        console.log("VoiceInterface - No OpenAI API key found, will prompt user to enter one");
      } catch (error) {
        console.error("Error initializing OpenAI:", error);
        setApiKeySet(false);
      }
    };
    
    // Run the check immediately
    checkAndSetApiKey();
    
    // And also run a check after a short delay to ensure all initialization has completed
    const timer = setTimeout(() => {
      const isInitialized = checkApiKeyStatus();
      console.log("VoiceInterface - Delayed check - OpenAI initialized:", isInitialized);
      setApiKeySet(isInitialized);
      
      // Force re-initialization if still not set properly
      if (!isInitialized && envApiKey && envApiKey.length > 10) {
        console.log("VoiceInterface - Forcing OpenAI initialization with environment key");
        initializeOpenAI(envApiKey);
        setApiKeySet(true);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
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

          // Process command with OpenAI using the current form type
          const result = await processCommandWithAI(text, formType);
          
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
  
  /**
   * Process a manually typed command
   */
  const handleManualCommand = async () => {
    if (!manualInput.trim() || !apiKeySet) return;

    setIsProcessing(true);
    setErrorMsg(null);
      
    try {
      // Process the command with OpenAI
      const text = manualInput.trim();
      setTranscript(text);
      
      // Process command with OpenAI using the current form type
      const result = await processCommandWithAI(text, formType);
      
      if (result) {
        onCommand(result.field, result.value, text);
        setManualInput(''); // Clear the input field after successful processing
      } else {
        setErrorMsg("Couldn't understand that command. Please try again.");
      }
    } catch (error: any) {
      console.error("Error processing manual command:", error);
      setErrorMsg(`Error: ${error.message || "Something went wrong"}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium text-neutral-500">Voice Commands</h2>
        <div className="flex gap-2">
          <button
            onClick={checkApiKeyStatus}
            className="text-neutral-400 hover:text-primary"
            title="Check API Key Status"
          >
            <AlertCircle size={18} />
          </button>
          {!apiKeySet && (
            <button
              onClick={() => setIsDialogOpen(true)}
              className="text-neutral-400 hover:text-primary"
              title="API Settings"
            >
              <Settings size={18} />
            </button>
          )}
        </div>
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
          {formType === 'acord125' ? (
            <>
              <li className="flex items-start">
                <ChevronRight className="text-primary h-4 w-4 mr-2 mt-0.5" />
                "Set the business name to ABC Construction"
              </li>
              <li className="flex items-start">
                <ChevronRight className="text-primary h-4 w-4 mr-2 mt-0.5" />
                "Update the email to contact@example.com"
              </li>
              <li className="flex items-start">
                <ChevronRight className="text-primary h-4 w-4 mr-2 mt-0.5" />
                "Change the mailing address to 123 Main Street"
              </li>
              <li className="flex items-start">
                <ChevronRight className="text-primary h-4 w-4 mr-2 mt-0.5" />
                "Set the business type to LLC"
              </li>
            </>
          ) : formType === 'acord126' ? (
            <>
              <li className="flex items-start">
                <ChevronRight className="text-primary h-4 w-4 mr-2 mt-0.5" />
                "Set the each occurrence limit to $1,000,000"
              </li>
              <li className="flex items-start">
                <ChevronRight className="text-primary h-4 w-4 mr-2 mt-0.5" />
                "Update the general aggregate to $2,000,000"
              </li>
              <li className="flex items-start">
                <ChevronRight className="text-primary h-4 w-4 mr-2 mt-0.5" />
                "Change the medical expense to $5,000"
              </li>
              <li className="flex items-start">
                <ChevronRight className="text-primary h-4 w-4 mr-2 mt-0.5" />
                "Set occurrence form to true"
              </li>
            </>
          ) : (
            <>
              <li className="flex items-start">
                <ChevronRight className="text-primary h-4 w-4 mr-2 mt-0.5" />
                "Set the business name to ABC Construction"
              </li>
              <li className="flex items-start">
                <ChevronRight className="text-primary h-4 w-4 mr-2 mt-0.5" />
                "Update the email to contact@example.com"
              </li>
              <li className="flex items-start">
                <ChevronRight className="text-primary h-4 w-4 mr-2 mt-0.5" />
                "Change the mailing address to 123 Main Street"
              </li>
              <li className="flex items-start">
                <ChevronRight className="text-primary h-4 w-4 mr-2 mt-0.5" />
                "Set the business type to LLC"
              </li>
            </>
          )}
        </ul>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-2">Recognition Status</h3>
        
        <div className="p-3 bg-neutral-100 rounded-lg mb-3 min-h-[80px] max-h-[150px] overflow-y-auto">
          <p className={`text-sm ${transcript ? 'text-neutral-500' : 'text-neutral-400 italic'}`}>
            {transcript || "Your voice input will appear here..."}
          </p>
        </div>
        
        {/* Manual command input */}
        <div className="flex items-center gap-2 mb-3">
          <Input
            placeholder="Type a command manually..."
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && manualInput.trim() && !isProcessing) {
                e.preventDefault();
                handleManualCommand();
              }
            }}
            disabled={isProcessing || !apiKeySet}
            className="flex-1"
          />
          <Button 
            onClick={handleManualCommand}
            disabled={!manualInput.trim() || isProcessing || !apiKeySet}
            size="sm"
            className="h-10"
          >
            {isProcessing ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send
          </Button>
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