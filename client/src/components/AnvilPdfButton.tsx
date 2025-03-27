import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormDataType } from '@shared/schema';
import { fillPdfWithAnvil } from '@/lib/anvilService';
import { useToast } from '@/hooks/use-toast';
import { FileTextIcon, Loader2Icon, DownloadIcon } from 'lucide-react';

interface AnvilPdfButtonProps {
  formData: FormDataType;
  className?: string;
}

const AnvilPdfButton = ({ formData, className = '' }: AnvilPdfButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFillPdf = async () => {
    try {
      setIsLoading(true);
      
      // Show a generating toast
      toast({
        title: 'Generating PDF...',
        description: 'Preparing your ACORD 125 form with Anvil API',
        variant: 'default',
      });
      
      // Use Anvil to fill the PDF with the updated mapping structure
      const url = await fillPdfWithAnvil(formData);
      
      // Store the URL and mark as generated
      setPdfUrl(url);
      setIsGenerated(true);
      
      // Open the PDF in a new tab
      window.open(url, '_blank');
      
      toast({
        title: 'PDF filled successfully',
        description: 'Your ACORD 125 form has been generated and opened in a new tab.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error filling PDF:', error);
      
      toast({
        title: 'Error filling PDF',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Download the PDF that was generated
  const handleDownload = () => {
    if (!pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'acord125.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'PDF downloaded',
      description: 'Your ACORD 125 form has been downloaded.',
      variant: 'default',
    });
  };

  // Only disable the button while loading
  const shouldDisable = isLoading;

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleFillPdf}
        className={`${className} gap-2`}
        disabled={shouldDisable}
        variant="default"
        title={"Generate ACORD 125 PDF"}
      >
        {isLoading ? (
          <Loader2Icon className="h-4 w-4 animate-spin" />
        ) : (
          <FileTextIcon className="h-4 w-4" />
        )}
        Generate ACORD 125
      </Button>
      
      {isGenerated && pdfUrl && (
        <Button
          onClick={handleDownload}
          className="gap-2"
          variant="outline"
          title={"Download PDF"}
        >
          <DownloadIcon className="h-4 w-4" />
          Download
        </Button>
      )}
    </div>
  );
};

export default AnvilPdfButton;