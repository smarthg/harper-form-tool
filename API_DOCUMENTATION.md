# API Documentation: Voice-Controlled Form Editor

This document outlines the available REST API endpoints for the Voice-Controlled Form Editor application. These endpoints allow developers to interact with the application's backend services programmatically.

## Base URL

All API endpoints are relative to the base URL of your deployed application.

Example base URL: `https://your-app-url.com`

## Authentication

All endpoints (except `/api/health`) require authentication using Clerk. You must include the proper authentication headers with your requests.

Authentication is handled via Clerk's session cookies or JWT tokens. Please refer to the [Clerk Documentation](https://docs.clerk.dev/reference/backend-api) for detailed information on authentication.

## API Endpoints

### Health Check

#### `GET /api/health`

Check if the API is operational.

**Authentication Required**: No

**Response**:

```json
{
  "status": "ok"
}
```

**Status Codes**:
- `200 OK`: Server is operational

### Form Data Management

#### `GET /api/form-data`

Retrieve the current form data.

**Authentication Required**: Yes

**Response**:

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com",
  "phone": "555-123-4567",
  "policyType": "auto",
  "policyNumber": "POL-123456",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "coverageAmount": "250000",
  "deductible": "500",
  "coverageType": "comprehensive",
  "monthlyPremium": "120"
}
```

**Status Codes**:
- `200 OK`: Form data retrieved successfully
- `401 Unauthorized`: Authentication required
- `500 Internal Server Error`: Server error

#### `PATCH /api/form-data`

Update specific fields in the form data.

**Authentication Required**: Yes

**Request Body**:

```json
{
  "firstName": "Jane",
  "lastName": "Doe"
}
```

**Response**:

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "john.smith@example.com",
  "phone": "555-123-4567",
  "policyType": "auto",
  "policyNumber": "POL-123456",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "coverageAmount": "250000",
  "deductible": "500",
  "coverageType": "comprehensive",
  "monthlyPremium": "120"
}
```

**Status Codes**:
- `200 OK`: Form data updated successfully
- `400 Bad Request`: Invalid request body
- `401 Unauthorized`: Authentication required
- `500 Internal Server Error`: Server error

### PDF Form Generation

#### `POST /api/fill-pdf`

Fill a PDF form with current form data.

**Authentication Required**: Yes

**Request Body**:

```json
{
  "formData": {
    "title": "ACORD 125",
    "data": {
      "namedInsured": "Example Company",
      "businessPhone": "555-123-4567",
      // Other form fields...
    }
  }
}
```

**Response**:

```json
{
  "message": "PDF filled successfully",
  "pdfUrl": "/uploads/acord125_filled_1234567890.pdf"
}
```

**Status Codes**:
- `200 OK`: PDF filled successfully
- `400 Bad Request`: Invalid request body or missing API key
- `401 Unauthorized`: Authentication required
- `500 Internal Server Error`: Server error


## Error Response Format

When an error occurs, the API will respond with an appropriate HTTP status code and a JSON object containing a message:

```json
{
  "message": "Error message description"
}
```

## Rate Limiting

The API currently does not implement rate limiting, but excessive requests may impact performance.

## Examples

### Example: Fetching Form Data

**Request**:
```bash
curl -X GET https://your-app-url.com/api/form-data \
  -H "Authorization: Bearer YOUR_CLERK_JWT_TOKEN"
```

**Response**:
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com",
  "phone": "555-123-4567",
  "policyType": "auto",
  "policyNumber": "POL-123456",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "coverageAmount": "250000",
  "deductible": "500",
  "coverageType": "comprehensive",
  "monthlyPremium": "120"
}
```

### Example: Updating Form Fields

**Request**:
```bash
curl -X PATCH https://your-app-url.com/api/form-data \
  -H "Authorization: Bearer YOUR_CLERK_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "coverageAmount": "300000"
  }'
```

**Response**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "john.smith@example.com",
  "phone": "555-123-4567",
  "policyType": "auto",
  "policyNumber": "POL-123456",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "coverageAmount": "300000",
  "deductible": "500",
  "coverageType": "comprehensive",
  "monthlyPremium": "120"
}
```

## Further Assistance

For questions or issues related to the API, please contact the development team or refer to the repository documentation.