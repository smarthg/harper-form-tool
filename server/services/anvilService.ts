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
 * @param formType Optional form type to specify which template to use
 * @returns The filled PDF as a Buffer
 */
export async function fillPdf(data: Record<string, any>, formType?: string): Promise<Buffer> {
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
      // Map the data to Anvil format based on form type
      if (formType === 'acord126' || data.formType === 'acord126') {
        anvilData = mapAcord126DataToAnvilFormat(data);
        console.log('Using ACORD 126 server-side data mapping');
      } else {
        anvilData = mapDataToAnvilFormat(data);
        console.log('Using ACORD 125 server-side data mapping');
      }
    }
    
    // Log the data for debugging
    console.log('Anvil data for PDF filling:', 
      `Title: ${anvilData.title}, Data fields: ${Object.keys(anvilData.data).length}`);
    
    // Create a simpler payload with just the template ID and the data
    // Default template ID for ACORD 125, but can be overridden for ACORD 126
    const formTypeToUse = formType || data.formType || 'acord125';
    const templateId = formTypeToUse === 'acord126' ? 'QQ7LjLk2gAjhPIS6MbnW' : 'gfCWlUgpFz7Bvpb84Obw';
    
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
export function storePdfTemporarily(filledPdf: Buffer, formType: string = 'acord125'): string {
  // Create a unique filename with timestamp
  const timestamp = new Date().getTime();
  const filename = `${formType}_filled_${timestamp}.pdf`;
  
  // Find the public directory path that will work both locally and in deployment
  // In Replit, we need to ensure we're using a path that will be accessible from the web
  let publicDir = '';
  
  // Check if we're running in Replit deployment
  if (process.env.REPL_ID) {
    // In Replit, use an absolute path to ensure it works in deployment
    publicDir = path.resolve(process.cwd(), 'public');
  } else {
    // For local development, use the previous relative path
    publicDir = path.join(currentDirPath, '../../client/public');
  }
  
  // Create uploads directory under the public directory
  const uploadDir = path.join(publicDir, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Path to save the filled PDF
  const filePath = path.join(uploadDir, filename);
  
  // Write the filled PDF to the file
  fs.writeFileSync(filePath, filledPdf);
  
  // Log the storage location for debugging
  console.log('PDF saved to:', filePath);
  
  // Return the URL to download the filled PDF
  return `/uploads/${filename}`;
}

/**
 * Map form data to Anvil's expected format for PDF filling
 * @param data Form data from the application
 * @returns Data formatted for Anvil PDF filling for ACORD 125
 */
function mapDataToAnvilFormat(data: Record<string, any>): Record<string, any> {
  // Create a structure that exactly matches the Anvil example payload
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  // Check for pre-formatted data or specific form type
  if (data.title && data.data) {
    console.log("Using pre-formatted data with Anvil template structure");
    return data;
  }
  
  // If this is ACORD 126 data, don't try to map it here
  // The main fillPdf function will handle it with the correct template ID
  if (data.formType === 'acord126') {
    console.log("ACORD 126 data detected, letting fillPdf handle it");
    return data;
  }
  
  // Otherwise, map the data to the Anvil format
  console.log("Mapping data to Anvil format");
  
  // Determine business type to set appropriate flags (default to Corporation)
  const businessType = data.businessType || "corporation";
  
  // Handle applicant name
  let applicantName: any = {};
  if (data.namedInsured) {
    // Try to use the company name as fullName if available
    applicantName = { 
      fullName: data.namedInsured 
    };
  } else if (data.insuredCompanyName) {
    // Or use the insured company name if available
    applicantName = { 
      fullName: data.insuredCompanyName 
    };
  } else {
    // Otherwise use individual name components
    applicantName = {
      firstName: data.firstName || "",
      mi: data.middleInitial || "",
      lastName: data.lastName || ""
    };
  }
  
  // Create the payload structure to match Anvil's exact expected format
  return {
    // Template information
    title: "Acord 125",
    fontSize: 10,
    textColor: "#333333",
    
    // Nest all form data under the "data" key
    data: {
      // Transaction Information
      transactionStatus: "Quote",
      transactionType: "New",
      timeOfDay: "AM", // Required field
      proposedEffectiveDate: data.startDate || today,
      proposedExpirationDate: data.endDate || today,
      date: today,
      
      // Agency/Policy Information
      agency: data.agency || "",
      carrier: data.carrier || "",
      naicCode: data.naicCode || "",
      companyPolicyOrProgramName: "",
      programCode: "",
      policyNumber: data.policyNumber || "",
      underwriter: "",
      underwriterOffice: "",
      agencyCustomerId: data.agencyCustomerId || "",
      
      // Applicant Information
      applicantName: applicantName,
      applicantBusinessType: businessType.charAt(0).toUpperCase() + businessType.slice(1),
      
      // Business Codes and Identifiers
      glCode: data.glCode || "",
      sic: data.sic || "",
      naics: data.naics || "",
      feinOrSocSec: data.feinOrSocSec || data.insuredFein || "",
      
      // Mailing Address
      mailingAddress: {
        street1: data.mailingAddress || data.insuredAddress || "",
        street2: data.mailingAddress2 || "",
        city: data.mailingCity || data.insuredCity || "",
        state: data.mailingState || data.insuredState || "",
        zip: data.mailingZipCode || data.insuredZip || "",
        country: "US"
      },
      
      // Contact Information
      businessPhone: {
        num: data.businessPhone || data.phone || data.insuredPhone || "",
        region: "US", 
        baseRegion: "US"
      },
      websiteAddress: data.websiteAddress || data.insuredWebsite || "",
      
      // Premises Information
      premisesInformation1: {
        street1: data.locationStreet || data.insuredAddress || "",
        street2: "",
        city: data.locationCity || data.insuredCity || "",
        state: data.locationState || data.insuredState || "",
        zip: data.locationZip || data.insuredZip || "",
        country: "US"
      },
      
      // Business Details
      natureOfBusiness: data.natureOfBusiness || 
        (data.businessNature === "office" ? "Office" :
         data.businessNature === "retail" ? "Retail" :
         data.businessNature === "apartments" ? "Apartments" :
         data.businessNature === "contractor" ? "Contractor" :
         data.businessNature === "manufacturing" ? "Manufacturing" :
         data.businessNature === "wholesale" ? "Wholesale" : ""),
      descriptionOfPrimaryOperations: data.descriptionOfPrimaryOperations || data.operationsDescription || "",
      fullTimeEmployees: parseInt(data.fullTimeEmployees || "0") || 0,
      partTimeEmployees: parseInt(data.partTimeEmployees || "0") || 0,
      annualRevenues: parseFloat(data.annualRevenue || "0") || 0,
      
      // Business Type Flags - only one should be checked based on the business type
      corporation: businessType === "corporation",
      individual: businessType === "individual", 
      partnership: businessType === "partnership",
      jointVenture: businessType === "jointVenture",
      llc: businessType === "llc",
      trust: businessType === "trust",
      notForProfitOrg: businessType === "nonProfit" || businessType === "notForProfitOrg",
      subchapterSCorporation: businessType === "subchapterSCorp",
      
      // Duplicate fields that may be needed for the PDF template
      applicantName1: applicantName,
      mailingAddress1: {
        street1: data.mailingAddress || data.insuredAddress || "",
        street2: data.mailingAddress2 || "",
        city: data.mailingCity || data.insuredCity || "",
        state: data.mailingState || data.insuredState || "",
        zip: data.mailingZipCode || data.insuredZip || "",
        country: "US"
      },
      glCode1: data.glCode || "",
      sic1: data.sic || "",
      naics1: data.naics || "",
      feinOrSocSec1: data.feinOrSocSec || data.insuredFein || ""
    }
  };
}

/**
 * Map ACORD 126 form data to Anvil's expected format for PDF filling
 * @param data Form data from the application
 * @returns Data formatted for Anvil PDF filling for ACORD 126
 */
function mapAcord126DataToAnvilFormat(data: Record<string, any>): Record<string, any> {
  // Create a structure that matches Anvil's expected format for ACORD 126
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  // Extract applicant name
  let applicantName = data.applicantFirstNamedInsured || 
                      data.namedInsured || 
                      data.insuredCompanyName || 
                      "";
  
  // Create the payload structure for ACORD 126
  return {
    // Template information
    title: "Acord 126",
    fontSize: 10,
    textColor: "#333333",
    
    // Nest all form data under the "data" key
    data: {
      // Basic Information
      agencyCustomerId: data.agencyCustomerId || "",
      effectiveDate: data.effectiveDate || today,
      agency: data.agency || "",
      carrier: data.carrier || "",
      naicCode: data.naicCode || "",
      policyNumber: data.policyNumber || "",
      applicantFirstNamedInsured: applicantName,
      
      // Coverage / Limits
      coverageType: data.coverageType || "",
      claimsOccurrence: data.claimsOccurrence || "",
      generalAggregate: data.generalAggregate || "",
      limitAppliesPer: Array.isArray(data.limitAppliesPer) ? data.limitAppliesPer.join(', ') : (data.limitAppliesPer || ""),
      productsCompletedOperationsAggregate: data.productsCompletedOperationsAggregate || "",
      personalAdvertisingInjury: data.personalAdvertisingInjury || "",
      eachOccurrence: data.eachOccurrence || "",
      damageToRentedPremises: data.damageToRentedPremises || "",
      medicalExpense: data.medicalExpense || "",
      employeeBenefits: data.employeeBenefits || "",
      
      // Deductibles
      propertyDamage: data.propertyDamage || "",
      bodilyInjury: data.bodilyInjury || "",
      deductibleType: data.deductibleType || "",
      
      // Premiums
      premiseOperations: data.premiseOperations || "",
      products: data.products || "",
      other: data.other || "",
      total: data.total || "",
      
      // Additional Coverages
      otherCoverages: data.otherCoverages || "",
      umUimCoverage: data.umUimCoverage || "",
      medicalPaymentsCoverage: data.medicalPaymentsCoverage || "",
      
      // Schedule of Hazards
      classificationDescription: data.classificationDescription || "",
      ratingPremiumBasis: Array.isArray(data.ratingPremiumBasis) ? data.ratingPremiumBasis.join(', ') : (data.ratingPremiumBasis || ""),
      
      // Claims Made
      proposedRetroactiveDate: data.proposedRetroactiveDate || "",
      entryDateUninterruptedClaimsMadeCoverage: data.entryDateUninterruptedClaimsMadeCoverage || "",
      excludedUninsuredSelfInsured: data.excludedUninsuredSelfInsured || "",
      tailCoveragePurchased: data.tailCoveragePurchased || "",
      
      // Employee Benefits Liability
      deductiblePerClaim: data.deductiblePerClaim || "",
      numberOfEmployees: data.numberOfEmployees || "",
      employeesCoveredByBenefitsPlans: data.employeesCoveredByBenefitsPlans || "",
      retroactiveDate: data.retroactiveDate || "",
      
      // Contractors
      drawPlansDesigns: data.drawPlansDesigns || "",
      operationsIncludeBlasting: data.operationsIncludeBlasting || "",
      operationsIncludeExcavation: data.operationsIncludeExcavation || "",
      subcontractorsCoveragesLessThanYours: data.subcontractorsCoveragesLessThanYours || "",
      subcontractorsWithoutCertificate: data.subcontractorsWithoutCertificate || "",
      leaseEquipmentToOthers: data.leaseEquipmentToOthers || ""
    }
  };
}