import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import InsuranceForm from "@/components/InsuranceForm";
import VoiceInterface from "@/components/VoiceInterface";
import ActivityLog from "@/components/ActivityLog";
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

  // Handle company selection change and fetch company details
  const handleCompanyChange = async (companyId: number) => {
    setSelectedCompanyId(companyId);
    
    try {
      // Update the form data with the selected company ID
      await updateFormMutation.mutateAsync({ companyId });
      
      // Fetch detailed information about the company
      console.log(`Fetching detailed info for company ID: ${companyId}`);
      const companyDetails = await apiRequest<any>(`/api/companies/${companyId}/details`);
      console.log("Company details response:", companyDetails);
      
      if (companyDetails?.company?.json?.company) {
        const companyData = companyDetails.company.json.company;
        
        // Create updates based on company data
        const formUpdates: Partial<FormDataType> = {};
        
        // Map company data to form fields
        if (companyData.company_name) {
          formUpdates.policyType = 'commercial'; // Assuming commercial policy for companies
        }
        
        // Update any other relevant fields based on company data
        if (companyData.company_primary_phone) {
          formUpdates.phone = companyData.company_primary_phone;
        }
        
        // Set a reasonable default coverage amount based on company type/size
        // This is just an example - actual logic would depend on business rules
        if (companyData.company_naics_code) {
          // Different industries might have different standard coverage amounts
          const industryCode = parseInt(companyData.company_naics_code);
          
          // Construction (23XXXX)
          if (industryCode >= 230000 && industryCode < 240000) {
            formUpdates.coverageAmount = '1,000,000';
            formUpdates.deductible = '10,000';
          } 
          // Manufacturing (31XXXX-33XXXX)
          else if (industryCode >= 310000 && industryCode < 340000) {
            formUpdates.coverageAmount = '2,000,000';
            formUpdates.deductible = '15,000';
          }
          // Retail (44XXXX-45XXXX)
          else if (industryCode >= 440000 && industryCode < 460000) {
            formUpdates.coverageAmount = '500,000';
            formUpdates.deductible = '5,000';
          }
          // Default
          else {
            formUpdates.coverageAmount = '1,000,000';
            formUpdates.deductible = '5,000';
          }
          
          formUpdates.coverageType = 'comprehensive';
          
          // Calculate a monthly premium (again, just an example)
          // In reality, this would be calculated by complex risk models
          const coverageAmount = parseInt(formUpdates.coverageAmount.replace(/,/g, ''));
          const deductible = parseInt(formUpdates.deductible.replace(/,/g, ''));
          const premiumBase = Math.round((coverageAmount * 0.01 - deductible * 0.05) / 12);
          formUpdates.monthlyPremium = premiumBase.toString();
        }
        
        // Only update if we have data to update
        if (Object.keys(formUpdates).length > 0) {
          await updateFormMutation.mutateAsync(formUpdates);
          
          // Also update the ACORD 125 form data
          try {
            // Create ACORD 125 specific updates
            const acord125Updates: Record<string, any> = {
              namedInsured: companyData.company_name || "",
              businessPhone: companyData.company_primary_phone || "",
              naics: companyData.company_naics_code || "",
              sic: companyData.company_sic_code || ""
            };
            
            // Set business type based on name (just an example)
            if (companyData.company_name) {
              if (companyData.company_name.includes("Inc")) {
                acord125Updates.businessType = "corporation";
              } else if (companyData.company_name.includes("LLC")) {
                acord125Updates.businessType = "limited_liability_company";
              } else if (companyData.company_name.includes("LLP")) {
                acord125Updates.businessType = "limited_liability_partnership";
              } else {
                acord125Updates.businessType = "sole_proprietor";
              }
            }
            
            // Set default dates
            const today = new Date();
            const nextYear = new Date(today);
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            
            acord125Updates.proposedEffDate = today.toISOString().split('T')[0];
            acord125Updates.proposedExpDate = nextYear.toISOString().split('T')[0];
            
            // Update ACORD 125 form data
            await apiRequest("/api/form-data/acord125", {
              method: "PATCH",
              body: JSON.stringify(acord125Updates),
              headers: {
                "Content-Type": "application/json"
              }
            });
          } catch (error) {
            console.error("Error updating ACORD 125 form data:", error);
          }
          
          toast({
            title: "Company data applied",
            description: "Forms have been updated with company information.",
          });
        } else {
          toast({
            title: "Company selected",
            description: "Form is now associated with the selected company.",
          });
        }
      } else {
        toast({
          title: "Company selected",
          description: "Form is now associated with the selected company.",
        });
      }
    } catch (error) {
      console.error("Error fetching company details:", error);
      toast({
        title: "Company selected",
        description: "Form is now associated with the selected company.",
        variant: "default",
      });
    }
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

      // For ACORD 125 form fields, update the ACORD 125 form data specifically
      const acord125Fields = [
        'namedInsured', 'businessPhone', 'email', 'feinOrSocSec', 'websiteAddress', 
        'mailingAddress', 'mailingCity', 'mailingState', 'mailingZipCode', 
        'natureOfBusiness', 'descriptionOfPrimaryOperations', 'businessType',
        'dateBusinessStarted', 'annualGrossSales', 'numEmployees', 'deductible', 'coverageAmount'
      ];
      
      if (acord125Fields.includes(field)) {
        // Update ACORD 125 form data
        await apiRequest("/api/form-data/acord125", {
          method: "PATCH",
          body: JSON.stringify({ [field]: value }),
          headers: {
            "Content-Type": "application/json"
          }
        });
      } else {
        // Update the main form data
        await updateFormMutation.mutateAsync({ field, value });
      }

      // Refresh form data
      queryClient.invalidateQueries({ queryKey: ["/api/form-data/acord125"] });

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

  // Handle form data mapped from company data via AI
  const handleFormDataMapped = (mappedFormData: FormDataType) => {
    toast({
      title: "Form Updated with AI",
      description: "Form data has been intelligently filled with company information.",
    });
    
    // Add an activity entry for AI mapping
    const activityItem: ActivityItem = {
      id: Date.now().toString(),
      command: "AI Mapping",
      field: "multiple fields",
      value: "Company data mapped to form",
      timestamp: new Date(),
    };
    
    setActivityLog((prev) => [activityItem, ...prev]);
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
      // Standard form fields
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
      
      // ACORD 125 form fields
      namedInsured: "Business Name",
      businessPhone: "Business Phone",
      feinOrSocSec: "Federal Employer ID",
      websiteAddress: "Website",
      mailingAddress: "Mailing Address",
      mailingCity: "City",
      mailingState: "State",
      mailingZipCode: "ZIP Code",
      natureOfBusiness: "Nature of Business",
      descriptionOfPrimaryOperations: "Operations Description",
      businessType: "Business Entity Type",
      dateBusinessStarted: "Business Start Date",
      annualGrossSales: "Annual Revenue",
      numEmployees: "Number of Employees",
      naics: "NAICS Code",
      sic: "SIC Code"
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
            onFormDataMapped={handleFormDataMapped}
            formType="acord125"
          />
        </div>
      </header>

      {/* We're fetching company details but not displaying them directly */}

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
