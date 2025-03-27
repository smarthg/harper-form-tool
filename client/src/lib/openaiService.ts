import OpenAI from 'openai';

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('openai_api_key'),
  dangerouslyAllowBrowser: true // Needed for client-side usage
});

/**
 * Initialize the OpenAI client with a provided API key
 * This is used when the key is entered manually via the UI
 */
export function initializeOpenAI(apiKey: string): void {
  // Update the API key
  openai.apiKey = apiKey;
}

/**
 * Check if the OpenAI client has a valid API key
 */
export function isOpenAIInitialized(): boolean {
  return !!openai.apiKey;
}

/**
 * Convert audio blob to text using OpenAI's speech-to-text API
 * @param audioBlob The recorded audio blob
 * @returns The transcribed text
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (!openai.apiKey) {
    throw new Error('OpenAI API key not provided. Please set an API key first.');
  }

  // Create a form data object to send the audio file
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', 'whisper-1');

  try {
    // Use the OpenAI client to transcribe the audio
    const response = await openai.audio.transcriptions.create({
      file: audioBlob as any, // Type casting needed due to browser Blob vs Node.js File differences
      model: 'whisper-1',
    });

    return response.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

/**
 * Process a command using OpenAI's API to extract intent
 * @param text The text to process
 * @returns Object with field and value
 */
export async function processCommandWithAI(text: string): Promise<{ field: string, value: string } | null> {
  if (!openai.apiKey) {
    throw new Error('OpenAI API key not provided. Please set an API key first.');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that extracts intent from user commands for an insurance form.
          The form has the following fields: firstName, lastName, email, phone, policyType, policyNumber, 
          startDate, endDate, coverageAmount, deductible, coverageType, monthlyPremium.
          
          Examples:
          - "Change the deductible to $2,000" → { "field": "deductible", "value": "2000" }
          - "Update my email to name@example.com" → { "field": "email", "value": "name@example.com" }
          - "Set the coverage amount to $200,000" → { "field": "coverageAmount", "value": "200000" }
          - "Change the policy type to Home Insurance" → { "field": "policyType", "value": "home" }
          
          Return a JSON object with the field and value, or null if you can't determine them.
          Remove currency symbols from monetary values. For policyType, normalize to: home, auto, life, or health.
          For coverageType, normalize to: comprehensive, collision, liability, or uninsured.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'extractFormField',
            description: 'Extract the field and value from a command',
            parameters: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  description: 'The field to update (e.g., firstName, lastName, email, etc.)'
                },
                value: {
                  type: 'string',
                  description: 'The value to set for the field'
                }
              },
              required: ['field', 'value']
            }
          }
        }
      ],
      tool_choice: { type: 'function', function: { name: 'extractFormField' } }
    });

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
    if (toolCall?.type === 'function' && toolCall.function.name === 'extractFormField') {
      try {
        const result = JSON.parse(toolCall.function.arguments);
        return { field: result.field, value: result.value };
      } catch (error) {
        console.error('Error parsing tool call arguments:', error);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('Error processing command with AI:', error);
    throw error;
  }
}