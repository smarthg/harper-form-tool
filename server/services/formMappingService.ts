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
    
    // Extract the most important company information first to reduce token size
    // Get the company object from the response if needed
    const company = companyData.company?.json?.company || companyData;
    
    // Create a focused dataset with only the most relevant company properties
    const importantCompanyData = extractImportantCompanyData(company);
    
    // Process data in chunks to avoid token limits
    console.log('Processing company data in chunks to avoid token limits');
    console.log('Important company data chunk:', JSON.stringify(importantCompanyData, null, 2));
    
    // First, process the important data to get initial mappings
    const initialMappings = await processCompanyDataChunk(
      importantCompanyData, 
      formFields,
      'Provide the best mapping from this data, focusing only on the most important fields.'
    );
    
    console.log('Initial mappings result:', JSON.stringify(initialMappings, null, 2));
    
    // Then, process any additional chunks if needed by focusing on specific form sections
    let finalMappings = { ...initialMappings };
    
    // Try to enhance the mappings with more specific sections if initial mapping is too small
    if (Object.keys(initialMappings).length < 5) {
      // Get additional mappings for specific form sections
      try {
        // Process address information 
        if (company.company_street_address_1 || company.company_city || company.company_state) {
          const addressData = {
            street_address_1: company.company_street_address_1,
            street_address_2: company.company_street_address_2,
            city: company.company_city,
            state: company.company_state,
            postal_code: company.company_postal_code,
            country: company.company_country
          };
          
          console.log('Address data chunk:', JSON.stringify(addressData, null, 2));
          
          const addressMappings = await processCompanyDataChunk(
            addressData,
            formFields,
            'Map this address information to form fields like mailingAddress, locationAddress, etc.'
          );
          
          console.log('Address mappings result:', JSON.stringify(addressMappings, null, 2));
          
          finalMappings = { ...finalMappings, ...addressMappings };
        }
        
        // Process business type information
        if (company.company_legal_entity_type || company.company_type) {
          const businessTypeData = {
            legal_entity_type: company.company_legal_entity_type,
            company_type: company.company_type,
            company_description: company.company_description
          };
          
          console.log('Business type data chunk:', JSON.stringify(businessTypeData, null, 2));
          
          const businessTypeMappings = await processCompanyDataChunk(
            businessTypeData,
            formFields,
            'Map this business entity information to businessType field (like corporation, llc, etc.)'
          );
          
          console.log('Business type mappings result:', JSON.stringify(businessTypeMappings, null, 2));
          
          finalMappings = { ...finalMappings, ...businessTypeMappings };
        }
      } catch (chunkError) {
        console.error('Error processing additional data chunks:', chunkError);
        // Continue with what we already have if chunk processing fails
      }
    }
    
    console.log('AI successfully mapped company data to form fields');
    console.log('Final mappings result:', JSON.stringify(finalMappings, null, 2));
    return finalMappings;
  } catch (error) {
    console.error('Error processing company data with OpenAI:', error);
    // Fall back to basic mapping if AI processing fails
    return basicCompanyDataMapping(companyData);
  }
}

/**
 * Extract the most important company data to reduce token size
 */
function extractImportantCompanyData(company: any): Record<string, any> {
  // Create a focused subset of the most important company properties
  return {
    company_name: company.company_name,
    company_primary_phone: company.company_primary_phone,
    company_primary_email: company.company_primary_email,
    company_description: company.company_description,
    company_naics_code: company.company_naics_code,
    company_sic_code: company.company_sic_code,
    company_type: company.company_type || company.company_legal_entity_type,
    company_website: company.company_website,
    company_year_founded: company.company_year_founded,
    company_ein: company.company_ein,
    address: `${company.company_street_address_1 || ''} ${company.company_street_address_2 || ''}, ${company.company_city || ''}, ${company.company_state || ''} ${company.company_postal_code || ''}`.trim(),
    annual_revenue: company.company_annual_revenue,
    employees: company.company_employee_count,
    industry: company.company_industry,
    sub_industry: company.company_sub_industry
  };
}

/**
 * Process a chunk of company data with OpenAI for form field mapping
 */
async function processCompanyDataChunk(
  dataChunk: Record<string, any>,
  formFields: Record<string, { type: string, label: string }>,
  instructions: string
): Promise<Record<string, any>> {
  if (!openai) {
    return {};
  }
  
  try {
    // Create a focused prompt for this data chunk
    const prompt = `
    I need to map this company data to an ACORD 125 (Commercial Insurance Application) form.
    
    Here's the company data chunk:
    ${JSON.stringify(dataChunk, null, 2)}
    
    Here are the form fields I need to fill:
    ${JSON.stringify(formFields, null, 2)}
    
    ${instructions}
    
    Return ONLY a JSON object with form field names as keys and extracted values from the company data as values.
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
      max_tokens: 1000
    });
    
    // Extract the response text
    const aiResponseText = response.choices[0]?.message?.content || '';
    
    console.log('OpenAI raw response text:', aiResponseText);
    
    // Parse the JSON response
    const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not extract JSON from AI chunk response:', aiResponseText);
      return {};
    }
    
    try {
      const mappedData = JSON.parse(jsonMatch[0]);
      return mappedData;
    } catch (parseError) {
      console.error('Error parsing AI chunk response JSON:', parseError);
      return {};
    }
  } catch (error) {
    console.error('Error processing company data chunk with OpenAI:', error);
    return {};
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