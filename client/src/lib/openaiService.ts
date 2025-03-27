import OpenAI from 'openai';

// Initialize OpenAI client with API key from environment or localStorage
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 
          import.meta.env.OPENAI_API_KEY || 
          localStorage.getItem('openai_api_key') || '',
  dangerouslyAllowBrowser: true // Needed for client-side usage
});

// Log status of API key (without exposing the actual key)
console.log("OpenAI API key status:", openai.apiKey ? "Available" : "Not set");

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

  try {
    // Option 1: Use fetch API directly for more control
    const formData = new FormData();
    
    // Create a file from the blob with an appropriate extension
    // OpenAI requires specific file types like mp3, mp4, mpeg, mpga, m4a, wav, or webm
    const fileExtension = audioBlob.type.includes('mp3') ? 'mp3' : 
                         audioBlob.type.includes('webm') ? 'webm' : 'wav';
    
    // Create a File object from the Blob
    const audioFile = new File([audioBlob], `recording.${fileExtension}`, { 
      type: audioBlob.type,
      lastModified: Date.now()
    });
    
    console.log(`Audio file created: ${audioFile.name}, type: ${audioFile.type}, size: ${audioFile.size} bytes`);
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    
    // Make the API call directly with fetch
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openai.apiKey}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const result = await response.json();
    return result.text;
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
          content: `You are a helpful assistant that extracts intent from user commands for an ACORD 125 Commercial Insurance Application.
          
          The form has the following fields:
          # ACORD 125 Commercial Insurance Form Fields
          - namedInsured: The name of the insured company
          - businessPhone: Business phone number
          - email: Email address
          - feinOrSocSec: Federal Employer ID Number
          - websiteAddress: Company website
          - mailingAddress: Mailing address (street)
          - mailingCity: City for mailing address
          - mailingState: State for mailing address
          - mailingZipCode: ZIP code for mailing address
          - natureOfBusiness: The type/nature of the business
          - descriptionOfPrimaryOperations: Description of the company's operations
          - businessType: Type of business entity (Corporation, LLC, Partnership, Individual, etc.)
          - dateBusinessStarted: When the business was founded
          - annualGrossSales: Annual revenue
          - numEmployees: Number of employees
          - deductible: Insurance deductible amount
          - coverageAmount: Insurance coverage amount
          - naics: North American Industry Classification System code
          - sic: Standard Industrial Classification code
          - agency: Agency name
          - contactName: Agency contact person name
          - phone: Agency phone number
          - proposedEffDate: Proposed effective date of the policy
          - proposedExpDate: Proposed expiration date of the policy
          
          # Additional Form Fields
          - firstName: First name (personal info)
          - lastName: Last name (personal info) 
          - phone: Phone number
          - policyType: Type of policy (home, auto, life, health)
          - policyNumber: Policy identifier
          - startDate: Policy start date
          - endDate: Policy end date
          - coverageType: Type of coverage (comprehensive, collision, liability, uninsured)
          - monthlyPremium: Monthly payment amount
          
          Examples:
          - "Change the deductible to $2,000" → { "field": "deductible", "value": "2000" }
          - "Update the business email to contact@example.com" → { "field": "email", "value": "contact@example.com" }
          - "Set the business name to ABC Company" → { "field": "namedInsured", "value": "ABC Company" }
          - "Change the business type to LLC" → { "field": "businessType", "value": "LLC" }
          - "Update the mailing address to 123 Main St" → { "field": "mailingAddress", "value": "123 Main St" }
          - "Set the business phone to 555-123-4567" → { "field": "businessPhone", "value": "555-123-4567" }
          - "Set policy type to auto" → { "field": "policyType", "value": "auto" }
          - "Change coverage type to comprehensive" → { "field": "coverageType", "value": "comprehensive" }
          - "Set monthly premium to $150" → { "field": "monthlyPremium", "value": "150" }
          
          Return a JSON object with the field and value, or null if you can't determine them.
          Remove currency symbols from monetary values.
          For businessType, normalize to: Corporation, LLC, Partnership, Individual, Joint Venture, Other.
          For policyType, normalize to: home, auto, life, health.
          For coverageType, normalize to: comprehensive, collision, liability, uninsured.`
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