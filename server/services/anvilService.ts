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
    // Check if the data is already formatted for Anvil
    let anvilData: Record<string, any>;
    
    if (data.title && data.data) {
      // The data is already in the correct format from the client
      anvilData = data;
      console.log('Using pre-formatted data from client');
    } else {
      // Map the data to Anvil format
      anvilData = mapDataToAnvilFormat(data);
      console.log('Using server-side data mapping');
    }
    
    // Log the data for debugging
    console.log('Anvil data for PDF filling:', 
      `Title: ${anvilData.title}, Data fields: ${Object.keys(anvilData.data).length}`);
    
    // Create a simpler payload with just the template ID and the data
    const templateId = 'gfCWlUgpFz7Bvpb84Obw';
    
    try {
      console.log('Attempting to fill PDF with Anvil using template ID:', templateId);
      
      // Use the simpler format where we pass the entire object as the payload
      // This matches the example format exactly
      const response = await anvilClient!.fillPDF(templateId, anvilData);
      
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
      
      // Return the filled PDF as a buffer
      return Buffer.from(response.data, 'base64');
    } catch (anvErr) {
      console.error('Anvil API error details:', anvErr);
      throw anvErr;
    }
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
  // Create a simpler flat structure that follows the Anvil example payload
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  // Create a flat structure with basic information
  const mappedData: Record<string, any> = {
    // Basic information with today's date
    title: "Acord 125",
    fontSize: 10,
    textColor: "#333333",
    
    // We're nesting all the actual data under a "data" key
    // as per the Anvil template example
    data: {
      // Transaction Information - with defaults
      transactionStatus: "Quote",
      transactionType: "New",
      date: today,
      proposedEffectiveDate: data.startDate || today,
      proposedExpirationDate: data.endDate || today,
      
      // Agency Information
      agency: data.agency || "",
      agencyCustomerId: data.agencyCustomerId || "",
      carrier: data.carrier || "",
      naicCode: data.naicCode || "",
      policyNumber: data.policyNumber || "",
      
      // Applicant Information - using a simpler approach
      applicantName: {
        firstName: data.firstName || "Test", // Default value if empty
        mi: "",
        lastName: data.lastName || "Client"  // Default value if empty
      },
      
      // Business Type
      applicantBusinessType: "Corporation",
      
      // Simple mailing address
      mailingAddress: {
        street1: data.insuredAddress || "123 Main St",
        street2: "",
        city: data.insuredCity || "San Francisco",
        state: data.insuredState || "CA",
        zip: data.insuredZip || "94103",
        country: "US"
      },
      
      // Contact Info
      businessPhone: {
        num: data.phone || "5555555555",
        region: "US", 
        baseRegion: "US"
      },
      
      // Property Info - only include essential fields
      natureOfBusiness: data.businessNature || "Office",
      feinOrSocSec: data.insuredFein || ""
    }
  };
  
  // Return the simplified structure
  return mappedData;
}