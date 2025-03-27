import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormDataType } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import FormDownloadButton from "./FormDownloadButton";

interface InsuranceFormProps {
  formData: FormDataType;
  highlightedField: string | null;
  isPending: boolean;
}

const InsuranceForm = ({ formData, highlightedField, isPending }: InsuranceFormProps) => {
  const isHighlighted = (field: string) => highlightedField === field;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Insurance Form</CardTitle>
            <FormDownloadButton formData={formData} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information Section */}
          <div>
            <h3 className="text-lg font-medium mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="firstName"
                  className={`${isHighlighted("firstName") ? "bg-yellow-100 px-1 rounded" : ""}`}
                >
                  First Name
                </Label>
                <div
                  className={`mt-1 p-2 border rounded ${
                    isHighlighted("firstName")
                      ? "bg-yellow-50 border-yellow-300"
                      : "border-neutral-200"
                  }`}
                >
                  {formData.firstName || "Not specified"}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="lastName"
                  className={`${isHighlighted("lastName") ? "bg-yellow-100 px-1 rounded" : ""}`}
                >
                  Last Name
                </Label>
                <div
                  className={`mt-1 p-2 border rounded ${
                    isHighlighted("lastName")
                      ? "bg-yellow-50 border-yellow-300"
                      : "border-neutral-200"
                  }`}
                >
                  {formData.lastName || "Not specified"}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="email"
                  className={`${isHighlighted("email") ? "bg-yellow-100 px-1 rounded" : ""}`}
                >
                  Email Address
                </Label>
                <div
                  className={`mt-1 p-2 border rounded ${
                    isHighlighted("email")
                      ? "bg-yellow-50 border-yellow-300"
                      : "border-neutral-200"
                  }`}
                >
                  {formData.email || "Not specified"}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="phone"
                  className={`${isHighlighted("phone") ? "bg-yellow-100 px-1 rounded" : ""}`}
                >
                  Phone Number
                </Label>
                <div
                  className={`mt-1 p-2 border rounded ${
                    isHighlighted("phone")
                      ? "bg-yellow-50 border-yellow-300"
                      : "border-neutral-200"
                  }`}
                >
                  {formData.phone || "Not specified"}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Policy Details Section */}
          <div>
            <h3 className="text-lg font-medium mb-4">Policy Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="policyType"
                  className={`${isHighlighted("policyType") ? "bg-yellow-100 px-1 rounded" : ""}`}
                >
                  Policy Type
                </Label>
                <div
                  className={`mt-1 p-2 border rounded ${
                    isHighlighted("policyType")
                      ? "bg-yellow-50 border-yellow-300"
                      : "border-neutral-200"
                  }`}
                >
                  {formData.policyType || "Not specified"}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="policyNumber"
                  className={`${
                    isHighlighted("policyNumber") ? "bg-yellow-100 px-1 rounded" : ""
                  }`}
                >
                  Policy Number
                </Label>
                <div
                  className={`mt-1 p-2 border rounded ${
                    isHighlighted("policyNumber")
                      ? "bg-yellow-50 border-yellow-300"
                      : "border-neutral-200"
                  }`}
                >
                  {formData.policyNumber || "Not specified"}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="startDate"
                  className={`${isHighlighted("startDate") ? "bg-yellow-100 px-1 rounded" : ""}`}
                >
                  Start Date
                </Label>
                <div
                  className={`mt-1 p-2 border rounded ${
                    isHighlighted("startDate")
                      ? "bg-yellow-50 border-yellow-300"
                      : "border-neutral-200"
                  }`}
                >
                  {formData.startDate
                    ? new Date(formData.startDate).toLocaleDateString()
                    : "Not specified"}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="endDate"
                  className={`${isHighlighted("endDate") ? "bg-yellow-100 px-1 rounded" : ""}`}
                >
                  End Date
                </Label>
                <div
                  className={`mt-1 p-2 border rounded ${
                    isHighlighted("endDate")
                      ? "bg-yellow-50 border-yellow-300"
                      : "border-neutral-200"
                  }`}
                >
                  {formData.endDate
                    ? new Date(formData.endDate).toLocaleDateString()
                    : "Not specified"}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Coverage Details Section */}
          <div>
            <h3 className="text-lg font-medium mb-4">Coverage Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="coverageType"
                  className={`${
                    isHighlighted("coverageType") ? "bg-yellow-100 px-1 rounded" : ""
                  }`}
                >
                  Coverage Type
                </Label>
                <div
                  className={`mt-1 p-2 border rounded ${
                    isHighlighted("coverageType")
                      ? "bg-yellow-50 border-yellow-300"
                      : "border-neutral-200"
                  }`}
                >
                  {formData.coverageType || "Not specified"}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="coverageAmount"
                  className={`${
                    isHighlighted("coverageAmount") ? "bg-yellow-100 px-1 rounded" : ""
                  }`}
                >
                  Coverage Amount
                </Label>
                <div
                  className={`mt-1 p-2 border rounded ${
                    isHighlighted("coverageAmount")
                      ? "bg-yellow-50 border-yellow-300"
                      : "border-neutral-200"
                  }`}
                >
                  {formData.coverageAmount || "Not specified"}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="deductible"
                  className={`${isHighlighted("deductible") ? "bg-yellow-100 px-1 rounded" : ""}`}
                >
                  Deductible
                </Label>
                <div
                  className={`mt-1 p-2 border rounded ${
                    isHighlighted("deductible")
                      ? "bg-yellow-50 border-yellow-300"
                      : "border-neutral-200"
                  }`}
                >
                  {formData.deductible || "Not specified"}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="monthlyPremium"
                  className={`${
                    isHighlighted("monthlyPremium") ? "bg-yellow-100 px-1 rounded" : ""
                  }`}
                >
                  Monthly Premium
                </Label>
                <div
                  className={`mt-1 p-2 border rounded ${
                    isHighlighted("monthlyPremium")
                      ? "bg-yellow-50 border-yellow-300"
                      : "border-neutral-200"
                  }`}
                >
                  {formData.monthlyPremium || "Not specified"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isPending && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center">
          <Card className="w-64 h-16 flex items-center justify-center">
            <p className="text-neutral-600">Updating form...</p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InsuranceForm;