import { FormDataType } from '@shared/schema';
import { apiRequest } from './queryClient';

// Define a type including only the ACORD 125 specific fields to help with type checking
type Acord125FormData = FormDataType;

/**
 * Maps form data to Anvil PDF field names for ACORD 125 form
 * Returns the properly formatted data for Anvil's fillPDF endpoint
 */
export function mapFormDataToAnvilFields(formData: Acord125FormData): Record<string, any> {
  // Map the form data to the structure expected by Anvil
  return {
    // Transaction Information
    transactionStatus: "Quote", // Default to Quote
    transactionType: "New", // Default to New
    timeOfDay: "AM",
    proposedEffectiveDate: formData.startDate || new Date().toISOString().split('T')[0],
    proposedExpirationDate: formData.endDate || new Date().toISOString().split('T')[0],
    
    // Basic form information
    date: new Date().toISOString().split('T')[0],
    
    // Agency Information
    agency: formData.agency || '',
    carrier: formData.carrier || '',
    naicCode: formData.naicCode || '',
    companyPolicyOrProgramName: '', // No direct mapping
    programCode: '', // No direct mapping
    policyNumber: formData.policyNumber || '',
    underwriter: '', // No direct mapping
    underwriterOffice: '', // No direct mapping
    agencyCustomerId: formData.agencyCustomerId || '',
    
    // Applicant Information
    applicantName: {
      firstName: formData.firstName || '',
      mi: '', // Middle initial not in our form data
      lastName: formData.lastName || ''
    },
    applicantBusinessType: convertBusinessType(formData.businessType),
    mailingAddress: {
      street1: formData.insuredAddress || '',
      street2: '', // We don't have street2 in our form
      city: formData.insuredCity || '',
      state: formData.insuredState || '',
      zip: formData.insuredZip || '',
      country: 'US' // Default to US
    },
    glCode: '', // No direct mapping
    sic: '', // No direct mapping
    naics: '', // No direct mapping
    feinOrSocSec: formData.insuredFein || '',
    businessPhone: {
      num: formData.insuredPhone || formData.phone || '',
      region: 'US',
      baseRegion: 'US'
    },
    websiteAddress: formData.insuredWebsite || '',
    
    // Premises Information - using location fields
    premisesInformation1: {
      street1: formData.locationStreet || '',
      street2: '', // No street2 in our form
      city: formData.locationCity || '',
      state: formData.locationState || '',
      zip: formData.locationZip || '',
      country: 'US' // Default to US
    },
    
    // Business Information
    natureOfBusiness: mapBusinessNature(formData.businessNature),
    fullTimeEmployees: parseInt(formData.fullTimeEmployees || '0'),
    partTimeEmployees: parseInt(formData.partTimeEmployees || '0'),
    annualRevenues: parseFloat(formData.annualRevenue || '0'),
    
    // Description of operations
    descriptionOfPrimaryOperations: formData.operationsDescription || '',
    
    // Add policy limits information
    policyPremium: formData.monthlyPremium ? parseFloat(formData.monthlyPremium) * 12 : 0,
    coverageAmount: formData.coverageAmount || '',
    deductible: formData.deductible || '',
    
    // Add conditional business type flags based on businessType
    corporation: formData.businessType === 'corporation',
    individual: formData.businessType === 'individual',
    partnership: formData.businessType === 'partnership',
    jointVenture: formData.businessType === 'jointVenture',
    llc: formData.businessType === 'llc',
    trust: formData.businessType === 'trust',
    notForProfitOrg: formData.businessType === 'nonProfit',
    subchapterSCorporation: formData.businessType === 'subchapterSCorp',
  };
}

/**
 * Helper function to convert internal business type to Anvil format
 */
function convertBusinessType(businessType?: string): string {
  if (!businessType) return 'Corporation';
  
  const typeMap: Record<string, string> = {
    'corporation': 'Corporation',
    'individual': 'Individual',
    'partnership': 'Partnership',
    'jointVenture': 'Joint Venture',
    'llc': 'LLC',
    'trust': 'Trust',
    'nonProfit': 'Not For Profit Org',
    'subchapterSCorp': 'Subchapter "S" Corporation'
  };
  
  return typeMap[businessType] || 'Corporation';
}

/**
 * Helper function to map business nature to Anvil format
 */
function mapBusinessNature(businessNature?: string): string {
  if (!businessNature) return '';
  
  const natureMap: Record<string, string> = {
    'apartments': 'Apartments',
    'contractor': 'Contractor',
    'manufacturing': 'Manufacturing',
    'office': 'Office',
    'retail': 'Retail',
    'wholesale': 'Wholesale'
  };
  
  return natureMap[businessNature] || '';
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