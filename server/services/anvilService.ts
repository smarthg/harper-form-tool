import fs from 'fs';
import path from 'path';
import Anvil from '@anvilco/anvil';
import dotenv from 'dotenv';

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
    const pdfTemplateFile = path.join(__dirname, '../../client/public/templates/acord125.pdf');
    
    // Read the PDF template as a buffer
    const pdfTemplate = fs.readFileSync(pdfTemplateFile);
    
    // Cast file to base64
    const pdfTemplateBase64 = pdfTemplate.toString('base64');
    
    // Fill the PDF with Anvil
    // The Anvil API expects a specific format for filling PDFs
    const payload = {
      title: 'ACORD 125 Commercial Insurance Application',
      data: data,
      file: pdfTemplateBase64
    };
    
    // Fill PDF with a temporary Eid (this is mock for development)
    // In production, you would use an actual Eid from your Anvil account
    const tempEid = 'temp-eid';
    
    // Make the fill PDF request using the Anvil client
    // The API signature is fillPDF(eid, payload, options)
    const response = await anvilClient!.fillPDF(
      tempEid,
      {
        data,
        file: pdfTemplateBase64
      },
      {} // Empty options object as third parameter
    );
    
    // The response from Anvil API is an object with data property containing PDF as base64 string
    if (!response || !response.data) {
      throw new Error('Invalid response from Anvil API');
    }
    
    // Return the filled PDF as a buffer
    return Buffer.from(response.data, 'base64');
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
  const uploadDir = path.join(__dirname, '../../client/public/uploads');
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