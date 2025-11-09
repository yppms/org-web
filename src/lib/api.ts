// API utility functions for Kindy Student portal
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  meta?: {
    total_count?: number;
  };
}

export class ApiError extends Error {
  constructor(public message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    credentials: 'include', // Include cookies for JWT
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    // Check if response is ok (status 200-299)
    if (!response.ok) {
      // Try to parse error message from response
      let errorMessage = 'Network error occurred';
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If JSON parse fails, use generic message
        errorMessage = `Server error: ${response.status}`;
      }
      throw new ApiError(errorMessage, response.status);
    }

    // Try to parse JSON response
    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch (parseError) {
      // If JSON parsing fails but response was ok, treat as success
      console.warn('Response was successful but JSON parsing failed:', parseError);
      return {
        status: 'success',
        message: 'Operation completed successfully'
      };
    }
    
    if (data.status === 'error') {
      throw new ApiError(data.message || 'An error occurred', response.status);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Handle network errors or other unexpected errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network connection error. Please check your internet connection.');
    }
    throw new ApiError('An unexpected error occurred. Please try again.');
  }
}

// Kindy Student API endpoints
export const kindyStudentApi = {
  // Authentication
  login: (key: string) => 
    apiCall('/kindy/student/stamp', {
      method: 'POST',
      body: JSON.stringify({ key }),
    }),

  // Profile endpoints
  getProfile: () => apiCall('/kindy/student/me'),
  getStats: () => apiCall('/kindy/student/me/stat'),
  setFinancialInfo: (ent: string, num: string, name: string) =>
    apiCall('/kindy/student/me/fin', {
      method: 'PATCH',
      body: JSON.stringify({ ent, num, name }),
    }),
  changeLanguage: (lang: 'EN' | 'ID') =>
    apiCall('/kindy/student/me/lang', {
      method: 'PATCH',
      body: JSON.stringify({ lang }),
    }),
  confirmPayment: (formData: FormData) =>
    apiCall('/kindy/student/me/confirm', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type for FormData
    }),

  // Full Day endpoints
  getFullDayDate: () => apiCall('/kindy/student/fd/date'),
  changeFullDay: (is_join: boolean) =>
    apiCall('/kindy/student/fd', {
      method: 'PATCH',
      body: JSON.stringify({ is_join }),
    }),

  // Saving endpoints
  getSavings: () => apiCall('/kindy/student/saving'),
  withdrawSaving: (amount: number) =>
    apiCall('/kindy/student/saving/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  // Invoice endpoints
  getInvoices: () => apiCall('/kindy/student/invoice'),

  // Infaq endpoints
  getInfaq: () => apiCall('/kindy/student/infaq'),

  // Payment endpoints
  getPayments: () => apiCall('/kindy/student/payment'),

  // Insurance endpoints
  getInsurance: () => apiCall('/kindy/insurance'),
};

// Kindy Admin API endpoints
export const kindyAdminApi = {
  // Authentication
  login: (key: string) => 
    apiCall('/kindy/admin/login', {
      method: 'POST',
      body: JSON.stringify({ key }),
    }),

  // Student endpoints
  getAllStudents: () => apiCall('/kindy/admin/student'),

  // Student Saving endpoints
  getAllSavings: () => apiCall('/kindy/admin/student/saving'),

  // Student Infaq endpoints
  getAllInfaq: () => apiCall('/kindy/admin/student/infaq'),

  // Student Outstanding endpoints
  getAllOutstanding: () => apiCall('/kindy/admin/student/outstanding'),

  // Check endpoint access (for authorization)
  checkEndpointAccess: async (endpoint: string): Promise<boolean> => {
    try {
      const url = `${API_BASE}${endpoint}`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // If response is ok (200-299), user has access
      if (response.ok) {
        return true;
      }
      
      // If 401/403, user doesn't have access (silently return false)
      if (response.status === 401 || response.status === 403) {
        return false;
      }
      
      // For other errors, assume no access
      return false;
    } catch (error) {
      // Network errors or other issues - assume no access
      return false;
    }
  },

  // WhatsApp Task endpoints (Stamp)
  getWhatsAppTasks: () => apiCall('/kindy/admin/wa'),

  // Invoice endpoints
  getInvoices: () => apiCall('/kindy/admin/invoice'),
  addInvoice: (data: {
    student_id: string;
    name: string;
    amount: number;
    discount: number;
    start_date: string;
    due_date: string;
  }) =>
    apiCall('/kindy/admin/invoice', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateInvoice: (id: string, data: {
    name: string;
    amount: number;
    discount: number;
    start_date: string;
    end_date: string;
  }) =>
    apiCall(`/kindy/admin/invoice/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteInvoice: (id: string) =>
    apiCall(`/kindy/admin/invoice/${id}`, {
      method: 'DELETE',
    }),

  // Payment endpoints
  getPayments: () => apiCall('/kindy/admin/payment'),
  addPayment: (data: {
    student_id: string;
    amount: number;
    date: string;
    reference: string;
    invoice_id?: string | null;
  }) =>
    apiCall('/kindy/admin/payment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePayment: (id: string, data: {
    amount: number;
    date: string;
    reference: string;
    invoice_id?: string | null;
  }) =>
    apiCall(`/kindy/admin/payment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePayment: (id: string) =>
    apiCall(`/kindy/admin/payment/${id}`, {
      method: 'DELETE',
    }),

  // Get unpaid invoices for a student
  getStudentUnpaidInvoices: (studentId: string) => 
    apiCall(`/kindy/admin/invoice/student/${studentId}`),
};

// Org API endpoints
export const orgApi = {
  getFinancialInfo: () => apiCall('/org/fin'),
  ping: () => apiCall('/ping'),
};

export default kindyStudentApi;
