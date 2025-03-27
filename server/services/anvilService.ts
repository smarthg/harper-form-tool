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
    // Path to the PDF template
    const pdfTemplateFile = path.join(currentDirPath, '../../client/public/templates/acord125.pdf');
    
    // Read the PDF template as a buffer
    const pdfTemplate = fs.readFileSync(pdfTemplateFile);
    
    // Cast file to base64
    const pdfTemplateBase64 = pdfTemplate.toString('base64');
    
    // Let's try a simpler approach with Anvil's PDF filling
    // Instead of using generatePDF, we'll use fillPDF with a direct file approach
    const anvilData = mapDataToAnvilFormat(data);
    
    // Log the mapped data for debugging
    console.log('Anvil data for PDF filling:', anvilData);
    
    // Create a simplified payload for Anvil
    const payload = {
      data: anvilData,
      file: pdfTemplateBase64
    };
    
    let pdfResponse;
    
    try {
      // Use a test/sample EID (we're not using an actual template from Anvil)
      const sampleEid = 'sample-eid';
      console.log('Attempting to fill PDF with Anvil using EID:', sampleEid);
      
      // Make the fillPDF request with the payload
      const response = await anvilClient!.fillPDF(sampleEid, payload);
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
        throw new Error(`Anvil API returned error status: ${response.statusCode}`);
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
  // Create a mapping of our form fields to Anvil fields
  // This will depend on the field names in the PDF form
  
  // For ACORD 125 form, convert our field names to match the PDF form field names
  // This is a simplified mapping; you would need to expand this based on your actual PDF form fields
  const mapping: Record<string, string> = {
    // Applicant Information
    'namedInsured': 'NAMED_INSURED',
    'dba': 'DBA',
    'mailingAddress': 'MAILING_ADDRESS',
    'mailingCity': 'MAILING_CITY',
    'mailingState': 'MAILING_STATE',
    'mailingZipCode': 'MAILING_ZIP',
    'email': 'EMAIL',
    'businessPhone': 'PHONE',
    'websiteAddress': 'WEBSITE',
    'feinOrSocSec': 'FEIN',
    
    // Business Information
    'natureOfBusiness': 'NATURE_OF_BUSINESS',
    'descriptionOfPrimaryOperations': 'DESCRIPTION_OF_OPERATIONS',
    'businessType': 'BUSINESS_TYPE',
    'naics': 'NAICS',
    'sic': 'SIC',

    // Agency Information
    'agency': 'AGENCY_NAME',
    'contactName': 'AGENCY_CONTACT',
    'phone': 'AGENCY_PHONE',
    'agencyCustomerID': 'AGENCY_CUSTOMER_ID',
    
    // Additional fields can be added as needed
  };
  
  // Create a new object with the mapped fields
  const mappedData: Record<string, any> = {};
  
  // Copy data from our form to the mapped fields
  for (const [ourField, anvilField] of Object.entries(mapping)) {
    if (data[ourField] !== undefined) {
      mappedData[anvilField] = data[ourField];
    }
  }
  
  // Return the mapped data
  return mappedData;
}