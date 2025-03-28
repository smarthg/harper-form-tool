import OpenAI from 'openai';

// Initialize OpenAI client with API key from environment or localStorage
const envKey = import.meta.env.VITE_OPENAI_API_KEY;
const localStorageKey = typeof localStorage !== 'undefined' ? localStorage.getItem('openai_api_key') : null;

// Log available sources (without exposing the actual keys)
console.log("OpenAI API key sources:", {
  "Environment (VITE_OPENAI_API_KEY)": !!envKey,
  "LocalStorage": !!localStorageKey,
  "Environment Key Length": envKey ? envKey.length : 0
});

// Ensure we properly extract the key from environment variables
let apiKey = '';
if (envKey && envKey.length > 10) {
  // This is likely a valid API key
  apiKey = envKey;
  console.log("Using environment OpenAI API key");
} else if (localStorageKey) {
  // Use localStorage key as fallback
  apiKey = localStorageKey;
  console.log("Using localStorage OpenAI API key");
} else {
  console.warn("No valid OpenAI API key found");
}

// Initialize the client with the selected key
const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Needed for client-side usage
});

// If the API key wasn't set during initial load but becomes available
// via environment variables later, initialize it automatically
if (!apiKey && typeof window !== 'undefined') {
  window.setTimeout(() => {
    const envKeyDelayed = import.meta.env.VITE_OPENAI_API_KEY;
    if (envKeyDelayed && envKeyDelayed.length > 10 && !openai.apiKey) {
      console.log("Delayed initialization of OpenAI with environment key");
      openai.apiKey = envKeyDelayed;
    }
  }, 1000);
}

// Log final status of API key (without exposing the actual key)
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
 * @param formType Optional form type to specify which fields to focus on ('acord125' or 'acord126')
 * @returns Object with field and value
 */
export async function processCommandWithAI(text: string, formType?: string): Promise<{ field: string, value: string } | null> {
  if (!openai.apiKey) {
    throw new Error('OpenAI API key not provided. Please set an API key first.');
  }

  try {
    // Determine which field definitions to include based on form type
    let fieldDefinitions = '';
    
    // Always include ACORD 125 fields (our base form)
    fieldDefinitions += `# ACORD 125 Commercial Insurance Form Fields
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
          
          # Basic Form Fields
          - firstName: First name (personal info)
          - lastName: Last name (personal info) 
          - phone: Phone number
          - policyType: Type of policy (home, auto, life, health)
          - policyNumber: Policy identifier
          - startDate: Policy start date
          - endDate: Policy end date
          - coverageType: Type of coverage (comprehensive, collision, liability, uninsured)
          - monthlyPremium: Monthly payment amount`;
    
    // Add ACORD 126 fields if that form type is specified
    if (formType === 'acord126') {
      fieldDefinitions += `
          
          # ACORD 126 Commercial General Liability Form Fields
          - agencyCustomerId: Agency's ID for the customer
          - effectiveDate: Date when the coverage begins
          - expirationDate: Date when the coverage ends
          - producerName: Name of the producer
          - carrierName: Name of the insurance carrier
          - policyNumber: Policy identification number
          - namedInsured: Name of the insured business or individual
          - mailingAddress: Mailing address of the insured
          - premisesOperations: Coverage limit for premises operations
          - productsCompletedOperations: Coverage limit for products/completed operations
          - personalAndAdvertisingInjury: Coverage limit for personal & advertising injury
          - eachOccurrence: Coverage limit for each occurrence
          - damageToPremisesRented: Coverage limit for damage to rented premises
          - medicalExpense: Coverage limit for medical expenses
          - generalAggregate: Coverage limit for general aggregate
          - occurrenceForm: Whether the policy uses occurrence form (true/false)
          - claimsMadeForm: Whether the policy uses claims-made form (true/false)
          - retro: Retroactive date for claims-made form
          - premises: Description of premises
          - classification: Classification code
          - additionalInterests: Names of additional interests`;
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that extracts intent from user commands for an insurance form application.
          
          The form has the following fields:
          ${fieldDefinitions}
          
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