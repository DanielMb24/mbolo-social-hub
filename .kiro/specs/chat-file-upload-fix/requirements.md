# Requirements Document

## Introduction

This document specifies the requirements for fixing the chat file upload functionality that currently returns 400 Bad Request errors. The issue occurs when users attempt to upload images, files, or audio messages through the chat interface. The root cause is that the API Gateway's JWT authentication filter is not properly forwarding the `X-User-Id` header for multipart/form-data upload requests, causing the backend controller to reject requests due to missing required headers.

## Glossary

- **API_Gateway**: The Spring Cloud Gateway service that routes requests and handles JWT authentication
- **Chat_Service**: The backend microservice that handles chat operations including file uploads
- **Frontend**: The React TypeScript application that provides the user interface
- **JWT_Filter**: The gateway filter that validates JWT tokens and extracts user information
- **Upload_Endpoint**: The `/api/chat/upload` endpoint that receives file uploads
- **X-User-Id_Header**: The HTTP header containing the authenticated user's ID extracted from the JWT token
- **Multipart_Request**: An HTTP request with `Content-Type: multipart/form-data` used for file uploads

## Requirements

### Requirement 1: JWT Filter Header Forwarding

**User Story:** As a system component, I want the API Gateway to properly forward authentication headers for all request types, so that file upload requests are authenticated correctly.

#### Acceptance Criteria

1. WHEN the JWT_Filter processes a valid JWT token, THE API_Gateway SHALL extract the user ID and add it as the X-User-Id_Header to the forwarded request
2. WHEN the JWT_Filter processes a Multipart_Request, THE API_Gateway SHALL preserve the X-User-Id_Header in the forwarded request
3. WHEN the JWT_Filter processes any authenticated request, THE API_Gateway SHALL forward both the original Authorization header and the X-User-Id_Header to downstream services
4. WHEN the Upload_Endpoint receives a request, THE request SHALL contain the X-User-Id_Header with a valid user ID

### Requirement 2: File Upload Request Handling

**User Story:** As a user, I want to upload images, files, and audio messages in chat conversations, so that I can share media content with other participants.

#### Acceptance Criteria

1. WHEN a user selects an image file, THE Frontend SHALL send a Multipart_Request to the Upload_Endpoint with the file, conversationId, and type parameters
2. WHEN a user selects a document file, THE Frontend SHALL send a Multipart_Request to the Upload_Endpoint with the file, conversationId, and type parameters
3. WHEN a user records an audio message, THE Frontend SHALL send a Multipart_Request to the Upload_Endpoint with the audio file, conversationId, and type set to AUDIO
4. WHEN the Frontend sends an upload request, THE request SHALL include the Authorization header with a valid JWT token
5. WHEN the Upload_Endpoint receives a valid request with all required parameters, THE Chat_Service SHALL process the file and return a success response with the file URL

### Requirement 3: Upload Endpoint Validation

**User Story:** As a backend service, I want to validate all required parameters for file uploads, so that I can provide clear error messages when requests are malformed.

#### Acceptance Criteria

1. WHEN the Upload_Endpoint receives a request without the X-User-Id_Header, THE Chat_Service SHALL return a 400 Bad Request response with a descriptive error message
2. WHEN the Upload_Endpoint receives a request without the file parameter, THE Chat_Service SHALL return a 400 Bad Request response with a descriptive error message
3. WHEN the Upload_Endpoint receives a request without the conversationId parameter, THE Chat_Service SHALL return a 400 Bad Request response with a descriptive error message
4. WHEN the Upload_Endpoint receives a request without the type parameter, THE Chat_Service SHALL return a 400 Bad Request response with a descriptive error message
5. WHEN the Upload_Endpoint receives a request with an invalid type value, THE Chat_Service SHALL return a 400 Bad Request response with a descriptive error message

### Requirement 4: Error Handling and User Feedback

**User Story:** As a user, I want to receive clear feedback when file uploads fail, so that I understand what went wrong and can take corrective action.

#### Acceptance Criteria

1. WHEN a file upload fails due to authentication issues, THE Frontend SHALL display an error message indicating authentication failure
2. WHEN a file upload fails due to missing parameters, THE Frontend SHALL display an error message indicating the request was invalid
3. WHEN a file upload fails due to server errors, THE Frontend SHALL display an error message indicating a server problem
4. WHEN a file upload succeeds, THE Frontend SHALL display a success notification and show the uploaded content in the chat
5. WHEN a file upload is in progress, THE Frontend SHALL display a loading indicator to inform the user

### Requirement 5: Upload Path Configuration

**User Story:** As a system administrator, I want the upload endpoint to be properly configured in the API Gateway, so that upload requests are routed correctly without authentication issues.

#### Acceptance Criteria

1. WHEN the API_Gateway routes requests to the Upload_Endpoint, THE gateway SHALL apply the JWT_Filter to authenticate the request
2. WHEN the API_Gateway routes upload requests, THE gateway SHALL not strip or modify the Content-Type header
3. WHEN the API_Gateway routes upload requests, THE gateway SHALL forward all form data parameters to the Chat_Service
4. WHEN the Upload_Endpoint is accessed through the API_Gateway, THE endpoint SHALL receive the same parameters as if accessed directly
