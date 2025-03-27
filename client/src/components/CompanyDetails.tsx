import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CompanyDetailsProps {
  companyId?: number;
  className?: string;
}

const CompanyDetails = ({ companyId, className = "" }: CompanyDetailsProps) => {
  const { data: companyDetails, isLoading, error } = useQuery({
    queryKey: ["/api/companies", companyId, "details"],
    queryFn: async () => {
      if (!companyId) return null;
      return apiRequest<any>(`/api/companies/${companyId}/details`);
    },
    enabled: !!companyId, // Only run query if companyId is provided
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Store parsed company data
  const [parsedData, setParsedData] = useState<any>(null);

  // Parse the company details when they change
  useEffect(() => {
    if (companyDetails?.company?.json?.company) {
      setParsedData(companyDetails.company.json.company);
    } else {
      setParsedData(null);
    }
  }, [companyDetails]);

  // If no company is selected, show a message
  if (!companyId) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>Select a company to view details</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // If loading, show skeleton
  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>Loading company information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // If error, show error message
  if (error || !parsedData) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>Company ID: {companyId}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error ? (error as Error).message : "Failed to load company details"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>{parsedData.company_name || "Company Information"}</CardTitle>
        <CardDescription>Company ID: {companyId}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-xs text-muted-foreground">NAICS Code</p>
                <p className="text-sm">{parsedData.company_naics_code || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">SIC Code</p>
                <p className="text-sm">{parsedData.company_sic_code || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm">{parsedData.company_description || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Primary Phone</p>
                <p className="text-sm">{parsedData.company_primary_phone || "N/A"}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium">Lead Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-xs text-muted-foreground">Tivly Lead ID</p>
                <p className="text-sm">{parsedData.tivly_lead_id || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tivly Lead Cost</p>
                <p className="text-sm">${parsedData.tivly_lead_cost || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Acquisition Channel</p>
                <p className="text-sm">{parsedData.tivly_lead_acquisition_channel || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Entry Date</p>
                <p className="text-sm">
                  {parsedData.tivly_entry_date_time
                    ? new Date(parsedData.tivly_entry_date_time).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium">Additional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-xs text-muted-foreground">Tatch Producer</p>
                <p className="text-sm">{parsedData.tatch_producer || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Campaign</p>
                <p className="text-sm">{parsedData.tivly_campaign || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyDetails;