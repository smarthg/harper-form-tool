import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anvil from '@anvilco/anvil';
import dotenv from 'dotenv';

// Get the current directory path (equivalent to __dirname in CommonJS)
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);

// Define the type for the mapDataToAnvilFormat function
type DataMapper = (data: Record<string, any>) => Record<string, any>;

// Load environment variables
dotenv.config();

// Initialize Anvil client with API key
let anvilClient: Anvil | null = null;

/**
 * Initialize Anvil client with API key
 * @param apiKey The Anvil API key
 */
export function initializeAnvil(apiKey: string): void {
  anvilClient = new Anvil({ apiKey });
}

/**
 * Check if Anvil client is initialized with an API key
 * @returns True if Anvil client is initialized, false otherwise
 */
export function isAnvilInitialized(): boolean {
  return anvilClient !== null;
}

/**
 * Fill a PDF form using Anvil API
 * @param data The data to fill the form with
 * @returns The filled PDF as a Buffer
 */
export async function fillPdf(data: Record<string, any>): Promise<Buffer> {
  if (!anvilClient) {
    if (!process.env.ANVIL_API_KEY) {
      throw new Error('Anvil API key not configured. Please set ANVIL_API_KEY in .env file.');
    }
    
    // Initialize Anvil client if not already initialized
    initializeAnvil(process.env.ANVIL_API_KEY);
  }
  
  try {
    // We don't need to read the template file anymore since we're using a template ID from Anvil
    
    // Now we'll use fillPDF with an actual template ID
    let mappedData = mapDataToAnvilFormat(data);
    
    // Include some test data if we get an empty object
    // This ensures we have something to send to Anvil for testing
    if (Object.keys(mappedData).length === 0) {
      console.log('Warning: No mapped data available, adding test data for debugging');
      mappedData = {
        'named_insured': 'Test Business Name',
        'mailing_address': '123 Test Street',
        'mailing_city': 'Test City',
        'mailing_state': 'TX',
        'mailing_zip': '12345'
      };
    }
    
    // Create a final object to send to Anvil
    const anvilData = mappedData;
    
    // Log the mapped data for debugging
    console.log('Anvil data for PDF filling:', JSON.stringify(anvilData, null, 2));
    
    // When using a template ID, we only need to provide the data
    // The template is already stored on Anvil's servers
    const payload = {
      data: anvilData
    };
    
    let pdfResponse;
    
    try {
      // Use the provided template ID from Anvil
      const templateId = 'gfCWlUgpFz7Bvpb84Obw';
      console.log('Attempting to fill PDF with Anvil using template ID:', templateId);
      
      // Make the fillPDF request with the payload
      const response = await anvilClient!.fillPDF(templateId, payload);
      pdfResponse = response;
      
      console.log('Anvil API response status:', response ? 'Success' : 'Empty response');
      console.log('Anvil API response type:', typeof response);
      
      // Check the response
      if (!response) {
        console.error('Anvil API returned empty response');
        throw new Error('Empty response from Anvil API');
      }
      
      // For better debugging, let's log all response keys but not their values
      console.log('Anvil response keys:', Object.keys(response));
      
      // The response from Anvil API is an object with statusCode and data properties
      if (response.statusCode && response.statusCode !== 200) {
        console.error(`Anvil API error: Status ${response.statusCode}`);
        
        // Try to extract more details from the error response
        if (response.errors) {
          console.error('Anvil API error details:', JSON.stringify(response.errors, null, 2));
          throw new Error(`Anvil API returned error status: ${response.statusCode}, Details: ${JSON.stringify(response.errors)}`);
        } else {
          console.error('Full Anvil error response:', JSON.stringify(response, null, 2));
          throw new Error(`Anvil API returned error status: ${response.statusCode}`);
        }
      }
      
      if (!response.data) {
        console.error('Anvil API response missing data property');
        throw new Error('Invalid response format from Anvil API');
      }
    } catch (anvErr) {
      console.error('Anvil API error details:', anvErr);
      throw anvErr;
    }
    
    // Return the filled PDF as a buffer
    return Buffer.from(pdfResponse.data, 'base64');
  } catch (error) {
    console.error('Error filling PDF with Anvil:', error);
    throw error;
  }
}

/**
 * Store the filled PDF temporarily and return a URL to download it
 * @param filledPdf The filled PDF buffer
 * @returns The URL to download the filled PDF
 */
