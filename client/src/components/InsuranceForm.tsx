import { FormDataType } from "@shared/schema";

interface InsuranceFormProps {
  formData: FormDataType;
  highlightedField: string | null;
  isPending: boolean;
}

const InsuranceForm = ({ formData, highlightedField, isPending }: InsuranceFormProps) => {
  // Helper function to determine if a field should be highlighted
  const isHighlighted = (fieldName: string) => {
    return highlightedField === fieldName;
  };

  // Helper function for field animation classes
  const getFieldClasses = (fieldName: string) => {
    let classes = "w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
    
    if (isHighlighted(fieldName)) {
      classes += " bg-primary/5 border-primary shadow-[0_0_0_2px_rgba(66,133,244,0.2)] transition-all duration-300";
    }
    
    if (isPending && highlightedField === fieldName) {
      classes += " opacity-70";
    }
    
    return classes;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-medium text-neutral-500 mb-4">Insurance Policy Details</h2>

      <form id="insuranceForm">
        {/* Personal Information Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-neutral-400 mb-3 pb-2 border-b border-neutral-200">
            Personal Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-field" data-field-name="firstName">
              <label htmlFor="firstName" className="block text-sm font-medium text-neutral-400 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                readOnly
                className={getFieldClasses("firstName")}
              />
            </div>

            <div className="form-field" data-field-name="lastName">
              <label htmlFor="lastName" className="block text-sm font-medium text-neutral-400 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                readOnly
                className={getFieldClasses("lastName")}
              />
            </div>
            
            <div className="form-field" data-field-name="email">
              <label htmlFor="email" className="block text-sm font-medium text-neutral-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                readOnly
                className={getFieldClasses("email")}
              />
            </div>
            
            <div className="form-field" data-field-name="phone">
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-400 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                readOnly
                className={getFieldClasses("phone")}
              />
            </div>
          </div>
        </div>

        {/* Policy Details Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-neutral-400 mb-3 pb-2 border-b border-neutral-200">
            Policy Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-field" data-field-name="policyType">
              <label htmlFor="policyType" className="block text-sm font-medium text-neutral-400 mb-1">
                Policy Type
              </label>
              <select
                id="policyType"
                value={formData.policyType}
                disabled
                className={getFieldClasses("policyType")}
              >
                <option value="home">Home Insurance</option>
                <option value="auto">Auto Insurance</option>
                <option value="life">Life Insurance</option>
                <option value="health">Health Insurance</option>
              </select>
            </div>
            
            <div className="form-field" data-field-name="policyNumber">
              <label htmlFor="policyNumber" className="block text-sm font-medium text-neutral-400 mb-1">
                Policy Number
              </label>
              <input
                type="text"
                id="policyNumber"
                value={formData.policyNumber}
                readOnly
                className={getFieldClasses("policyNumber")}
              />
            </div>
            
            <div className="form-field" data-field-name="startDate">
              <label htmlFor="startDate" className="block text-sm font-medium text-neutral-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                readOnly
                className={getFieldClasses("startDate")}
              />
            </div>
            
            <div className="form-field" data-field-name="endDate">
              <label htmlFor="endDate" className="block text-sm font-medium text-neutral-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={formData.endDate}
                readOnly
                className={getFieldClasses("endDate")}
              />
            </div>
          </div>
        </div>

        {/* Coverage Details Section */}
        <div>
          <h3 className="text-lg font-medium text-neutral-400 mb-3 pb-2 border-b border-neutral-200">
            Coverage Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-field" data-field-name="coverageAmount">
              <label htmlFor="coverageAmount" className="block text-sm font-medium text-neutral-400 mb-1">
                Coverage Amount
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">$</span>
                <input
                  type="text"
                  id="coverageAmount"
                  value={formData.coverageAmount}
                  readOnly
                  className={`${getFieldClasses("coverageAmount")} pl-7`}
                />
              </div>
            </div>
            
            <div className="form-field" data-field-name="deductible">
              <label htmlFor="deductible" className="block text-sm font-medium text-neutral-400 mb-1">
                Deductible
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">$</span>
                <input
                  type="text"
                  id="deductible"
                  value={formData.deductible}
                  readOnly
                  className={`${getFieldClasses("deductible")} pl-7`}
                />
              </div>
            </div>
            
            <div className="form-field" data-field-name="coverageType">
              <label htmlFor="coverageType" className="block text-sm font-medium text-neutral-400 mb-1">
                Coverage Type
              </label>
              <select
                id="coverageType"
                value={formData.coverageType}
                disabled
                className={getFieldClasses("coverageType")}
              >
                <option value="comprehensive">Comprehensive</option>
                <option value="collision">Collision</option>
                <option value="liability">Liability</option>
                <option value="uninsured">Uninsured Motorist</option>
              </select>
            </div>
            
            <div className="form-field" data-field-name="monthlyPremium">
              <label htmlFor="monthlyPremium" className="block text-sm font-medium text-neutral-400 mb-1">
                Monthly Premium
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">$</span>
                <input
                  type="text"
                  id="monthlyPremium"
                  value={formData.monthlyPremium}
                  readOnly
                  className={`${getFieldClasses("monthlyPremium")} pl-7`}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InsuranceForm;
