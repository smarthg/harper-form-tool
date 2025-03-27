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
  
  // Determine which business type checkbox should be true
  const businessType = formData.businessType || "corporation";
  
  // Construct the applicant name based on available data
  let applicantName: any = {};
  if (formData.namedInsured) {
    // Try to use the company name as fullName if available
    applicantName = { 
      fullName: formData.namedInsured 
    };
  } else if (formData.insuredCompanyName) {
    // Or use the insured company name if available
    applicantName = { 
      fullName: formData.insuredCompanyName 
    };
  } else {
    // Otherwise use individual name components
    applicantName = {
      firstName: formData.firstName || "",
      mi: formData.middleInitial || "",
      lastName: formData.lastName || ""
    };
  }

  // Create a structure that exactly matches the Anvil expected payload format
  return {
    // Template information - these are required
    title: "Acord 125",
    fontSize: 10,
    textColor: "#333333",
    
    // Anvil requires all data under the 'data' key
    data: {
      // Transaction Information section
      transactionStatus: "Quote",
      transactionType: "New",
      timeOfDay: "AM",
      proposedEffectiveDate: formData.startDate || today,
      proposedExpirationDate: formData.endDate || today,
      date: today,
      
      // Agency/Policy Information section
      agency: formData.agency || "",
      carrier: formData.carrier || "",
      naicCode: formData.naicCode || "",
      policyNumber: formData.policyNumber || "",
      companyPolicyOrProgramName: "",
      programCode: "",
      underwriter: "",
      underwriterOffice: "",
      agencyCustomerId: formData.agencyCustomerId || "",
      
      // Applicant Information section - critical field
      applicantName: applicantName,
      
      // Business Type
      applicantBusinessType: businessType.charAt(0).toUpperCase() + businessType.slice(1),
      
      // Mailing Address - critical field
      mailingAddress: {
        street1: formData.mailingAddress || formData.insuredAddress || "",
        street2: formData.mailingAddress2 || "",
        city: formData.mailingCity || formData.insuredCity || "",
        state: formData.mailingState || formData.insuredState || "",
        zip: formData.mailingZipCode || formData.insuredZip || "",
        country: "US"
      },
      
      // Business Codes and Identifiers
      glCode: formData.glCode || "",
      sic: formData.sic || "",
      naics: formData.naics || "",
      feinOrSocSec: formData.feinOrSocSec || formData.insuredFein || "",
      
      // Contact Information
      businessPhone: {
        num: formData.businessPhone || formData.phone || formData.insuredPhone || "",
        region: "US",
        baseRegion: "US"
      },
      websiteAddress: formData.websiteAddress || formData.insuredWebsite || "",
      
      // Premises Information - use location data if available
      premisesInformation1: {
        street1: formData.locationStreet || formData.insuredAddress || "",
        street2: "",
        city: formData.locationCity || formData.insuredCity || "",
        state: formData.locationState || formData.insuredState || "",
        zip: formData.locationZip || formData.insuredZip || "",
        country: "US"
      },
      
      // Nature of Business
      natureOfBusiness: formData.natureOfBusiness || 
        (formData.businessNature === "office" ? "Office" :
         formData.businessNature === "retail" ? "Retail" :
         formData.businessNature === "apartments" ? "Apartments" :
         formData.businessNature === "contractor" ? "Contractor" :
         formData.businessNature === "manufacturing" ? "Manufacturing" :
         formData.businessNature === "wholesale" ? "Wholesale" : ""),
         
      // Description of operations
      descriptionOfPrimaryOperations: formData.descriptionOfPrimaryOperations || formData.operationsDescription || "",
      
      // Business Details
      fullTimeEmployees: parseInt(formData.fullTimeEmployees || "0") || 0,
      partTimeEmployees: parseInt(formData.partTimeEmployees || "0") || 0,
      annualRevenues: parseFloat(formData.annualRevenue || "0") || 0,
      
      // Business Type Checkboxes - only one should be true based on the type
      corporation: businessType === "corporation",
      individual: businessType === "individual",
      partnership: businessType === "partnership",
      jointVenture: businessType === "jointVenture",
      llc: businessType === "llc",
      trust: businessType === "trust",
      notForProfitOrg: businessType === "nonProfit" || businessType === "notForProfitOrg",
      subchapterSCorporation: businessType === "subchapterSCorp",
      
      // Additional fields that may be needed for the form
      // These help position elements on some forms
      applicantName1: applicantName,
      mailingAddress1: {
        street1: formData.mailingAddress || formData.insuredAddress || "",
        street2: formData.mailingAddress2 || "",
        city: formData.mailingCity || formData.insuredCity || "",
        state: formData.mailingState || formData.insuredState || "",
        zip: formData.mailingZipCode || formData.insuredZip || "",
        country: "US"
      },
      glCode1: formData.glCode || "",
      sic1: formData.sic || "",
      naics1: formData.naics || "",
      feinOrSocSec1: formData.feinOrSocSec || formData.insuredFein || ""
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