export function storePdfTemporarily(filledPdf: Buffer): string {
  // Create a unique filename with timestamp
  const timestamp = new Date().getTime();
  const filename = `acord125_filled_${timestamp}.pdf`;
  
  // Create directory if it doesn't exist
  const uploadDir = path.join(currentDirPath, '../../client/public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Path to save the filled PDF
  const filePath = path.join(uploadDir, filename);
  
  // Write the filled PDF to the file
  fs.writeFileSync(filePath, filledPdf);
  
  // Return the URL to download the filled PDF
  return `/uploads/${filename}`;
}

/**
 * Map form data to Anvil's expected format for PDF filling
 * @param data Form data from the application
 * @returns Data formatted for Anvil PDF filling
 */
function mapDataToAnvilFormat(data: Record<string, any>): Record<string, any> {
  // The Anvil template expects data in a specific format based on the ACORD 125 form
  // This function will map our form data to match Anvil's expected structure
  
  // Create an object that matches the structure expected by Anvil
  const mappedData: Record<string, any> = {
    // Transaction Information
    transactionStatus: data.transactionStatus || "Quote",
    transactionType: data.transactionType || "New",
    timeOfDay: data.timeOfDay || "AM",
    proposedEffectiveDate: data.proposedEffectiveDate || new Date().toISOString().split('T')[0],
    proposedExpirationDate: data.proposedExpirationDate || new Date().toISOString().split('T')[0],
    
    // Form Basic Information
    date: new Date().toISOString().split('T')[0],
    agency: data.agency || "",
    carrier: data.carrier || "",
    naicCode: data.naicCode || "",
    companyPolicyOrProgramName: data.companyPolicyOrProgramName || "",
    programCode: data.programCode || "",
    policyNumber: data.policyNumber || "",
    underwriter: data.underwriter || "",
    underwriterOffice: data.underwriterOffice || "",
    agencyCustomerId: data.agencyCustomerId || "",
    
    // Applicant Information
    applicantName: {
      firstName: data.firstName || "",
      mi: data.middleInitial || "",
      lastName: data.lastName || ""
    },
    applicantBusinessType: data.businessType || "Corporation",
    mailingAddress: {
      street1: data.mailingStreet1 || "",
      street2: data.mailingStreet2 || "",
      city: data.mailingCity || "",
      state: data.mailingState || "",
      zip: data.mailingZip || "",
      country: data.mailingCountry || "US"
    },
    glCode: data.glCode || "",
    sic: data.sic || "",
    naics: data.naics || "",
    feinOrSocSec: data.feinOrSocSec || "",
    businessPhone: {
      num: data.businessPhone || "",
      region: "US",
      baseRegion: "US"
    },
    websiteAddress: data.websiteAddress || "",
    
    // Premises Information
    premisesInformation1: data.premisesInformation1 ? data.premisesInformation1 : {
      street1: data.premisesStreet1 || "",
      street2: data.premisesStreet2 || "",
      city: data.premisesCity || "",
      state: data.premisesState || "",
      zip: data.premisesZip || "",
      country: data.premisesCountry || "US"
    },
    
    // Nature of Business
    natureOfBusiness: data.natureOfBusiness || "",
    descriptionOfPrimaryOperations: data.descriptionOfPrimaryOperations || "",
    
    // Business Info
    fullTimeEmployees: data.fullTimeEmployees || 0,
    partTimeEmployees: data.partTimeEmployees || 0,
    annualRevenues: data.annualRevenues || 0,
  };
  
  // Add conditional business type flags
  if (data.businessType) {
    mappedData.corporation = data.businessType === "Corporation";
    mappedData.individual = data.businessType === "Individual";
    mappedData.partnership = data.businessType === "Partnership";
    mappedData.jointVenture = data.businessType === "Joint Venture";
    mappedData.llc = data.businessType === "LLC";
    mappedData.notForProfitOrg = data.businessType === "Not For Profit Org";
    mappedData.subchapterSCorporation = data.businessType === "Subchapter \"S\" Corporation";
    mappedData.trust = data.businessType === "Trust";
  }
  
  // Add premium information if provided
  if (data.propertyPremium) mappedData.propertyPremium = data.propertyPremium;
  if (data.commercialGeneralLiabilityPremium) mappedData.commercialGeneralLiabilityPremium = data.commercialGeneralLiabilityPremium;
  if (data.businessAutoPremium) mappedData.businessAutoPremium = data.businessAutoPremium;
  if (data.umbrellaPremium) mappedData.umbrellaPremium = data.umbrellaPremium;
  
  // Add any other fields that may be in the data
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && !mappedData[key]) {
      mappedData[key] = value;
    }
  }
  
  return mappedData;
}