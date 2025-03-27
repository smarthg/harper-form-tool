import { FormDefinition } from "@shared/formTypes/acord126";

/**
 * Get the ACORD 126 form definition
 * This could be loaded from a database or file in a production environment
 */
export async function getAcord126Definition(): Promise<FormDefinition> {
  return {
    formTitle: "COMMERCIAL GENERAL LIABILITY SECTION",
    formSubtitle: "ACORD 126 FORM",
    formNumber: "ACORD 126", // Required field
    formDescription: "This is the ACORD 126 Commercial General Liability Section form for commercial insurance applications.",
    sections: [
      {
        name: "basicInformation",
        title: "Basic Information",
        repeating: false,
        fields: [
          {
            name: "agencyCustomerId",
            type: "text",
            label: "Agency Customer ID"
          },
          {
            name: "effectiveDate",
            type: "date",
            label: "Effective Date"
          },
          {
            name: "agency",
            type: "text",
            label: "Agency"
          },
          {
            name: "carrier",
            type: "text",
            label: "Carrier"
          },
          {
            name: "naicCode",
            type: "text",
            label: "NAIC Code"
          },
          {
            name: "policyNumber",
            type: "text",
            label: "Policy Number"
          },
          {
            name: "applicantFirstNamedInsured",
            type: "text",
            label: "Applicant / First Named Insured"
          }
        ]
      },
      {
        name: "coverageLimits",
        title: "Coverage / Limits",
        repeating: false,
        fields: [
          {
            name: "coverageType",
            type: "radio",
            label: "Coverage Type",
            options: ["Commercial General Liability", "Owner's & Contractor's Protective"]
          },
          {
            name: "claimsOccurrence",
            type: "radio",
            label: "Claims Made or Occurrence",
            options: ["Claims Made", "Occurrence"]
          },
          {
            name: "generalAggregate",
            type: "currency",
            label: "General Aggregate"
          },
          {
            name: "limitAppliesPer",
            type: "checkbox",
            label: "Limit Applies Per",
            options: ["Policy", "Location", "Project", "Other"]
          },
          {
            name: "productsCompletedOperationsAggregate",
            type: "currency",
            label: "Products & Completed Operations Aggregate"
          },
          {
            name: "personalAdvertisingInjury",
            type: "currency",
            label: "Personal & Advertising Injury"
          },
          {
            name: "eachOccurrence",
            type: "currency",
            label: "Each Occurrence"
          },
          {
            name: "damageToRentedPremises",
            type: "currency",
            label: "Damage To Rented Premises (each occurrence)"
          },
          {
            name: "medicalExpense",
            type: "currency",
            label: "Medical Expense (Any one person)"
          },
          {
            name: "employeeBenefits",
            type: "currency",
            label: "Employee Benefits"
          }
        ]
      },
      {
        name: "deductibles",
        title: "Deductibles",
        repeating: false,
        fields: [
          {
            name: "propertyDamage",
            type: "currency",
            label: "Property Damage"
          },
          {
            name: "bodilyInjury",
            type: "currency",
            label: "Bodily Injury"
          },
          {
            name: "deductibleType",
            type: "radio",
            label: "Deductible Type",
            options: ["Per Claim", "Per Occurrence"]
          }
        ]
      },
      {
        name: "premiums",
        title: "Premiums",
        repeating: false,
        fields: [
          {
            name: "premiseOperations",
            type: "currency",
            label: "Premises/Operations"
          },
          {
            name: "products",
            type: "currency",
            label: "Products"
          },
          {
            name: "other",
            type: "currency",
            label: "Other"
          },
          {
            name: "total",
            type: "currency",
            label: "Total"
          }
        ]
      },
      {
        name: "additionalCoverages",
        title: "Additional Coverages",
        repeating: false,
        fields: [
          {
            name: "otherCoverages",
            type: "textarea",
            label: "Other Coverages, Restrictions and/or Endorsements"
          },
          {
            name: "umUimCoverage",
            type: "radio",
            label: "UM / UIM Coverage",
            options: ["Is", "Is Not Available"]
          },
          {
            name: "medicalPaymentsCoverage",
            type: "radio",
            label: "Medical Payments Coverage",
            options: ["Is", "Is Not Available"]
          }
        ]
      },
      {
        name: "scheduleOfHazards",
        title: "Schedule of Hazards",
        repeating: false,
        fields: [
          {
            name: "classificationDescription",
            type: "textarea",
            label: "Classification Description"
          },
          {
            name: "ratingPremiumBasis",
            type: "checkbox",
            label: "Rating and Premium Basis",
            options: [
              "(S) Gross Sales - Per $1,000/Sales",
              "(P) Payroll - Per $1,000/Pay",
              "(A) Area - Per 1,000/Sq Ft",
              "(C) Total Cost - Per $1,000/Cost",
              "(M) Admissions - Per 1,000/Adm",
              "(U) Unit - Per Unit",
              "(T) Other"
            ]
          }
        ]
      },
      {
        name: "claimsMade",
        title: "Claims Made",
        repeating: false,
        fields: [
          {
            name: "proposedRetroactiveDate",
            type: "date",
            label: "Proposed Retroactive Date"
          },
          {
            name: "entryDateUninterruptedClaimsMadeCoverage",
            type: "date",
            label: "Entry Date into Uninterrupted Claims Made Coverage"
          },
          {
            name: "excludedUninsuredSelfInsured",
            type: "radio",
            label: "Has Any Product, Work, Accident, or Location Been Excluded, Uninsured or Self-Insured From Any Previous Coverage",
            options: ["Yes", "No"]
          },
          {
            name: "tailCoveragePurchased",
            type: "radio",
            label: "Was Tail Coverage Purchased Under Any Previous Policy",
            options: ["Yes", "No"]
          }
        ]
      },
      {
        name: "employeeBenefitsLiability",
        title: "Employee Benefits Liability",
        repeating: false,
        fields: [
          {
            name: "deductiblePerClaim",
            type: "currency",
            label: "Deductible Per Claim"
          },
          {
            name: "numberOfEmployees",
            type: "number",
            label: "Number of Employees"
          },
          {
            name: "employeesCoveredByBenefitsPlans",
            type: "number",
            label: "Number of Employees Covered by Employee Benefits Plans"
          },
          {
            name: "retroactiveDate",
            type: "date",
            label: "Retroactive Date"
          }
        ]
      },
      {
        name: "contractors",
        title: "Contractors",
        repeating: false,
        fields: [
          {
            name: "drawPlansDesigns",
            type: "radio",
            label: "Does Applicant Draw Plans, Designs, or Specifications for Others",
            options: ["Yes", "No"]
          },
          {
            name: "operationsIncludeBlasting",
            type: "radio",
            label: "Do Any Operations Include Blasting or Utilize or Store Explosive Material",
            options: ["Yes", "No"]
          },
          {
            name: "operationsIncludeExcavation",
            type: "radio",
            label: "Do Any Operations Include Excavation, Tunneling, Underground Work or Earth Moving",
            options: ["Yes", "No"]
          },
          {
            name: "subcontractorsCoveragesLessThanYours",
            type: "radio",
            label: "Do Your Subcontractors Carry Coverages or Limits Less Than Yours",
            options: ["Yes", "No"]
          },
          {
            name: "subcontractorsWithoutCertificate",
            type: "radio",
            label: "Are Subcontractors Allowed to Work Without Providing You With a Certificate of Insurance",
            options: ["Yes", "No"]
          },
          {
            name: "leaseEquipmentToOthers",
            type: "radio",
            label: "Does Applicant Lease Equipment to Others With or Without Operators",
            options: ["Yes", "No"]
          }
        ]
      }
    ]
  };
}