import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Mic, Square, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { processCommand } from "@/lib/nlpProcessor";

// Define speech recognition types
interface SpeechRecognitionEvent {
  results: {
    length: number;
    item(index: number): any;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInterface {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

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
  const [recognition, setRecognition] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Initialize speech recognition
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.error("Speech recognition is not supported in this browser.");
      setIsSupported(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = "en-US";

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        setTranscript(finalTranscript);
        processVoiceCommand(finalTranscript);
      }
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error", event.error);
      if (event.error === "not-allowed") {
        setIsSupported(false);
      }
    };

    recognitionInstance.onend = () => {
      if (isListening) {
        recognitionInstance.start();
      }
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      recognition.start();
      setIsListening(true);
    }
  };

  const processVoiceCommand = (command: string) => {
    const result = processCommand(command);
    if (result) {
      onCommand(result.field, result.value, command);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voice Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not supported</AlertTitle>
            <AlertDescription>
              Voice recognition is not supported in your browser or microphone access was denied.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex justify-between items-center">
          <span>Voice Commands</span>
          {isListening && <Badge variant="outline" className="animate-pulse bg-red-50">Listening</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-24 border border-dashed rounded-md flex items-center justify-center p-4 bg-neutral-50 overflow-y-auto">
          {transcript ? (
            <p className="text-sm text-neutral-700">{transcript}</p>
          ) : (
            <p className="text-sm text-neutral-400 text-center">
              {isListening
                ? "Speak now... I'm listening for commands like 'update first name to John'"
                : "Click the microphone button and speak a command"}
            </p>
          )}
        </div>

        {lastCommand && (
          <Alert
            variant={lastCommand.type === "success" ? "default" : "destructive"}
            className="py-2"
          >
            {lastCommand.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle className="text-sm">{lastCommand.message}</AlertTitle>
          </Alert>
        )}

        <div className="flex justify-center">
          <Button
            onClick={toggleListening}
            variant={isListening ? "destructive" : "default"}
            size="lg"
            className="w-full flex items-center justify-center gap-2"
          >
            {isListening ? (
              <>
                <Square className="h-4 w-4" /> Stop Listening
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" /> Start Listening
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2 text-sm text-neutral-500">
          <p className="font-medium">Example commands:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Update first name to John</li>
            <li>Change email to john.doe@example.com</li>
            <li>Set the policy number to POL-12345</li>
            <li>Update the deductible to $500</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceInterface;