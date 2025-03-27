import { useState } from "react";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { FormDataType } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FormUploaderProps {
  onExtractedData: (data: Partial<FormDataType>) => void;
}

const FormUploader = ({ onExtractedData }: FormUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  // Mutation for uploading and processing the form
  const uploadMutation = useMutation<
    { message: string; extractedData: Partial<FormDataType> },
    Error,
    FormData
  >({
    mutationFn: async (formData: FormData) => {
      return apiRequest<{ message: string; extractedData: Partial<FormDataType> }>("/api/upload-form", {
        method: "POST",
        body: formData,
        // Don't set Content-Type for multipart/form-data
        // The browser will set it with the boundary parameter
      });
    },
    onSuccess: (data) => {
      // Reset progress
      setUploadProgress(100);
      
      // Call the callback with the extracted data
      onExtractedData(data.extractedData);
      
      // Show success message
      toast({
        title: "Form Processed Successfully",
        description: `Data has been extracted from the uploaded form.`,
        duration: 5000,
      });
    },
    onError: (error) => {
      // Reset progress
      setUploadProgress(0);
      
      // Show error message
      toast({
        title: "Form Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process the form",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else if (selectedFile) {
      toast({
        title: "Invalid File Type",
        description: "Please select a PDF file.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a PDF file to upload.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append("formFile", file);

    // Start the progress simulation
    setUploadProgress(10);
    
    // Simulate progress during upload
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const increment = Math.random() * 10;
        const newProgress = Math.min(prev + increment, 90);
        return newProgress;
      });
    }, 300);

    // Start the upload
    uploadMutation.mutate(formData);

    // Clear the progress interval when the mutation is done
    return () => clearInterval(progressInterval);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Insurance Form
        </CardTitle>
        <CardDescription>
          Upload an existing insurance form to extract and transpose data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="form-file" className="text-sm font-medium">
              Select PDF Form
            </label>
            <Input
              id="form-file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={uploadMutation.isPending}
              className="cursor-pointer"
            />
            <p className="text-xs text-gray-500">
              Only PDF files are supported (max 5MB)
            </p>
          </div>

          {uploadMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading and processing...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {uploadMutation.isSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">
                Form Processed Successfully
              </AlertTitle>
              <AlertDescription className="text-green-700">
                Data has been extracted from the form and is ready to be transposed.
              </AlertDescription>
            </Alert>
          )}

          {uploadMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Processing Failed</AlertTitle>
              <AlertDescription>
                {uploadMutation.error instanceof Error
                  ? uploadMutation.error.message
                  : "Failed to process the form. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || uploadMutation.isPending}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploadMutation.isPending ? "Processing..." : "Upload and Process Form"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormUploader;