import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FormDataType } from '@shared/schema';
import autoTable from 'jspdf-autotable';

/**
 * Generate a PDF document from insurance form data
 */
export function generateInsurancePDF(formData: FormDataType): jsPDF {
  const doc = new jsPDF();
  
  // Add document title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Insurance Policy Details', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text('Generated on: ' + new Date().toLocaleDateString(), 105, 30, { align: 'center' });
  
  // Add document sections
  addPersonalInformationSection(doc, formData);
  addPolicyDetailsSection(doc, formData);
  addCoverageDetailsSection(doc, formData);
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Page ' + i + ' of ' + pageCount,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  return doc;
}

/**
 * Add the personal information section to the PDF
 */
function addPersonalInformationSection(doc: jsPDF, formData: FormDataType) {
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('Personal Information', 14, 45);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 47, 196, 47);
  
  // Create data table
  autoTable(doc, {
    startY: 50,
    head: [['Field', 'Value']],
    body: [
      ['First Name', formData.firstName],
      ['Last Name', formData.lastName],
      ['Email Address', formData.email],
      ['Phone Number', formData.phone]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [66, 133, 244],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 }
    }
  });
}

/**
 * Add the policy details section to the PDF
 */
function addPolicyDetailsSection(doc: jsPDF, formData: FormDataType) {
  // Get the last Y position from the previous table
  const previousTableEndY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('Policy Details', 14, previousTableEndY);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(14, previousTableEndY + 2, 196, previousTableEndY + 2);
  
  // Format policy type display name
  const policyTypeMap: Record<string, string> = {
    'home': 'Home Insurance',
    'auto': 'Auto Insurance',
    'life': 'Life Insurance',
    'health': 'Health Insurance'
  };
  
  // Create data table
  autoTable(doc, {
    startY: previousTableEndY + 5,
    head: [['Field', 'Value']],
    body: [
      ['Policy Type', policyTypeMap[formData.policyType] || formData.policyType],
      ['Policy Number', formData.policyNumber],
      ['Start Date', formatDate(formData.startDate)],
      ['End Date', formatDate(formData.endDate)]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [66, 133, 244],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 }
    }
  });
}

/**
 * Add the coverage details section to the PDF
 */
function addCoverageDetailsSection(doc: jsPDF, formData: FormDataType) {
  // Get the last Y position from the previous table
  const previousTableEndY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('Coverage Details', 14, previousTableEndY);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(14, previousTableEndY + 2, 196, previousTableEndY + 2);
  
  // Format coverage type display name
  const coverageTypeMap: Record<string, string> = {
    'comprehensive': 'Comprehensive',
    'collision': 'Collision',
    'liability': 'Liability',
    'uninsured': 'Uninsured Motorist'
  };
  
  // Create data table
  autoTable(doc, {
    startY: previousTableEndY + 5,
    head: [['Field', 'Value']],
    body: [
      ['Coverage Amount', `$${formData.coverageAmount}`],
      ['Deductible', `$${formData.deductible}`],
      ['Coverage Type', coverageTypeMap[formData.coverageType] || formData.coverageType],
      ['Monthly Premium', `$${formData.monthlyPremium}`]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [66, 133, 244],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 }
    }
  });
}

/**
 * Helper to format dates for display
 */
function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

/**
 * Download the PDF with a given filename
 */
export function downloadPDF(doc: jsPDF, filename: string = 'insurance-policy.pdf'): void {
  doc.save(filename);
}