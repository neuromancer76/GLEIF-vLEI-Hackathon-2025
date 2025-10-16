import axios, { type AxiosResponse } from 'axios';
import type {
  OrderDetails,
  CreateSupplierRequestDto,
  SendSupplierInvitationDto,
  ApiError,
  OrderSummary,
  CompanyData,
  EnhancedCompanyRequester,
  EnhancedSupplierCandidate,
  ApplicationDetails,
  OrderNotification
} from '../types/api';
import type { ChatMessageRequest, ChatMessageResponse } from '../types/chat';
import { debugApiResponse } from '../utils/debug';

// Get API URLs from environment variables
const SUPPLIER_API_BASE_URL = import.meta.env.VITE_SUPPLIER_API_URL || 'http://localhost:5178';
const CHATBOT_API_BASE_URL = import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:5184';

// Create axios instance for supplier portal API
const apiClient = axios.create({
  baseURL: SUPPLIER_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Enable credentials for CORS
  withCredentials: false,
});

// Create separate axios instance for chatbot API
const chatbotApiClient = axios.create({
  baseURL: CHATBOT_API_BASE_URL,
  timeout: 30000, // Longer timeout for AI responses
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor for adding auth headers if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add any authentication headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    let message = 'An unexpected error occurred';
    let statusCode = 500;

    if (error.response) {
      // Server responded with error status
      statusCode = error.response.status;
      message = error.response.data?.message || error.response.statusText || `HTTP ${statusCode} Error`;
      
      if (statusCode === 405) {
        message = 'Method not allowed. Please check if the API endpoint supports this HTTP method and CORS is properly configured.';
      }
    } else if (error.request) {
      // Request was made but no response received (network error, CORS, etc.)
      statusCode = 0;
      if (error.code === 'ERR_NETWORK') {
        message = `Network error. Please check if the backend API is running on ${SUPPLIER_API_BASE_URL} and CORS is properly configured.`;
      } else {
        message = 'No response from server. Please check your internet connection and that the API is running.';
      }
    } else {
      // Something else happened
      message = error.message || 'Request setup error';
    }

    const apiError: ApiError = { message, statusCode };
    return Promise.reject(apiError);
  }
);

// Interceptors for chatbot API client
chatbotApiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

chatbotApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    let message = 'An unexpected error occurred';
    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status;
      message = error.response.data?.error || error.response.data?.message || error.response.statusText || `HTTP ${statusCode} Error`;
    } else if (error.request) {
      statusCode = 0;
      if (error.code === 'ERR_NETWORK') {
        message = `Network error. Please check if the chatbot API is running on ${CHATBOT_API_BASE_URL} and CORS is properly configured.`;
      } else {
        message = 'No response from chatbot server. Please check your internet connection and that the API is running.';
      }
    } else {
      message = error.message || 'Request setup error';
    }

    const apiError: ApiError = { message, statusCode };
    return Promise.reject(apiError);
  }
);

export class SupplierApiService {
  
  // Get application details on startup
  static async getApplicationDetails(): Promise<ApplicationDetails> {
    try {
      const response: AxiosResponse<ApplicationDetails> = await apiClient.get('/api/Supplier/application-details');
      console.log('Application details response:', response.data);
      debugApiResponse(response.data, 'getApplicationDetails');
      return response.data;
    } catch (error) {
      console.error('Error fetching application details:', error);
      throw error as ApiError;
    }
  }

  // Get required risk schema credential AID
  static async getRequiredRiskSchemaCredentialAid(): Promise<any> {
    try {
      const response: AxiosResponse<any> = await apiClient.get('/api/Supplier/required-risk-schema-credential-aid');
      console.log('Required risk schema credential AID response:', response.data);
      debugApiResponse(response.data, 'getRequiredRiskSchemaCredentialAid');
      return response.data;
    } catch (error) {
      console.error('Error fetching required risk schema credential AID:', error);
      throw error as ApiError;
    }
  }

