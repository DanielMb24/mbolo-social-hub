# Implementation Plan: Chat File Upload Fix

## Overview

This implementation plan addresses the 400 Bad Request errors occurring when users upload files through the chat interface. The fix involves adding comprehensive logging to identify the root cause, ensuring the JWT filter properly forwards authentication headers for multipart requests, improving error handling, and adding tests to prevent regression.

## Tasks

- [ ] 1. Add diagnostic logging to identify the root cause
  - [ ] 1.1 Add request logging to JWT filter
    - Add logging before and after JWT processing to track header addition
    - Log the request path, method, and Content-Type
    - Log whether X-User-Id header is being added
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 1.2 Add request logging to upload endpoint
    - Add logging at the start of the uploadFile method
    - Log all received headers (especially X-User-Id and Authorization)
    - Log all received parameters (file, conversationId, type)
    - Log the Content-Type header value
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 1.3 Test with logging enabled
    - Run the application with debug logging
    - Attempt a file upload and capture logs
    - Identify whether X-User-Id header is missing at gateway or backend
    - Document findings in a comment
    - _Requirements: 1.4_

- [ ] 2. Fix JWT filter for multipart requests
  - [ ] 2.1 Verify JWT filter doesn't consume request body
    - Review the filter implementation to ensure it only reads headers
    - Ensure the filter doesn't call any methods that read the request body
    - Verify the mutated request is created before any body access
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 2.2 Add explicit multipart handling if needed
    - If the issue is specific to multipart requests, add special handling
    - Ensure Content-Type header is preserved during request mutation
    - Test that form data parameters are not consumed during filtering
    - _Requirements: 5.2, 5.3_
  
  - [ ]* 2.3 Write property test for JWT filter header forwarding
    - **Property 1: JWT Filter forwards both Authorization and X-User-Id headers**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
    - Generate random valid JWT tokens with different user IDs
    - Process through filter and verify both headers are present
    - Run minimum 100 iterations
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3. Improve upload endpoint error handling
  - [ ] 3.1 Add detailed error messages for missing parameters
    - Catch MissingRequestHeaderException for X-User-Id
    - Catch MissingServletRequestParameterException for file, conversationId, type
    - Return 400 with descriptive error messages
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 3.2 Add validation for type parameter
    - Validate that type is one of: IMAGE, FILE, AUDIO
    - Return 400 with error message if invalid
    - _Requirements: 3.5_
  
  - [ ] 3.3 Add exception handler for upload errors
    - Create @ExceptionHandler methods in controller
    - Handle file storage exceptions
    - Return appropriate error responses
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 3.4 Write unit tests for error conditions
    - Test missing X-User-Id header returns 400
    - Test missing file parameter returns 400
    - Test missing conversationId returns 400
    - Test missing type parameter returns 400
    - Test invalid type value returns 400
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 3.5 Write property test for invalid type rejection
    - **Property 4: Invalid types are rejected**
    - **Validates: Requirements 3.5**
    - Generate random strings that are not IMAGE, FILE, or AUDIO
    - Verify 400 response with error message
    - Run minimum 100 iterations
    - _Requirements: 3.5_

- [ ] 4. Checkpoint - Verify backend fixes work
  - Test file upload directly to backend (bypassing gateway)
  - Manually add X-User-Id header to test request
  - Verify upload succeeds with proper headers
  - Ensure all tests pass, ask the user if questions arise

- [ ] 5. Enhance frontend error handling
  - [ ] 5.1 Improve error message handling in handleFileUpload
    - Parse error response JSON to extract error message
    - Display specific error messages based on status code
    - Handle 401 errors by redirecting to login
    - Handle 400 errors by showing validation message
    - Handle 500 errors by showing server error message
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 5.2 Add loading state management
    - Ensure setSending(true) is called before upload starts
    - Ensure setSending(false) is called in finally block
    - Display loading indicator while sending is true
    - _Requirements: 4.5_
  
  - [ ] 5.3 Add success feedback
    - Display success toast notification on successful upload
    - Ensure uploaded content appears in chat immediately
    - _Requirements: 4.4_
  
  - [ ]* 5.4 Write unit tests for frontend error handling
    - Test 401 response shows auth error and redirects
    - Test 400 response shows validation error
    - Test 500 response shows server error
    - Test network error shows connection error
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 5.5 Write property test for upload success UI feedback
    - **Property 5: Success shows notification and content**
    - **Validates: Requirements 4.4**
    - Generate random successful upload responses
    - Verify success toast is displayed
    - Verify content appears in chat
    - Run minimum 100 iterations
    - _Requirements: 4.4_
  
  - [ ]* 5.6 Write property test for upload progress indication
    - **Property 6: Loading indicator shown during upload**
    - **Validates: Requirements 4.5**
    - Simulate upload operations
    - Verify loading indicator is visible during upload
    - Run minimum 100 iterations
    - _Requirements: 4.5_

- [ ] 6. Add integration tests
  - [ ]* 6.1 Write end-to-end upload test
    - Start gateway and chat service in test environment
    - Send upload request with valid JWT from simulated frontend
    - Verify file is stored and URL is returned
    - Verify file can be retrieved from returned URL
    - _Requirements: 2.5, 5.1, 5.4_
  
  - [ ]* 6.2 Write property test for gateway parameter transparency
    - **Property 8: Gateway forwards all parameters**
    - **Validates: Requirements 5.3, 5.4**
    - Generate random form data with multiple parameters
    - Send through gateway and directly to backend
    - Verify backend receives identical parameters in both cases
    - Run minimum 100 iterations
    - _Requirements: 5.3, 5.4_
  
  - [ ]* 6.3 Write property test for Content-Type preservation
    - **Property 7: Content-Type header is preserved**
    - **Validates: Requirements 5.2**
    - Generate random multipart requests with various boundaries
    - Send through gateway
    - Verify backend receives identical Content-Type header
    - Run minimum 100 iterations
    - _Requirements: 5.2_

- [ ] 7. Final checkpoint and verification
  - Run all unit tests and verify they pass
  - Run all property tests and verify they pass
  - Test file upload through the complete flow (frontend → gateway → backend)
  - Test with images, documents, and audio files
  - Verify error handling works for all error cases
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The diagnostic logging in task 1 is critical for identifying the root cause
- Task 4 checkpoint ensures backend fixes work before moving to frontend
- Property tests validate universal correctness across many inputs
- Unit tests validate specific examples and edge cases
- Integration tests verify the complete flow works end-to-end
