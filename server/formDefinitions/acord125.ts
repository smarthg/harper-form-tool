import { FormDefinition } from "@shared/formTypes/acord125";

/**
 * Get the ACORD 125 form definition
 * This could be loaded from a database or file in a production environment
 */
export async function getAcord125Definition(): Promise<FormDefinition> {
  return {
    formTitle: "COMMERCIAL INSURANCE APPLICATION",
    formSubtitle: "APPLICANT INFORMATION SECTION",
    formNumber: "ACORD 125",
    formDescription: "This is the ACORD 125 Commercial Insurance Application form that collects applicant information for commercial insurance policies.",
    sections: [
      {
        name: "agency",
        title: "Agency Information",
        repeating: false,
        fields: [
          {
            name: "agency",
            type: "text",
            label: "Agency Name"
          },
          {
            name: "contactName",
            type: "text",
            label: "Contact Name"
          },
          {
            name: "phone",
            type: "phone",
            label: "Phone"
          },
          {
            name: "fax",
            type: "phone",
            label: "Fax"
          },
          {
            name: "email",
            type: "email",
            label: "Email"
          },
          {
            name: "code",
            type: "text",
            label: "Agency Code"
          },
          {
            name: "subcode",
            type: "text",
            label: "Sub Code"
          },
          {
            name: "agencyCustomerId",
            type: "text",
            label: "Agency Customer ID"
          }
        ]
      },
      {
        name: "applicant",
        title: "Applicant Information",
        repeating: false,
        fields: [
          {
            name: "namedInsured",
            type: "text",
            label: "Named Insured"
          },
          {
            name: "mailingAddress",
            type: "textarea",
            label: "Mailing Address"
          },
          {
            name: "glCode",
            type: "text",
            label: "GL Code"
          },
          {
            name: "sic",
            type: "text",
            label: "SIC"
          },
          {
            name: "naics",
            type: "text",
            label: "NAICS"
          },
          {
            name: "feinOrSocSec",
            type: "text",
            label: "FEIN or Social Security Number"
          },
          {
            name: "businessPhone",
            type: "phone",
            label: "Business Phone"
          },
          {
            name: "websiteAddress",
            type: "url",
            label: "Website Address"
          },
          {
            name: "businessType",
            type: "radio",
            label: "Business Type",
            options: [
              "Individual",
              "Partnership",
              "Corporation",
              "LLC",
              "LLP",
              "Other"
            ]
          }
        ]
      },
      {
        name: "policy",
        title: "Policy Information",
        repeating: false,
        fields: [
          {
            name: "proposedEffDate",
            type: "date",
            label: "Proposed Effective Date"
          },
          {
            name: "proposedExpDate",
            type: "date",
            label: "Proposed Expiration Date"
          },
          {
            name: "billingPlan",
            type: "radio",
            label: "Billing Plan",
            options: [
              "Agency Bill",
              "Direct Bill"
            ]
          },
          {
            name: "paymentPlan",
            type: "radio",
            label: "Payment Plan",
            options: [
              "Annual",
              "Semi-Annual",
              "Quarterly",
              "Monthly"
            ],
            conditionalOn: "billingPlan",
            conditions: ["Direct Bill"]
          },
          {
            name: "methodOfPayment",
            type: "radio",
            label: "Method of Payment",
            options: [
              "Check",
              "Credit Card",
              "EFT",
              "Other"
            ],
            conditionalOn: "billingPlan",
            conditions: ["Direct Bill"]
          },
          {
            name: "audit",
            type: "checkbox",
            label: "Audit"
          },
          {
            name: "deposit",
            type: "currency",
            label: "Deposit"
          },
          {
            name: "minimumPremium",
            type: "currency",
            label: "Minimum Premium"
          },
          {
            name: "policyPremium",
            type: "currency",
            label: "Policy Premium"
          }
        ]
      }
    ]
  };
}