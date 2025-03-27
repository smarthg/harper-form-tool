import { FormDataType } from '@shared/schema';
import { apiRequest } from './queryClient';

// Define a type including only the ACORD 125 specific fields to help with type checking
type Acord125FormData = FormDataType;

/**
 * Maps form data to Anvil PDF field names for ACORD 125 form
 * Returns the properly formatted data for Anvil's fillPDF endpoint
 */
export function mapFormDataToAnvilFields(formData: Acord125FormData): Record<string, any> {
  // Map the form data to the specific field names in the ACORD 125 PDF
  return {
    // Date at the top right
    'DATE (MM/DD/YYYY)': new Date().toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    }),
    
    // Agency information
    'AGENCY': formData.agency || '',
    'CONTACT NAME:': formData.contactName || '',
    'PHONE (A/C, No, Ext):': formData.phone || '',
    'FAX (A/C, No):': formData.fax || '',
    'E-MAIL ADDRESS:': formData.email || '',
    'CODE:': formData.agencyCode || '',
    'SUBCODE:': formData.agencySubcode || '',
    'AGENCY CUSTOMER ID:': formData.agencyCustomerId || '',
    
    // Policy information
    'CARRIER': formData.carrier || '',
    'NAIC CODE': formData.naicCode || '',
    'POLICY NUMBER': formData.policyNumber || '',
    
    // Company information - First Named Insured
    'NAME (First Named Insured) AND MAILING ADDRESS (including ZIP+4)': 
      `${formData.insuredCompanyName || ''}\n${formData.insuredAddress || ''}\n${formData.insuredCity || ''}, ${formData.insuredState || ''} ${formData.insuredZip || ''}`,
    'FEIN OR SOC SEC #': formData.insuredFein || '',
    'BUSINESS PHONE #:': formData.insuredPhone || '',
    'WEBSITE ADDRESS': formData.insuredWebsite || '',
    
    // Business Type - check the appropriate box
    'CORPORATION': formData.businessType === 'corporation' ? 'Yes' : 'No',
    'INDIVIDUAL': formData.businessType === 'individual' ? 'Yes' : 'No',
    'PARTNERSHIP': formData.businessType === 'partnership' ? 'Yes' : 'No',
    'JOINT VENTURE': formData.businessType === 'jointVenture' ? 'Yes' : 'No',
    'LLC': formData.businessType === 'llc' ? 'Yes' : 'No',
    'TRUST': formData.businessType === 'trust' ? 'Yes' : 'No',
    'NOT FOR PROFIT ORG': formData.businessType === 'nonProfit' ? 'Yes' : 'No',
    'SUBCHAPTER "S" CORPORATION': formData.businessType === 'subchapterSCorp' ? 'Yes' : 'No',
    
    // Premises information
    'LOC #': formData.locationNumber || '',
    'STREET': formData.locationStreet || '',
    'CITY:': formData.locationCity || '',
    'STATE:': formData.locationState || '',
    'COUNTY:': formData.locationCounty || '',
    'ZIP:': formData.locationZip || '',
    '# FULL TIME EMPL': formData.fullTimeEmployees || '',
    '# PART TIME EMPL': formData.partTimeEmployees || '',
    'ANNUAL REVENUES: $': formData.annualRevenue || '',
    'OCCUPIED AREA:': formData.occupiedArea || '',
    'TOTAL BUILDING AREA:': formData.totalBuildingArea || '',
    
    // Nature of business
    'APARTMENTS': formData.businessNature === 'apartments' ? 'Yes' : 'No',
    'CONTRACTOR': formData.businessNature === 'contractor' ? 'Yes' : 'No',
    'MANUFACTURING': formData.businessNature === 'manufacturing' ? 'Yes' : 'No',
    'OFFICE': formData.businessNature === 'office' ? 'Yes' : 'No',
    'RETAIL': formData.businessNature === 'retail' ? 'Yes' : 'No',
    'WHOLESALE': formData.businessNature === 'wholesale' ? 'Yes' : 'No',
    'DATE BUSINESS STARTED (MM/DD/YYYY)': formData.businessStartDate || '',
    
    // Description of operations
    'DESCRIPTION OF PRIMARY OPERATIONS': formData.operationsDescription || '',
    
    // Additional fields can be added as needed
  };
}

/**
 * Fills a PDF using Anvil API and returns a downloadable PDF URL
 * @param formData The form data to fill the PDF with
 * @returns A promise that resolves to the filled PDF URL
 */
export async function fillPdfWithAnvil(formData: FormDataType): Promise<string> {
  try {
    const anvilData = mapFormDataToAnvilFields(formData);
    
    // Make a request to our backend to fill the PDF
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