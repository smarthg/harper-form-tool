import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import InsuranceForm from "@/components/InsuranceForm";
import VoiceInterface from "@/components/VoiceInterface";
import ActivityLog from "@/components/ActivityLog";
import FormUploadModal from "@/components/FormUploadModal";
import CompanySelector from "@/components/CompanySelector";
import CompanyDetails from "@/components/CompanyDetails";
import { FormDataType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

type ActivityItem = {
  id: string;
  command: string;
  field: string;
  value: string;
  timestamp: Date;
};

const FormEditor = () => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined);
  const [lastCommand, setLastCommand] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Fetch initial form data
  const { data: formData, isLoading, error } = useQuery<FormDataType>({
    queryKey: ["/api/form-data"],
  });

  // Update form data mutation (includes company selection)
  const updateFormMutation = useMutation({
    mutationFn: async (
      updates: { field: string; value: string } | Partial<FormDataType>
    ): Promise<FormDataType> => {
      // If it's a field/value pair, convert to object format
      const updateData = 'field' in updates 
        ? { [updates.field]: updates.value } 
        : updates;
        
      return apiRequest<FormDataType>("/api/form-data", {
        method: "PATCH",
        body: JSON.stringify(updateData),
        headers: {
          "Content-Type": "application/json"
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/form-data"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating form data",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle company selection change
  const handleCompanyChange = (companyId: number) => {
    setSelectedCompanyId(companyId);
    
    // Update the form data with the selected company
    updateFormMutation.mutate({ companyId });
    
    toast({
      title: "Company selected",
      description: "Form is now associated with the selected company.",
    });
  };

  const handleFieldUpdate = async (
    field: string,
    value: string,
    command: string
  ) => {
    try {
      setHighlightedField(field);
      setLastCommand({
        type: "success",
        message: `Updated ${getFieldLabel(field)} to ${value}`,
      });

      // Add to activity log
      const newActivity = {
        id: Date.now().toString(),
        command,
        field,
        value,
        timestamp: new Date(),
      };
      setActivityLog((prev) => [newActivity, ...prev]);

      // Update the form data
      await updateFormMutation.mutateAsync({ field, value });

      // Clear highlight after 3 seconds
      setTimeout(() => {
        setHighlightedField(null);
      }, 3000);
    } catch (error) {
      setLastCommand({
        type: "error",
        message: `Failed to update ${field}`,
      });
      console.error("Error updating field:", error);
    }
  };

  // Set selected company from form data when it loads
  useEffect(() => {
    if (formData?.companyId && formData.companyId !== selectedCompanyId) {
      setSelectedCompanyId(formData.companyId);
    }
  }, [formData, selectedCompanyId]);

  // Helper function to get field label for display
  const getFieldLabel = (fieldId: string): string => {
    const labels: Record<string, string> = {
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email Address",
      phone: "Phone Number",
      policyType: "Policy Type",
      policyNumber: "Policy Number",
      startDate: "Start Date",
      endDate: "End Date",
      coverageAmount: "Coverage Amount",
      deductible: "Deductible",
      coverageType: "Coverage Type",
      monthlyPremium: "Monthly Premium",
      companyId: "Company",
    };
    return labels[fieldId] || fieldId;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center">Loading form data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center text-red-500">
          Error loading form data: {error.message}
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center">No form data available</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-neutral-500 font-sans">
            Voice-Driven Form Editor
          </h1>
          <p className="text-neutral-400">
            Edit form fields using natural voice commands
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CompanySelector
            selectedCompanyId={selectedCompanyId}
            onCompanyChange={handleCompanyChange}
          />
          <FormUploadModal />
        </div>
      </header>

      {/* Company Details Section */}
      {selectedCompanyId && (
        <div className="mb-6">
          <CompanyDetails companyId={selectedCompanyId} />
        </div>
      )}

      <div className="lg:flex gap-6">
        <div className="lg:w-2/3">
          <InsuranceForm
            formData={formData}
            highlightedField={highlightedField}
            isPending={updateFormMutation.isPending}
          />
        </div>

        <div className="lg:w-1/3">
          <VoiceInterface
            isListening={isListening}
            setIsListening={setIsListening}
            transcript={transcript}
            setTranscript={setTranscript}
            onCommand={handleFieldUpdate}
            lastCommand={lastCommand}
          />

          <ActivityLog activities={activityLog} getFieldLabel={getFieldLabel} />
        </div>
      </div>
    </div>
  );
};

export default FormEditor;
