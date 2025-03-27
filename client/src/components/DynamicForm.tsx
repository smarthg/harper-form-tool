import React from 'react';
import { FormDefinition, Field, Section } from '@shared/formTypes/acord125';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface DynamicFormProps {
  formDefinition: FormDefinition;
  formData: Record<string, any>;
  onValueChange?: (field: string, value: any) => void;
  highlightedField?: string | null;
  isPending?: boolean;
  readonly?: boolean;
  className?: string;
}

/**
 * A dynamic form component that renders a form based on a JSON form definition
 */
const DynamicForm: React.FC<DynamicFormProps> = ({
  formDefinition,
  formData,
  onValueChange,
  highlightedField,
  isPending = false,
  readonly = false,
  className,
}) => {
  // Check if a field should be shown based on its conditional rules
  const shouldShowConditional = (field: Field): boolean => {
    // If the field has no conditional rules, always show it
    if (!field.conditionalOn || !field.conditions) {
      return true;
    }
    
    const dependsOnField = field.conditionalOn;
    const dependsOnValue = formData[dependsOnField];
    
    // If the condition value is not set, don't show the field
    if (!dependsOnValue) {
      return false;
    }
    
    // Check if the current value of the dependency field matches any of the conditions
    return field.conditions.includes(dependsOnValue);
  };
  
  // Handle field value changes
  const handleFieldChange = (field: string, value: any) => {
    if (onValueChange && !readonly) {
      onValueChange(field, value);
    }
  };
  
  // Render a field based on its type
  const renderField = (field: Field, sectionName: string) => {
    // If this field has a conditional display and it should not be shown, return null
    if (!shouldShowConditional(field)) {
      return null;
    }
    
    const fieldId = `${sectionName}-${field.name}`;
    const fieldValue = formData[field.name] !== undefined ? formData[field.name] : '';
    const isHighlighted = highlightedField === field.name;
    
    // Common props for input elements
    const commonProps = {
      id: fieldId,
      name: field.name,
      value: fieldValue,
      disabled: isPending || readonly,
      'aria-label': field.label,
      className: cn(
        isHighlighted ? 'ring-2 ring-primary animate-pulse' : '',
        isPending ? 'opacity-50 cursor-not-allowed' : ''
      )
    };
    
    // Wrapper for each field
    return (
      <div
        key={fieldId}
        className={`mb-4 ${isHighlighted ? 'bg-primary/5 p-2 rounded-md' : ''}`}
      >
        <Label 
          htmlFor={fieldId}
          className="mb-1 block"
        >
          {field.label}
        </Label>
        
        {field.type === 'text' && (
          <Input
            {...commonProps}
            type="text"
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        )}
        
        {field.type === 'number' && (
          <Input
            {...commonProps}
            type="number"
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        )}
        
        {field.type === 'date' && (
          <Input
            {...commonProps}
            type="date"
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        )}
        
        {field.type === 'time' && (
          <Input
            {...commonProps}
            type="time"
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        )}
        
        {field.type === 'phone' && (
          <Input
            {...commonProps}
            type="tel"
            placeholder="(XXX) XXX-XXXX"
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        )}
        
        {field.type === 'email' && (
          <Input
            {...commonProps}
            type="email"
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        )}
        
        {field.type === 'url' && (
          <Input
            {...commonProps}
            type="url"
            placeholder="https://"
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        )}
        
        {field.type === 'currency' && (
          <div className="relative">
            <span className="absolute left-3 top-2.5">$</span>
            <Input
              {...commonProps}
              type="text"
              className={`${commonProps.className} pl-6`}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
            />
          </div>
        )}
        
        {field.type === 'textarea' && (
          <Textarea
            {...commonProps}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        )}
        
        {field.type === 'radio' && field.options && (
          <RadioGroup
            id={fieldId}
            value={fieldValue}
            onValueChange={(value) => handleFieldChange(field.name, value)}
            disabled={isPending || readonly}
            className="space-y-1 mt-2"
          >
            {field.options.map((option) => (
              <div key={`${fieldId}-${option}`} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${fieldId}-${option}`} />
                <Label htmlFor={`${fieldId}-${option}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
        
        {field.type === 'checkbox' && (
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id={fieldId}
              checked={!!fieldValue}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
              disabled={isPending || readonly}
            />
            <Label htmlFor={fieldId} className="cursor-pointer">
              {field.label}
            </Label>
          </div>
        )}
        
        {field.description && (
          <p className="text-sm text-gray-500 mt-1">{field.description}</p>
        )}
      </div>
    );
  };
  
  // Render a section of the form
  const renderSection = (section: Section) => {
    return (
      <div key={section.name} className="mb-8">
        <h3 className="text-lg font-medium mb-4">{section.title}</h3>
        {section.description && (
          <p className="text-sm text-gray-500 mb-4">{section.description}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {section.fields.map((field) => renderField(field, section.name))}
        </div>
      </div>
    );
  };
  
  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{formDefinition.formTitle}</h2>
        {formDefinition.formSubtitle && (
          <h3 className="text-xl font-medium mt-1">{formDefinition.formSubtitle}</h3>
        )}
        {formDefinition.formDescription && (
          <p className="text-sm text-gray-500 mt-2">{formDefinition.formDescription}</p>
        )}
        <div className="text-sm font-medium mt-2">Form: {formDefinition.formNumber}</div>
      </div>
      
      <div>
        {formDefinition.sections.map(renderSection)}
      </div>
    </div>
  );
};

export default DynamicForm;