  // Check credentials with entity AID and credential schema AID
  static async checkCredentials(entityAid: string, credentialSchemaAid: string): Promise<any> {
    try {
      const response: AxiosResponse<any> = await apiClient.post('/api/Supplier/check-credentials', null, {
        params: {
          entityAid,
          credentialSchemaAid
        }
      });
      console.log('Check credentials response:', response.data);
      debugApiResponse(response.data, 'checkCredentials');
      return response.data;
    } catch (error) {
      console.error('Error checking credentials:', error);
      throw error as ApiError;
    }
  }

  // Send chat message to AI agent (Semantic Kernel backend)
  static async sendChatMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    try {
      console.log(`%c🤖 Sending chat message to backend: ${CHATBOT_API_BASE_URL}/api/Chat/message`, 'color: #667eea; font-weight: bold');
      console.log('Request:', request);
      
      // Call the actual chatbot API
      const response: AxiosResponse<any> = await chatbotApiClient.post('/api/Chat/message', {
        message: request.message,
        conversationId: request.conversationId,
        userId: request.userId,
        context: request.context,
        history: request.history,
        attachment: request.attachment
      });
      
      console.log('%c✅ Real AI response received from backend', 'color: #10b981; font-weight: bold');
      console.log('Response:', response.data);
      
      // Check if the backend returned an error
      if (response.data.success === false) {
        throw new Error(response.data.error || 'Failed to get chat response');
      }
      
      // Transform backend response to frontend format
      const chatResponse: ChatMessageResponse = {
        message: response.data.message,
        conversationId: response.data.conversationId || request.conversationId || '',
        timestamp: response.data.timestamp || new Date().toISOString(),
        action: response.data.action,
        toolCalls: response.data.toolCalls,  // Tool names that were called
        ecosystemMessages: response.data.ecosystemMessages,  // User-friendly ecosystem call messages
        // Threading support
        threadId: response.data.threadId,
        threadTitle: response.data.threadTitle,
        threadIcon: response.data.threadIcon,
        isThreadStart: response.data.isThreadStart,
        suggestedThreads: response.data.suggestedThreads,
        success: response.data.success !== false,
        error: response.data.error,
        metadata: response.data.metadata
      };
      
      debugApiResponse(chatResponse, 'sendChatMessage');
      
      return chatResponse;
    } catch (error) {
      console.error('%c❌ Error calling chatbot API:', 'color: #ef4444; font-weight: bold', error);
      
      // Fallback to mock response in case of error during development
      if (import.meta.env.DEV) {
        console.warn('%c⚠️  FALLBACK: Using mock response (Chatbot API not available at ' + CHATBOT_API_BASE_URL + ')', 'color: #f59e0b; font-weight: bold; font-size: 12px');
        console.warn('%c💡 To use real AI: Start the chatbot API with: cd vlei-ecosystem-agent\\vlei-chatbot-api && dotnet run', 'color: #3b82f6; font-style: italic');
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockResponse = this.generateMockChatResponse(request);
        console.log('%c🎭 Mock response generated', 'color: #f59e0b; font-weight: bold');
        return mockResponse;
      }
      
      throw error as ApiError;
    }
  }

  // Start a new conversation with company context
  static async startConversation(companyData: CompanyData): Promise<{ conversationId: string; message: string }> {
    try {
      console.log(`%c🚀 Starting new conversation with company context`, 'color: #667eea; font-weight: bold');
      
      // Create the initial message with company context
      const initialMessage = `I'm the CEO of this company: ${JSON.stringify({
        companyName: companyData.companyName || companyData.legalName,
        lei: companyData.lei,
        country: companyData.jurisdiction,
        status: companyData.status,
        address: companyData.primaryAddress?.formattedAddress || companyData.address
      }, null, 2)}`;
      
      console.log('Initial message:', initialMessage);
      
      const response: AxiosResponse<any> = await chatbotApiClient.post('/api/Chat/start', {
        initialMessage
      });
      
      console.log('%c✅ Conversation started', 'color: #10b981; font-weight: bold');
      console.log('Response:', response.data);
      
      return {
        conversationId: response.data.conversationId,
        message: response.data.message
      };
    } catch (error) {
      console.error('%c❌ Error starting conversation:', 'color: #ef4444; font-weight: bold', error);
      throw error as ApiError;
    }
  }

  // Clear conversation history (start fresh conversation)
  static async clearConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`%c🧹 Clearing conversation: ${conversationId}`, 'color: #f59e0b; font-weight: bold');
      
      const response: AxiosResponse<any> = await chatbotApiClient.post(`/api/Chat/clear/${conversationId}`);
      
      console.log('%c✅ Conversation cleared', 'color: #10b981; font-weight: bold');
      console.log('Response:', response.data);
      
      return {
        success: response.data.success !== false,
        message: response.data.message || 'Conversation cleared successfully'
      };
    } catch (error) {
      console.error('%c❌ Error clearing conversation:', 'color: #ef4444; font-weight: bold', error);
      
      // Return success in dev mode to allow clearing
      if (import.meta.env.DEV) {
        console.warn('%c⚠️  FALLBACK: Clearing conversation locally (API not available)', 'color: #f59e0b');
        return { success: true, message: 'Conversation cleared locally' };
      }
      
      throw error as ApiError;
    }
  }

  // Generate mock chat responses for development
  private static generateMockChatResponse(request: ChatMessageRequest): ChatMessageResponse {
    const conversationId = request.conversationId || `conv_${Date.now()}`;
    const userMessage = request.message.toLowerCase();
    
    // Different response scenarios
    let message = '';
    let action = undefined;
    
    if (userMessage.includes('create') && userMessage.includes('order')) {
      message = "I can help you create a new order. Would you like me to guide you through the process?";
      action = {
        type: 'confirmation' as const,
        actionId: 'create_order',
        prompt: 'Would you like to create a new order?',
        options: [
          { label: 'Yes, create order', value: 'accept', variant: 'primary' as const },
          { label: 'Not now', value: 'decline', variant: 'secondary' as const }
        ]
      };
    } else if (userMessage.includes('hello') || userMessage.includes('hi')) {
      message = "Hello! I'm your VLEI Supplier Portal assistant. I can help you with:\n\n• Creating new orders\n• Managing suppliers\n• Checking order status\n• Answering questions about the portal\n\nHow can I assist you today?";
    } else if (userMessage.includes('help')) {
      message = "I'm here to help! Here are some things I can do:\n\n✓ Create and manage orders\n✓ Add or remove suppliers\n✓ Check order status and history\n✓ Provide guidance on using the portal\n✓ Answer questions about VLEI credentials\n\nWhat would you like to know more about?";
    } else if (userMessage.includes('status') || userMessage.includes('order')) {
      message = "I can check the status of your orders. Based on your current view, you can see all active orders in the list. Would you like me to filter or sort them in a specific way?";
      action = {
        type: 'choice' as const,
        actionId: 'filter_orders',
        prompt: 'How would you like to view your orders?',
        options: [
          { label: 'Show all orders', value: 'all', variant: 'primary' as const },
          { label: 'Recent orders only', value: 'recent', variant: 'secondary' as const },
          { label: 'Pending applications', value: 'pending', variant: 'secondary' as const }
        ]
      };
    } else if (userMessage.includes('supplier')) {
      message = "I can help you manage suppliers. You can:\n\n• Add new suppliers to an order\n• Send invitations to suppliers\n• View supplier applications\n• Check supplier credentials\n\nWhat would you like to do?";
    } else if (userMessage.includes('delete') || userMessage.includes('remove')) {
      message = "I notice you want to delete or remove something. This is a critical action that requires confirmation.";
      action = {
        type: 'confirmation' as const,
        actionId: 'confirm_delete',
        prompt: 'Are you sure you want to proceed with this deletion?',
        options: [
          { label: 'Yes, delete', value: 'accept', variant: 'danger' as const },
          { label: 'Cancel', value: 'decline', variant: 'secondary' as const }
        ]
      };
    } else {
      // Generic response
      const responses = [
        "That's an interesting question! Could you provide more details about what you're trying to accomplish?",
        "I understand you're asking about that. Let me see how I can help you with this.",
        "Thanks for your question! To give you the best answer, could you tell me a bit more about your specific needs?",
        "I'm here to assist! Could you clarify what aspect you'd like help with?"
      ];
      message = responses[Math.floor(Math.random() * responses.length)];
    }
    
    return {
      message,
      conversationId,
      timestamp: new Date().toISOString(),
      action,
      metadata: {
        modelUsed: 'semantic-kernel-agent',
        tokensUsed: Math.floor(Math.random() * 100) + 50,
        processingTime: Math.floor(Math.random() * 500) + 200
      },
      success: true
    };
  }

  // Get company data by LEI
  static async getCompanyData(lei: string): Promise<CompanyData> {
    try {
      const response: AxiosResponse<CompanyData> = await apiClient.get(`/api/Supplier/company-data/${lei}`);
      console.log('Company data response:', response.data);
      debugApiResponse(response.data, 'getCompanyData');
      
      // Add computed fields for backward compatibility
      const companyData: CompanyData = {
        ...response.data,
        companyName: response.data.legalName,
        address: response.data.primaryAddress.formattedAddress,
        prefix: response.data.lei.substring(0, 4), // Use first 4 chars of LEI as prefix
        oobi: `http://localhost:5156/oobi/${response.data.lei}` // Generate OOBI URL
      };
      
      return companyData;
    } catch (error) {
      console.error('Error fetching company data:', error);
      throw error as ApiError;
    }
  }

  // Get all orders for a company LEI
  static async getOrders(lei: string): Promise<OrderSummary[]> {
    try {
      const response = await apiClient.get('/api/Supplier/orders', {
        params: { lei }
      });
      
      console.log('API Response for getOrders:', response.data);
      debugApiResponse(response.data, 'getOrders');
      
      // Handle different response formats
      let ordersData = response.data;
      
      // If response is wrapped in a property, extract it
      if (ordersData && typeof ordersData === 'object' && !Array.isArray(ordersData)) {
        // Check common wrapper properties
        if (ordersData.orders) ordersData = ordersData.orders;
        else if (ordersData.data) ordersData = ordersData.data;
        else if (ordersData.items) ordersData = ordersData.items;
      }
      
      // Ensure we have an array
      if (!Array.isArray(ordersData)) {
        console.warn('Expected array but got:', typeof ordersData, ordersData);
        return []; // Return empty array instead of throwing error
      }
      
      // Transform OrderDetails to OrderSummary for listing
      return ordersData.map((order: any) => ({
        orderId: order.orderId || order.id || '',
        description: order.description || '',
        totalAmount: order.totalAmount || '0',
        createdAt: order.createdAt || new Date().toISOString(),
        candidatesCount: order.candidates?.length || 0,
        appliedCount: order.candidates?.filter((c: any) => c.applied).length || 0
      }));
    } catch (error) {
      console.error('Error in getOrders:', error);
      throw error as ApiError;
    }
  }

  // Get all orders where a supplier LEI is a candidate
  static async getOrdersForSupplier(supplierLei: string): Promise<OrderSummary[]> {
    try {
      const response = await apiClient.get('/api/Supplier/orders-for-supplier', {
        params: { supplierLei }
      });
      
      console.log('API Response for getOrdersForSupplier:', response.data);
      debugApiResponse(response.data, 'getOrdersForSupplier');
      
      // Handle different response formats
      let ordersData = response.data;
      
      // If response is wrapped in a property, extract it
      if (ordersData && typeof ordersData === 'object' && !Array.isArray(ordersData)) {
        // Check common wrapper properties
        if (ordersData.orders) ordersData = ordersData.orders;
        else if (ordersData.data) ordersData = ordersData.data;
        else if (ordersData.items) ordersData = ordersData.items;
      }
      
      // Ensure we have an array
      if (!Array.isArray(ordersData)) {
        console.warn('Expected array but got:', typeof ordersData, ordersData);
        return []; // Return empty array instead of throwing error
      }
      
      // Transform OrderDetails to OrderSummary for listing
      return ordersData.map((order: any) => ({
        orderId: order.orderId || order.id || '',
        description: order.description || '',
        totalAmount: order.totalAmount || '0',
        createdAt: order.createdAt || new Date().toISOString(),
        candidatesCount: order.candidates?.length || 0,
        appliedCount: order.candidates?.filter((c: any) => c.applied).length || 0
      }));
    } catch (error) {
      console.error('Error in getOrdersForSupplier:', error);
      throw error as ApiError;
    }
  }

  // Get specific order details
  static async getOrderDetails(orderId: string): Promise<OrderDetails> {
    try {
      const response: AxiosResponse<OrderDetails> = await apiClient.get(`/api/Supplier/order/${orderId}`);
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  // Create a new supplier request
  static async createSupplierRequest(request: CreateSupplierRequestDto): Promise<void> {
    try {
      await apiClient.post('/api/Supplier/create-request', request);
    } catch (error) {
      throw error as ApiError;
    }
  }

  // Send invitation to supplier
  static async sendInvitation(invitation: SendSupplierInvitationDto): Promise<void> {
    try {
      await apiClient.post('/api/Supplier/send-invitation', invitation);
    } catch (error) {
      throw error as ApiError;
    }
  }

  // Apply as supplier
  static async applyAsSupplier(orderId: string, lei: string): Promise<void> {
    try {
      await apiClient.post('/api/Supplier/apply', null, {
        params: { orderId, lei }
      });
    } catch (error) {
      throw error as ApiError;
    }
  }

  // Generate supplier application link (now using LEI instead of email)
  static generateSupplierLink(orderId: string, lei: string): string {
    const encodedOrderId = encodeURIComponent(orderId);
    const encodedLei = encodeURIComponent(lei);
    return `${window.location.origin}/supplier?orderId=${encodedOrderId}&lei=${encodedLei}`;
  }

  // Helper method to load company data for an entity with LEI
  static async loadCompanyDataForEntity<T extends { lei: string | null }>(entity: T): Promise<T & { companyData?: CompanyData }> {
    if (!entity.lei) {
      return entity;
    }

    try {
      const companyData = await this.getCompanyData(entity.lei);
      return { ...entity, companyData };
    } catch (error) {
      console.warn(`Failed to load company data for LEI ${entity.lei}:`, error);
      return entity;
    }
  }

  // Helper method to load company data for multiple entities
  static async loadCompanyDataForEntities<T extends { lei: string | null }>(entities: T[]): Promise<(T & { companyData?: CompanyData })[]> {
    const promises = entities.map(entity => this.loadCompanyDataForEntity(entity));
    return Promise.all(promises);
  }

  // Notification methods
  static async getNotificationCount(lei: string): Promise<{ count: number }> {
    try {
      const response: AxiosResponse<{ count: number }> = await apiClient.get('/api/Supplier/notifications/count', {
        params: { lei }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting notification count:', error);
      throw error as ApiError;
    }
  }

  static async getNotifications(lei: string): Promise<OrderNotification[]> {
    try {
      const response: AxiosResponse<OrderNotification[]> = await apiClient.get('/api/Supplier/notifications', {
        params: { lei }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error as ApiError;
    }
  }

  static async markAllNotificationsAsRead(lei: string): Promise<void> {
    try {
      await apiClient.post('/api/Supplier/notifications/mark-all-read', null, {
        params: { lei }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error as ApiError;
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await apiClient.post(`/api/Supplier/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error as ApiError;
    }
  }

  // Get available email templates
  static async getAvailableEmails(): Promise<Array<{name: string, path: string}>> {
    try {
      // For now, return a static list pointing to the docs folder
      // In production, this should be an API call to list available email templates
      return [
        { 
          name: 'purchase order request', 
          path: '/docs/alpha-net-email-template.html' 
        }
      ];
    } catch (error) {
      console.error('Error fetching available emails:', error);
      throw error as ApiError;
    }
  }

  // Enhanced method to get order details with company data loaded
  static async getOrderDetailsWithCompanyData(orderId: string): Promise<OrderDetails & { 
    requester: EnhancedCompanyRequester; 
    candidates: EnhancedSupplierCandidate[] 
  }> {
    try {
      const orderDetails = await this.getOrderDetails(orderId);
      
      // Load company data for requester if LEI is available
      const enhancedRequester = await this.loadCompanyDataForEntity(orderDetails.requester);
      
      // Load company data for all candidates with LEI
      const enhancedCandidates = await this.loadCompanyDataForEntities(orderDetails.candidates);
      
      return {
        ...orderDetails,
        requester: enhancedRequester,
        candidates: enhancedCandidates
      };
    } catch (error) {
      throw error as ApiError;
    }
  }
}