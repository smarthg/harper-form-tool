import { useState } from "react";
import { Clipboard, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FormDataType } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ExtractedDataReviewProps {
  extractedData: Partial<FormDataType>;
  onReset: () => void;
  onTransposed: () => void;
}

interface FieldDetail {
  label: string;
  key: keyof FormDataType;
}

const ExtractedDataReview = ({
  extractedData,
  onReset,
  onTransposed,
}: ExtractedDataReviewProps) => {
  const { toast } = useToast();
  const [selectedFields, setSelectedFields] = useState<Set<keyof FormDataType>>(
    new Set(Object.keys(extractedData) as Array<keyof FormDataType>)
  );

  // Field definitions with nice labels
  const fields: FieldDetail[] = [
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email Address" },
    { key: "phone", label: "Phone Number" },
    { key: "policyType", label: "Policy Type" },
    { key: "policyNumber", label: "Policy Number" },
    { key: "startDate", label: "Start Date" },
    { key: "endDate", label: "End Date" },
    { key: "coverageAmount", label: "Coverage Amount" },
    { key: "deductible", label: "Deductible" },
    { key: "coverageType", label: "Coverage Type" },
    { key: "monthlyPremium", label: "Monthly Premium" },
  ];

  // Get only the extracted fields that have values
  const extractedFields = fields.filter(
    (field) => extractedData[field.key] !== undefined && extractedData[field.key] !== ""
  );

  // Mutation for transposing the form data
  const transposeMutation = useMutation<
    { message: string; formData: FormDataType },
    Error,
    Partial<FormDataType>
  >({
    mutationFn: async (data: Partial<FormDataType>) => {
      return apiRequest<{ message: string; formData: FormDataType }>(
        "/api/transpose-form",
        {
          method: "POST",
          body: JSON.stringify({ extractedData: data }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    },
    onSuccess: () => {
      // Invalidate the form data query to refetch with the new data
      queryClient.invalidateQueries({ queryKey: ["/api/form-data"] });
      
      // Show success message
      toast({
        title: "Form Data Transposed",
        description: "The extracted data has been applied to the form successfully.",
        duration: 5000,
      });
      
      // Call the callback
      onTransposed();
    },
    onError: (error) => {
      // Show error message
      toast({
        title: "Transposition Failed",
        description: error instanceof Error ? error.message : "Failed to transpose form data",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const toggleField = (key: keyof FormDataType) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedFields(newSelected);
  };

  const handleTranspose = () => {
    // Create an object with only the selected fields
    const selectedData = Array.from(selectedFields).reduce(
      (acc, key) => {
        if (extractedData[key] !== undefined) {
          acc[key] = extractedData[key];
        }
        return acc;
      },
      {} as Partial<FormDataType>
    );

    transposeMutation.mutate(selectedData);
  };

  const selectAll = () => {
    setSelectedFields(
      new Set(extractedFields.map((field) => field.key))
    );
  };

  const deselectAll = () => {
    setSelectedFields(new Set());
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Clipboard className="h-5 w-5" />
          Review Extracted Data
        </CardTitle>
        <CardDescription>
          Review and select which data to transpose to the form
        </CardDescription>
      </CardHeader>
      <CardContent>
        {extractedFields.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {selectedFields.size} of {extractedFields.length} fields selected
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">Use</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Extracted Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractedFields.map((field) => (
                    <TableRow key={field.key}>
                      <TableCell className="text-center">
                        <Button
                          variant={selectedFields.has(field.key) ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleField(field.key)}
                        >
                          {selectedFields.has(field.key) ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{field.label}</div>
                      </TableCell>
                      <TableCell>
                        {field.key === 'policyType' ? (
                          <Badge variant="outline">
                            {extractedData[field.key] === 'auto'
                              ? 'Auto Insurance'
                              : extractedData[field.key] === 'home'
                              ? 'Home Insurance'
                              : extractedData[field.key] === 'life'
                              ? 'Life Insurance'
                              : extractedData[field.key] === 'health'
                              ? 'Health Insurance'
                              : extractedData[field.key]}
                          </Badge>
                        ) : (
                          extractedData[field.key]
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            <p>No data was extracted from the uploaded form.</p>
            <p className="mt-2">
              Please try uploading a different form or check the format.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onReset} disabled={transposeMutation.isPending}>
          Reset
        </Button>
        <Button
          onClick={handleTranspose}
          disabled={selectedFields.size === 0 || transposeMutation.isPending}
        >
          {transposeMutation.isPending
            ? "Transposing..."
            : `Transpose ${selectedFields.size} Fields to Form`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExtractedDataReview;