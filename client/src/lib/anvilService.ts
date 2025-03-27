import { FormDataType } from '@shared/schema';
import { apiRequest } from './queryClient';

// Define a type including only the ACORD 125 specific fields to help with type checking
type Acord125FormData = FormDataType;

/**
 * Maps form data to Anvil PDF field names for ACORD 125 form
 * Returns the properly formatted data for Anvil's fillPDF endpoint
 */
export function mapFormDataToAnvilFields(formData: Acord125FormData): Record<string, any> {
  // Format date as YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  
  // Determine the business type flags (default to Corporation if not specified)
  const businessType = formData.businessType || "corporation";
  
  // Create a structure that matches the Anvil expected payload format
  return {
    // Template information
    title: "Acord 125",
    fontSize: 10,
    textColor: "#333333",
    
    // Nested data object as per the Anvil example
    data: {
      // Transaction info
      transactionStatus: "Quote",
      transactionType: "New",
      date: today,
      proposedEffectiveDate: formData.startDate || today,
      proposedExpirationDate: formData.endDate || today,
      
      // Agency info
      agency: formData.agency || "",
      agencyCustomerId: formData.agencyCustomerId || "",
      carrier: formData.carrier || "",
      naicCode: formData.naicCode || "",
      policyNumber: formData.policyNumber || "",
      
      // Named Insured - Use company name if available
      applicantName: formData.namedInsured 
        ? { fullName: formData.namedInsured } 
        : {
            firstName: formData.firstName || "",
            mi: formData.middleInitial || "",
            lastName: formData.lastName || ""
          },
      
      // Business type
      applicantBusinessType: businessType.charAt(0).toUpperCase() + businessType.slice(1),
      
      // Codes and identifiers from the form
      glCode: formData.glCode || "",
      sic: formData.sic || "",
      naics: formData.naics || "",
      feinOrSocSec: formData.insuredFein || formData.feinOrSocSec || "",
      
      // Mailing address - use better field mapping
      mailingAddress: {
        street1: formData.mailingAddress || formData.insuredAddress || "",
        street2: formData.mailingAddress2 || "",
        city: formData.mailingCity || formData.insuredCity || "",
        state: formData.mailingState || formData.insuredState || "",
        zip: formData.mailingZipCode || formData.insuredZip || "",
        country: "US"
      },
      
      // Contact info
      businessPhone: {
        num: formData.businessPhone || formData.phone || "",
        region: "US",
        baseRegion: "US"
      },
      websiteAddress: formData.websiteAddress || "",
      
      // Nature of business
      natureOfBusiness: formData.natureOfBusiness || formData.businessNature || "",
      descriptionOfPrimaryOperations: formData.descriptionOfPrimaryOperations || "",
      
      // Premises information if available
      premisesInformation1: formData.locationStreet ? {
        street1: formData.locationStreet || "",
        street2: "",
        city: formData.locationCity || "",
        state: formData.locationState || "",
        zip: formData.locationZip || "",
        country: "US"
      } : undefined,
      
      // Business details
      fullTimeEmployees: formData.fullTimeEmployees || 0,
      partTimeEmployees: formData.partTimeEmployees || 0,
      annualRevenues: formData.annualRevenue || 0,
      
      // Business type flags - set based on the actual business type
      corporation: businessType === "corporation",
      individual: businessType === "individual",
      partnership: businessType === "partnership",
      jointVenture: businessType === "jointVenture",
      llc: businessType === "llc",
      trust: businessType === "trust",
      notForProfitOrg: businessType === "nonProfit" || businessType === "notForProfitOrg",
      subchapterSCorporation: businessType === "subchapterSCorp"
    }
  };
}

/**
 * Fills a PDF using Anvil API and returns a downloadable PDF URL
 * @param formData The form data to fill the PDF with
 * @returns A promise that resolves to the filled PDF URL
 */
export async function fillPdfWithAnvil(formData: FormDataType): Promise<string> {
  try {
    // Format the data for Anvil
    const anvilData = mapFormDataToAnvilFields(formData);
    
    console.log('Sending data to Anvil:', JSON.stringify(anvilData));
    
    // Make a request to our backend to fill the PDF
    // We pass the already fully mapped data, not the raw form data
    const response = await apiRequest<{ pdfUrl: string }>('/api/fill-pdf', {
      method: 'POST',
      body: JSON.stringify({ formData: anvilData }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.pdfUrl) {
      return response.pdfUrl;
    } else {
      throw new Error('No PDF URL returned from server');
    }
  } catch (error) {
    console.error('Error filling PDF with Anvil:', error);
    throw error;
  }
}