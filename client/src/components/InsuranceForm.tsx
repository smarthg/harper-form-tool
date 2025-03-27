import React, { useState } from 'react';
import Acord125Form from './Acord125Form';
import Acord126Form from './Acord126Form';
import { FormDataType } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface InsuranceFormProps {
  formData: FormDataType;
  highlightedField: string | null;
  isPending: boolean;
}

const InsuranceForm = ({ formData, highlightedField, isPending }: InsuranceFormProps) => {
  const [activeFormType, setActiveFormType] = useState<string>('acord125');

  const handleValueChange = async (field: string, value: any) => {
    try {
      // Update the form data on the server
      // Use a minimal timeout to avoid throttling too many requests
      // while still keeping the server data updated
      setTimeout(async () => {
        try {
          const response = await fetch(`/api/form-data/${activeFormType}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ [field]: value }),
          });

          if (!response.ok) {
            throw new Error('Failed to update form data');
          }
        } catch (innerError) {
          console.error('Error in delayed update:', innerError);
        }
      }, 100);
    } catch (error) {
      console.error('Error updating form field:', error);
    }
  };

  const renderFormByType = () => {
    switch (activeFormType) {
      case 'acord125':
        return (
          <Acord125Form
            highlightedField={highlightedField}
            isPending={isPending}
            onValueChange={handleValueChange}
            readonly={false}
          />
        );
      case 'acord126':
        return (
          <Acord126Form
            highlightedField={highlightedField}
            isPending={isPending}
            onValueChange={handleValueChange}
            readonly={false}
          />
        );
      default:
        return <div className="p-8 text-center">Form type not supported</div>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="acord125" onValueChange={setActiveFormType} className="w-full">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
          <TabsTrigger value="acord125">ACORD 125</TabsTrigger>
          <TabsTrigger value="acord126">ACORD 126</TabsTrigger>
        </TabsList>
        <TabsContent value="acord125" className="mt-4">
          {renderFormByType()}
        </TabsContent>
        <TabsContent value="acord126" className="mt-4">
          {renderFormByType()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InsuranceForm;