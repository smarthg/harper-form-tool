import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormDataType } from '@shared/schema';
import { fillPdfWithAnvil } from '@/lib/anvilService';
import { useToast } from '@/hooks/use-toast';
import { FileTextIcon, Loader2Icon } from 'lucide-react';

interface AnvilPdfButtonProps {
  formData: FormDataType;
  className?: string;
}

const AnvilPdfButton = ({ formData, className = '' }: AnvilPdfButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFillPdf = async () => {
    try {
      setIsLoading(true);
      
      // Use Anvil to fill the PDF with the updated mapping structure
      const pdfUrl = await fillPdfWithAnvil(formData);
      
      // Open the PDF in a new tab
      window.open(pdfUrl, '_blank');
      
      toast({
        title: 'PDF filled successfully',
        description: 'Your ACORD 125 form has been filled and is ready to download.',
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

  // Only disable the button while loading
  const shouldDisable = isLoading;

  return (
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
      Fill ACORD 125 PDF
    </Button>
  );
};

export default AnvilPdfButton;