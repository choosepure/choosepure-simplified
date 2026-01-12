import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8001/api/v2',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 403 && error.response?.data?.error === 'view_limit_reached') {
      // Handle view limit reached
      return Promise.reject({
        type: 'VIEW_LIMIT_REACHED',
        data: error.response.data
      });
    }
    
    return Promise.reject(error);
  }
);

// API methods organized by feature
export const sampleAPI = {
  // Get featured reports for homepage
  getFeaturedReports: () => api.get('/samples/featured'),
  
  // Get all sample reports
  getSampleReports: (params = {}) => api.get('/samples/reports', { params }),
  
  // Get single report detail
  getReportDetail: (reportId) => api.get(`/samples/reports/${reportId}`),
  
  // Get report categories
  getCategories: () => api.get('/samples/categories'),
  
  // Get sample statistics
  getStats: () => api.get('/samples/stats'),
};

export const votingAPI = {
  // Get voting options
  getVotingOptions: (status = 'voting') => api.get('/voting/options', { params: { status } }),
  
  // Cast a vote (email-only registration)
  castVote: (voteData) => api.post('/voting/cast-vote', voteData),
  
  // Quick signup for voting
  quickSignup: (signupData) => api.post('/voting/quick-signup', signupData),
  
  // Get user's voting history
  getUserVotes: (email) => api.get(`/voting/user-votes/${email}`),
  
  // Get voting statistics
  getVotingStats: () => api.get('/voting/stats'),
};

export const userAPI = {
  // Get user dashboard
  getDashboard: (email) => api.get(`/users/dashboard/${email}`),
  
  // Complete user profile
  completeProfile: (email, profileData) => api.post(`/users/complete-profile/${email}`, profileData),
  
  // Track report view (for freemium limits)
  trackReportView: (email, reportData) => api.post(`/users/track-report-view/${email}`, reportData),
  
  // Get user profile
  getProfile: (email) => api.get(`/users/profile/${email}`),
  
  // Get community statistics
  getCommunityStats: () => api.get('/users/community-stats'),
};

export const subscriptionAPI = {
  // Get subscription tiers
  getTiers: () => api.get('/subscriptions/tiers'),
  
  // Start premium trial
  startTrial: (trialData) => api.post('/subscriptions/start-trial', trialData),
  
  // Get subscription status
  getStatus: (email) => api.get(`/subscriptions/status/${email}`),
  
  // Create payment order
  createPaymentOrder: (orderData) => api.post('/subscriptions/create-payment-order', orderData),
  
  // Verify payment
  verifyPayment: (paymentData) => api.post('/subscriptions/verify-payment', paymentData),
  
  // Get upgrade prompts
  getUpgradePrompts: (email) => api.get(`/subscriptions/upgrade-prompts/${email}`),
};

export const onboardingAPI = {
  // Track user actions for funnel analysis
  trackAction: (actionData) => api.post('/onboarding/track-action', actionData),
  
  // Get funnel statistics (admin)
  getFunnelStats: () => api.get('/onboarding/funnel-stats'),
  
  // Get user journey
  getUserJourney: (email) => api.get(`/onboarding/user-journey/${email}`),
  
  // Complete onboarding
  completeOnboarding: (completionData) => api.post('/onboarding/complete-onboarding', completionData),
};

// Utility functions
export const trackUserAction = async (email, action, details = {}) => {
  try {
    if (!email) return;
    
    await onboardingAPI.trackAction({
      email,
      action,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        page: window.location.pathname
      }
    });
  } catch (error) {
    console.error('Failed to track user action:', error);
  }
};

export const handleViewLimitError = (error) => {
  if (error.type === 'VIEW_LIMIT_REACHED') {
    return {
      showUpgradeModal: true,
      limitType: 'report_views',
      message: error.data.detail.message,
      upgradeRequired: true
    };
  }
  return null;
};

export default api;