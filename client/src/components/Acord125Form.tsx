import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import DynamicForm from './DynamicForm';
import { FormDefinition } from '@shared/formTypes/acord125';
import { apiRequest } from '@/lib/queryClient';
import AnvilPdfButton from './AnvilPdfButton';
import { FormDataType } from '@shared/schema';

interface Acord125FormProps {
  highlightedField?: string | null;
  isPending?: boolean;
  readonly?: boolean;
  onValueChange?: (field: string, value: any) => void;
}

/**
 * A specialized form component for ACORD 125 Commercial Insurance Application
 */
const Acord125Form: React.FC<Acord125FormProps> = ({
  highlightedField,
  isPending = false,
  readonly = false,
  onValueChange
}) => {
  // Fetch the form definition
  const { data: formDefinition, isLoading: isDefinitionLoading, error: definitionError } = useQuery({
    queryKey: ['/api/form-definitions/acord125'],
    queryFn: () => apiRequest<FormDefinition>('/api/form-definitions/acord125'),
  });

  // Fetch the form data
  const { data: formData, isLoading: isDataLoading, error: dataError } = useQuery({
    queryKey: ['/api/form-data/acord125'],
    queryFn: () => apiRequest<FormDataType>('/api/form-data/acord125'),
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
  });

  // Local state to optimize form rendering
  const [localFormData, setLocalFormData] = useState<FormDataType>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    policyType: '',
    policyNumber: '',
    startDate: '',
    endDate: '',
    coverageAmount: '',
    deductible: '',
    coverageType: '',
    monthlyPremium: ''
  });
  
  // Sync with server data when available
  useEffect(() => {
    if (formData) {
      setLocalFormData(formData);
    }
  }, [formData]);

  // Optimistic updates for form fields
  const handleValueChange = (field: string, value: any) => {
    // Update local state immediately
    setLocalFormData((prev: FormDataType) => ({
      ...prev,
      [field]: value
    }));
    
    // Call the original onValueChange handler to update server
    if (onValueChange) {
      onValueChange(field, value);
    }
  };

  const isLoading = isDefinitionLoading || isDataLoading;
  const error = definitionError || dataError;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading ACORD 125 form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading form definition:', error);
    return (
      <div className="p-8 bg-red-50 text-red-500 rounded-lg border border-red-200">
        <h3 className="text-lg font-medium mb-2">Error loading form</h3>
        <p>There was a problem loading the ACORD 125 form. Please try again later.</p>
      </div>
    );
  }

  if (!formDefinition || !formData) {
    return (
      <div className="p-8 bg-amber-50 text-amber-500 rounded-lg border border-amber-200">
        <h3 className="text-lg font-medium mb-2">Form data not available</h3>
        <p>The ACORD 125 form data couldn't be loaded. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex justify-end mb-4">
        <AnvilPdfButton formData={localFormData} formType="acord125" />
      </div>
      
      <DynamicForm
        formDefinition={formDefinition}
        formData={localFormData}
        highlightedField={highlightedField}
        isPending={isPending}
        readonly={readonly}
        onValueChange={handleValueChange}
        className="w-full"
      />
    </div>
  );
};

export default Acord125Form;