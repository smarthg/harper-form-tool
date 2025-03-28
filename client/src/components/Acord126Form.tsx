import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FormDataType } from '@shared/schema';
import { FormDefinition } from '@shared/formTypes/acord126';
import { apiRequest } from '@/lib/queryClient';
import DynamicForm from './DynamicForm';
import AnvilPdfButton from './AnvilPdfButton';

interface Acord126FormProps {
  highlightedField?: string | null;
  isPending?: boolean;
  readonly?: boolean;
  onValueChange?: (field: string, value: any) => void;
}

/**
 * A specialized form component for ACORD 126 Commercial General Liability Section
 */
const Acord126Form: React.FC<Acord126FormProps> = ({
  highlightedField,
  isPending = false,
  readonly = false,
  onValueChange
}) => {
  // Fetch the form definition
  const { data: formDefinition, isLoading: isDefinitionLoading, error: definitionError } = useQuery({
    queryKey: ['/api/form-definitions/acord126'],
    queryFn: () => apiRequest<FormDefinition>('/api/form-definitions/acord126'),
  });

  // Fetch the form data
  const { data: formData, isLoading: isDataLoading, error: dataError } = useQuery({
    queryKey: ['/api/form-data/acord126'],
    queryFn: () => apiRequest<Record<string, any>>('/api/form-data/acord126'),
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
  });

  // Local state to optimize form rendering
  const [localFormData, setLocalFormData] = useState<Record<string, any>>({});
  
  // Sync with server data when available
  useEffect(() => {
    if (formData) {
      setLocalFormData(formData);
    }
  }, [formData]);

  // Optimistic updates for form fields
  const handleValueChange = (field: string, value: any) => {
    // Update local state immediately
    setLocalFormData((prev) => ({
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
          <p className="mt-4">Loading ACORD 126 form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading form definition:', error);
    return (
      <div className="p-8 bg-red-50 text-red-500 rounded-lg border border-red-200">
        <h3 className="text-lg font-medium mb-2">Error loading form</h3>
        <p>There was a problem loading the ACORD 126 form. Please try again later.</p>
      </div>
    );
  }

  if (!formDefinition || !formData) {
    return (
      <div className="p-8 bg-amber-50 text-amber-500 rounded-lg border border-amber-200">
        <h3 className="text-lg font-medium mb-2">Form data not available</h3>
        <p>The ACORD 126 form data couldn't be loaded. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex justify-end mb-4">
        <AnvilPdfButton formData={localFormData as FormDataType} formType="acord126" />
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

export default Acord126Form;