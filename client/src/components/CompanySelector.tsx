import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Company } from "@shared/schema";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type CompanySelectorProps = {
  selectedCompanyId?: number;
  onCompanyChange: (companyId: number) => void;
  className?: string;
};

const CompanySelector = ({
  selectedCompanyId,
  onCompanyChange,
  className = "",
}: CompanySelectorProps) => {
  const { toast } = useToast();
  
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

  // Don't show error, just continue with empty companies list
  // This makes the component more resilient

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select
        value={selectedCompanyId?.toString()}
        onValueChange={handleSelectChange}
        disabled={isLoading || refreshCompaniesMutation.isPending}
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
        disabled={refreshCompaniesMutation.isPending}
      >
        <RefreshCw className={refreshCompaniesMutation.isPending ? "animate-spin" : ""} size={18} />
      </Button>
    </div>
  );
};

export default CompanySelector;