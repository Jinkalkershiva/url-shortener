/**
 * Aligned with GlobalExceptionHandler.java
 * Parses Axios exceptions into human-readable notification strings.
 */
export const GlobalExceptionHandler = {
  parse(error) {
    if (error.response) {
      const data = error.response.data;
      if (data && data.message) {
        return data.message;
      }
      switch (error.response.status) {
        case 400:
          return 'Bad Request. Please verify your input parameters.';
        case 401:
          return 'Unauthorized. Please log in to continue.';
        case 403:
          return 'Access Denied. You do not have permission.';
        case 404:
          return 'Resource not found.';
        case 410:
          return 'Gone. This shortened link has expired.';
        case 500:
          return 'Internal Server Error. Please try again later.';
        default:
          return `Unexpected Error (HTTP ${error.response.status}).`;
      }
    } else if (error.request) {
      return 'Network Error. Could not connect to the backend server.';
    } else {
      return error.message || 'An error occurred during process execution.';
    }
  }
};

export default GlobalExceptionHandler;
