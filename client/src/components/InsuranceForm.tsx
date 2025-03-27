import React, { useState } from 'react';
import Acord125Form from './Acord125Form';
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
      default:
        return <div className="p-8 text-center">Form type not supported</div>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="acord125" onValueChange={setActiveFormType} className="w-full">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
          <TabsTrigger value="acord125">ACORD 125</TabsTrigger>
          <TabsTrigger value="other" disabled>Other Forms</TabsTrigger>
        </TabsList>
        <TabsContent value="acord125" className="mt-4">
          {renderFormByType()}
        </TabsContent>
        <TabsContent value="other" className="mt-4">
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-neutral-500">Other form types will be available in the future</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InsuranceForm;