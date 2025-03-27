import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { FormDataType } from "@shared/schema";
import { generateInsurancePDF, downloadPDF } from "@/lib/pdfGenerator";

interface FormDownloadButtonProps {
  formData: FormDataType;
  className?: string;
}

const FormDownloadButton = ({ formData, className = "" }: FormDownloadButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      const doc = generateInsurancePDF(formData);
      downloadPDF(doc, `insurance-policy-${formData.policyNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={handleDownload} 
      className={`${className} flex items-center gap-2`}
      disabled={isGenerating}
      variant="outline"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Download Completed Form
    </Button>
  );
};

export default FormDownloadButton;