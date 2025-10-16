// Debug utility to help troubleshoot API responses
export const debugApiResponse = (response: any, context: string) => {
  console.group(`🔍 API Debug - ${context}`);
  console.log('Response type:', typeof response);
  console.log('Is array:', Array.isArray(response));
  console.log('Response data:', response);
  
  if (response && typeof response === 'object') {
    console.log('Object keys:', Object.keys(response));
    
    if (Array.isArray(response)) {
      console.log('Array length:', response.length);
      if (response.length > 0) {
        console.log('First item:', response[0]);
        console.log('First item keys:', Object.keys(response[0] || {}));
      }
    }
  }
  console.groupEnd();
};