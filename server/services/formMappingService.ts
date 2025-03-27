import OpenAI from 'openai';
import { FormDefinition } from '@shared/formTypes/acord125';
import { FormDataType } from '@shared/schema';

// Initialize OpenAI client
let openai: OpenAI | null = null;

/**
 * Initialize the OpenAI client with the provided API key
 * @param apiKey OpenAI API key
 */
export function initializeOpenAI(apiKey: string) {
  if (!apiKey) {
    console.warn('No OpenAI API key provided');
    return;
  }
  
  try {
    openai = new OpenAI({
      apiKey: apiKey
    });
    console.log('OpenAI client initialized for form mapping');
  } catch (error) {
    console.error('Error initializing OpenAI client:', error);
    openai = null;
  }
}

/**
 * Map company data to ACORD 125 form fields using AI
 * @param companyData Raw company data from external API
 * @param formDefinition The ACORD 125 form definition
 * @returns Mapped form data with company information filled in
 */
export async function mapCompanyDataToForm(
  companyData: any, 
  formDefinition: FormDefinition
): Promise<Record<string, any>> {
  // If OpenAI is not initialized, use basic mapping
  if (!openai) {
    console.log('OpenAI client not initialized, using basic mapping');
    return basicCompanyDataMapping(companyData);
  }
  
  try {
    console.log('Processing company data with OpenAI to map to form fields');
    
    // Extract field information from form definition
    const formFields: Record<string, { type: string, label: string }> = {};
    
    formDefinition.sections.forEach(section => {
      section.fields.forEach(field => {
        formFields[field.name] = {
          type: field.type,
          label: field.label
        };
      });
    });
    
    // Create a prompt for the AI to map company data to form fields
    const prompt = `
    I have company data and need to map it to an ACORD 125 (Commercial Insurance Application) form.
    
    Here's the company data:
    ${JSON.stringify(companyData, null, 2)}
    
    Here are the form fields I need to fill:
    ${JSON.stringify(formFields, null, 2)}
    
    Please map the company data to the appropriate form fields. Return ONLY a JSON object with form field names as keys and extracted values from the company data as values. 
    If you can't find a match for a field, omit that field completely from the response.
    For example: { "namedInsured": "ACME Corporation", "businessPhone": "555-123-4567" }
    `;
    
    // Call the OpenAI API to process the mapping
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that maps company data to insurance form fields accurately. Only return valid JSON with appropriate field mappings.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1, // Low temperature for more deterministic results
      max_tokens: 1500
    });
    
    // Extract the response text
    const aiResponseText = response.choices[0]?.message?.content || '';
    
    // Parse the JSON response
    // We need to extract just the JSON part from the response
    const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not extract JSON from AI response:', aiResponseText);
      return basicCompanyDataMapping(companyData);
    }
    
    try {
      const mappedData = JSON.parse(jsonMatch[0]);
      console.log('AI successfully mapped company data to form fields');
      return mappedData;
    } catch (parseError) {
      console.error('Error parsing AI response JSON:', parseError);
      return basicCompanyDataMapping(companyData);
    }
  } catch (error) {
    console.error('Error processing company data with OpenAI:', error);
    // Fall back to basic mapping if AI processing fails
    return basicCompanyDataMapping(companyData);
  }
}

/**
 * Basic mapping of company data to form fields without AI
 * @param companyData Raw company data from external API
 * @returns Mapped form data with basic company information
 */
function basicCompanyDataMapping(companyData: any): Record<string, any> {
  // Extract the company object from the response if needed
  const company = companyData.company?.json?.company || companyData;
  
  // Create a mapping of form fields to company data
  const mappedData: Record<string, any> = {};
  
  // Map basic company information
  if (company.company_name) {
    mappedData.namedInsured = company.company_name;
  }
  
  if (company.company_address) {
    mappedData.mailingAddress = company.company_address;
  }
  
  if (company.company_naics_code) {
    mappedData.naics = company.company_naics_code;
  }
  
  if (company.company_sic_code) {
    mappedData.sic = company.company_sic_code;
  }
  
  if (company.company_primary_phone) {
    mappedData.businessPhone = company.company_primary_phone;
  }
  
  if (company.company_website) {
    mappedData.websiteAddress = company.company_website;
  }
  
  if (company.company_description) {
    mappedData.descriptionOfPrimaryOperations = company.company_description;
  }
  
  if (company.company_ein) {
    mappedData.feinOrSocSec = company.company_ein;
  }
  
  if (company.company_year_founded) {
    const yearFounded = new Date(company.company_year_founded);
    if (!isNaN(yearFounded.getTime())) {
      mappedData.dateBusinessStarted = yearFounded.toISOString().split('T')[0];
    }
  }
  
  // Business type mapping based on available data
  if (company.company_type) {
    const businessType = company.company_type.toLowerCase();
    
    if (businessType.includes('llc')) {
      mappedData.businessType = 'LLC';
    } else if (businessType.includes('corp')) {
      mappedData.businessType = 'Corporation';
    } else if (businessType.includes('partner')) {
      mappedData.businessType = 'Partnership';
    } else if (businessType.includes('individual')) {
      mappedData.businessType = 'Individual';
    } else if (businessType.includes('joint')) {
      mappedData.businessType = 'Joint Venture';
    }
  }
  
  return mappedData;
}