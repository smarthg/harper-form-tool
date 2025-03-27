import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Company, FormDataType } from "@shared/schema";
import { isOpenAIInitialized } from "@/lib/openaiService";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wand2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CompanySelectorProps = {
  selectedCompanyId?: number;
  onCompanyChange: (companyId: number) => void;
  className?: string;
  formType?: string;
  onFormDataMapped?: (formData: FormDataType) => void;
};

const CompanySelector = ({
  selectedCompanyId,
  onCompanyChange,
  className = "",
  formType = "acord125",
  onFormDataMapped,
}: CompanySelectorProps) => {
  const { toast } = useToast();
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  
  // Fetch companies with error handling
  const { data: companies = [], isLoading, error } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    retry: 1,
    retryDelay: 1000,
  });

  // Refresh companies from API
  const refreshCompaniesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/companies/refresh", {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Companies refreshed",
        description: "Company list has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to refresh companies",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // If there's a company list and no selection, auto-select the first company
  useEffect(() => {
    if (companies && companies.length > 0 && !selectedCompanyId) {
      onCompanyChange(companies[0].id);
    }
  }, [companies, selectedCompanyId, onCompanyChange]);

  const handleSelectChange = (value: string) => {
    const companyId = parseInt(value);
    if (!isNaN(companyId)) {
      onCompanyChange(companyId);
    }
  };

  const handleRefreshClick = () => {
    refreshCompaniesMutation.mutate();
  };
  
  // Mutation for mapping company data to form fields using AI
  const mapToFormMutation = useMutation({
    mutationFn: async ({ companyId, apiKey }: { companyId: number; apiKey?: string }) => {
      return apiRequest<{ message: string; formData: FormDataType; mappedFields: string[] }>(
        `/api/companies/${companyId}/map-to-form/${formType}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ apiKey }),
        }
      );
    },
    onSuccess: (data) => {
      toast({
        title: "Form Filled Successfully",
        description: `${data.mappedFields.length} fields were filled from company data.`,
      });
      
      // Invalidate form data queries
      queryClient.invalidateQueries({ queryKey: [`/api/form-data/${formType}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/form-data"] });
      
      // Call the callback to update the parent component
      if (onFormDataMapped) {
        onFormDataMapped(data.formData);
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to map company data",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle AI form filling
  const handleMapToForm = () => {
    if (!selectedCompanyId) {
      toast({
        title: "No company selected",
        description: "Please select a company first.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if OpenAI is already initialized
    if (!isOpenAIInitialized() && !apiKey) {
      setIsApiKeyDialogOpen(true);
      return;
    }
    
    // If we have an API key from the dialog or it's already initialized, proceed with mapping
    mapToFormMutation.mutate({ 
      companyId: selectedCompanyId,
      apiKey: apiKey || undefined
    });
  };
  
  const handleApiKeySave = () => {
    setIsApiKeyDialogOpen(false);
    
    if (apiKey && selectedCompanyId) {
      mapToFormMutation.mutate({ 
        companyId: selectedCompanyId,
        apiKey 
      });
    }
  };

  // Don't show error, just continue with empty companies list
  // This makes the component more resilient

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select
        value={selectedCompanyId?.toString()}
        onValueChange={handleSelectChange}
        disabled={isLoading || refreshCompaniesMutation.isPending || mapToFormMutation.isPending}
      >
        <SelectTrigger className="min-w-[180px]">
          <SelectValue placeholder="Select a company" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>
              Loading...
            </SelectItem>
          ) : companies && companies.length > 0 ? (
            companies.map((company) => (
              <SelectItem key={company.id} value={company.id.toString()}>
                {company.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled>
              No companies available
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={handleRefreshClick}
        disabled={refreshCompaniesMutation.isPending || mapToFormMutation.isPending}
      >
        <RefreshCw className={refreshCompaniesMutation.isPending ? "animate-spin" : ""} size={18} />
      </Button>
      
      {/* AI Form Mapping Button */}
      <Button
        variant="secondary"
        size="icon"
        onClick={handleMapToForm}
        disabled={!selectedCompanyId || mapToFormMutation.isPending}
        title="Use AI to fill form from company data"
      >
        {mapToFormMutation.isPending 
          ? <Loader2 className="animate-spin" size={18} /> 
          : <Wand2 size={18} />}
      </Button>
      
      {/* OpenAI API Key Dialog */}
      <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>OpenAI API Key</DialogTitle>
            <DialogDescription>
              Enter your OpenAI API key to enable AI-powered form filling from company data.
              Your key is stored locally and never sent to our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-neutral-400">
                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary">OpenAI</a>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleApiKeySave} disabled={!apiKey.trim()}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanySelector;