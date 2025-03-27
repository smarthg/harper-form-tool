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
      
      // Applicant info with fallbacks for required fields
      applicantName: {
        firstName: formData.firstName || "Test",  // Fallback value
        mi: "",
        lastName: formData.lastName || "Client"   // Fallback value
      },
      
      // Business type
      applicantBusinessType: "Corporation",
      
      // Mailing address with fallbacks
      mailingAddress: {
        street1: formData.insuredAddress || "123 Main St",
        street2: "",
        city: formData.insuredCity || "San Francisco",
        state: formData.insuredState || "CA",
        zip: formData.insuredZip || "94103",
        country: "US"
      },
      
      // Contact info
      businessPhone: {
        num: formData.phone || "5555555555", 
        region: "US",
        baseRegion: "US"
      },
      
      // Business info
      natureOfBusiness: formData.businessNature || "Office",
      feinOrSocSec: formData.insuredFein || "",
      
      // Some business type flags
      corporation: true,
      individual: false,
      partnership: false,
      jointVenture: false,
      llc: false,
      trust: false,
      notForProfitOrg: false,
      subchapterSCorporation: false
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