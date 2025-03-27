import { useState } from "react";
import { Import } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormUploader from "@/components/FormUploader";
import ExtractedDataReview from "@/components/ExtractedDataReview";
import { FormDataType } from "@shared/schema";

enum Step {
  UPLOAD,
  REVIEW,
  COMPLETE
}

const FormUploadModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(Step.UPLOAD);
  const [extractedData, setExtractedData] = useState<Partial<FormDataType>>({});

  const handleExtractedData = (data: Partial<FormDataType>) => {
    setExtractedData(data);
    setCurrentStep(Step.REVIEW);
  };

  const handleReset = () => {
    setExtractedData({});
    setCurrentStep(Step.UPLOAD);
  };

  const handleTransposed = () => {
    setCurrentStep(Step.COMPLETE);
    
    // Close the dialog after a delay to show the success state
    setTimeout(() => {
      setIsOpen(false);
      
      // Reset the state when dialog is fully closed
      setTimeout(() => {
        setCurrentStep(Step.UPLOAD);
        setExtractedData({});
      }, 300);
    }, 1500);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when dialog is closed
      setTimeout(() => {
        setCurrentStep(Step.UPLOAD);
        setExtractedData({});
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Import className="h-4 w-4" />
          <span>Import Form</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Insurance Form</DialogTitle>
          <DialogDescription>
            Upload an existing insurance form to extract data and transpose it to the current form.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Tabs defaultValue="upload" value={currentStep === Step.UPLOAD ? "upload" : "review"}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" disabled={currentStep !== Step.UPLOAD}>
                Upload Form
              </TabsTrigger>
              <TabsTrigger value="review" disabled={currentStep !== Step.REVIEW}>
                Review Data
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="pt-4">
              <FormUploader onExtractedData={handleExtractedData} />
            </TabsContent>
            <TabsContent value="review" className="pt-4">
              <ExtractedDataReview 
                extractedData={extractedData} 
                onReset={handleReset}
                onTransposed={handleTransposed}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter className="sm:justify-start">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={currentStep === Step.COMPLETE}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormUploadModal;