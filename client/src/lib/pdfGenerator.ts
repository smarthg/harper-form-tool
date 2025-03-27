import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FormDataType } from "@shared/schema";

/**
 * Generate a PDF document from insurance form data
 */
export function generateInsurancePDF(formData: FormDataType): jsPDF {
  const doc = new jsPDF();
  
  // Add header and title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("Insurance Policy Document", 105, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Policy #: ${formData.policyNumber}`, 105, 30, { align: "center" });
  
  // Add sections
  addPersonalInformationSection(doc, formData);
  addPolicyDetailsSection(doc, formData);
  addCoverageDetailsSection(doc, formData);
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: "center" });
    doc.text("Generated on " + new Date().toLocaleDateString(), 105, 290, { align: "center" });
  }
  
  return doc;
}

/**
 * Add the personal information section to the PDF
 */
function addPersonalInformationSection(doc: jsPDF, formData: FormDataType) {
  doc.setFontSize(16);
  doc.setTextColor(60, 60, 60);
  doc.text("Personal Information", 20, 50);
  
  const personalData = [
    ["Full Name", `${formData.firstName} ${formData.lastName}`],
    ["Email Address", formData.email],
    ["Phone Number", formData.phone]
  ];
  
  autoTable(doc, {
    startY: 55,
    head: [["Field", "Information"]],
    body: personalData,
    theme: "grid",
    headStyles: {
      fillColor: [100, 100, 100],
      textColor: [255, 255, 255]
    }
  });
}

/**
 * Add the policy details section to the PDF
 */
function addPolicyDetailsSection(doc: jsPDF, formData: FormDataType) {
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(16);
  doc.setTextColor(60, 60, 60);
  doc.text("Policy Details", 20, finalY);
  
  const policyData = [
    ["Policy Type", formData.policyType],
    ["Policy Number", formData.policyNumber],
    ["Start Date", formatDate(formData.startDate)],
    ["End Date", formatDate(formData.endDate)]
  ];
  
  autoTable(doc, {
    startY: finalY + 5,
    head: [["Field", "Information"]],
    body: policyData,
    theme: "grid",
    headStyles: {
      fillColor: [100, 100, 100],
      textColor: [255, 255, 255]
    }
  });
}

/**
 * Add the coverage details section to the PDF
 */
function addCoverageDetailsSection(doc: jsPDF, formData: FormDataType) {
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(16);
  doc.setTextColor(60, 60, 60);
  doc.text("Coverage Details", 20, finalY);
  
  const coverageData = [
    ["Coverage Type", formData.coverageType],
    ["Coverage Amount", formData.coverageAmount],
    ["Deductible", formData.deductible],
    ["Monthly Premium", formData.monthlyPremium]
  ];
  
  autoTable(doc, {
    startY: finalY + 5,
    head: [["Field", "Information"]],
    body: coverageData,
    theme: "grid",
    headStyles: {
      fillColor: [100, 100, 100],
      textColor: [255, 255, 255]
    }
  });
}

/**
 * Helper to format dates for display
 */
function formatDate(dateString: string): string {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
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