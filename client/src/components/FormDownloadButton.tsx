import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { FormDataType } from "@shared/schema";
import { generateInsurancePDF, downloadPDF } from "@/lib/pdfGenerator";
import { useToast } from "@/hooks/use-toast";

interface FormDownloadButtonProps {
  formData: FormDataType;
  className?: string;
}

const FormDownloadButton = ({ formData, className = "" }: FormDownloadButtonProps) => {
  const { toast } = useToast();

  const handleDownload = () => {
    try {
      // Generate the PDF document
      const doc = generateInsurancePDF(formData);
      
      // Generate a filename with current date
      const date = new Date().toLocaleDateString().replace(/\//g, '-');
      const filename = `insurance-policy-${date}.pdf`;
      
      // Download the PDF
      downloadPDF(doc, filename);
      
      // Show success message
      toast({
        title: "PDF Downloaded",
        description: "Your insurance policy has been downloaded as a PDF file.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      
      // Show error message
      toast({
        title: "Download Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return (
    <Button 
      onClick={handleDownload}
      className={`flex items-center gap-2 ${className}`}
      variant="default"
    >
      <Download className="h-4 w-4" />
      <span>Download Form</span>
    </Button>
  );
};

export default FormDownloadButton;