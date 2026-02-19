const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  username: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  mediaUrls?: string[];
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Video {
  id: string;
  userId: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  views: number;
  likes: number;
  duration: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

// Token management
export const tokenManager = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
  },
  setUserInfo: (userId: string, username: string) => {
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
  },
  getUserId: () => localStorage.getItem('userId'),
  getUsername: () => localStorage.getItem('username'),
};

// HTTP Client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = tokenManager.getAccessToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });
      
      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the request with new token
          headers['Authorization'] = `Bearer ${tokenManager.getAccessToken()}`;
          const retryResponse = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers,
          });
          return this.handleResponse<T>(retryResponse);
        } else {
          tokenManager.clearTokens();
          window.location.href = '/auth';
          throw new Error('Session expired. Please login again.');
        }
      }
      
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as any;
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data: AuthResponse = await response.json();
        tokenManager.setTokens(data.accessToken, data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFile(endpoint: string, file: File, additionalData?: Record<string, string>): Promise<any> {
    const token = tokenManager.getAccessToken();
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse(response);
  }
}

// API instance
export const api = new ApiClient(API_BASE_URL);

// Auth API
export const authApi = {
  login: (data: LoginRequest) => 
    api.post<AuthResponse>('/api/auth/login', data),
  
  register: (data: RegisterRequest) => 
    api.post<AuthResponse>('/api/auth/register', data),
  
  logout: () => {
    tokenManager.clearTokens();
    return Promise.resolve();
  },
  
  refreshToken: (refreshToken: string) => 
    api.post<AuthResponse>('/api/auth/refresh', { refreshToken }),
  
  getCurrentUser: () => 
    api.get<UserProfile>('/api/auth/me'),
};

// User API
export const userApi = {
  getProfile: (userId: string) => 
    api.get<UserProfile>(`/api/users/${userId}`),
  
  updateProfile: (userId: string, data: Partial<UserProfile>) => 
    api.put<UserProfile>(`/api/users/${userId}`, data),
  
  uploadAvatar: (userId: string, file: File) => 
    api.uploadFile(`/api/users/${userId}/avatar`, file),
  
  searchUsers: (query: string) => 
    api.get<UserProfile[]>(`/api/users/search?q=${encodeURIComponent(query)}`),
  
  followUser: (userId: string) => 
    api.post(`/api/users/${userId}/follow`),
  
  unfollowUser: (userId: string) => 
    api.delete(`/api/users/${userId}/follow`),
  
  getFollowers: (userId: string) => 
    api.get<UserProfile[]>(`/api/users/${userId}/followers`),
  
  getFollowing: (userId: string) => 
    api.get<UserProfile[]>(`/api/users/${userId}/following`),
};

// Post API
export const postApi = {
  getFeed: (page = 0, size = 20) => 
    api.get<Post[]>(`/api/posts/feed?page=${page}&size=${size}`),
  
  getPost: (postId: string) => 
    api.get<Post>(`/api/posts/${postId}`),
  
  createPost: (content: string, mediaFiles?: File[]) => {
    if (mediaFiles && mediaFiles.length > 0) {
      // Handle file upload separately
      return api.uploadFile('/api/posts', mediaFiles[0], { content });
    }
    return api.post<Post>('/api/posts', { content });
  },
  
  deletePost: (postId: string) => 
    api.delete(`/api/posts/${postId}`),
  
  likePost: (postId: string) => 
    api.post(`/api/posts/${postId}/like`),
  
  unlikePost: (postId: string) => 
    api.delete(`/api/posts/${postId}/like`),
  
  getComments: (postId: string) => 
    api.get<Comment[]>(`/api/posts/${postId}/comments`),
  
  addComment: (postId: string, content: string) => 
    api.post<Comment>(`/api/posts/${postId}/comments`, { content }),
  
  deleteComment: (postId: string, commentId: string) => 
    api.delete(`/api/posts/${postId}/comments/${commentId}`),
};

// Video API
export const videoApi = {
  getVideos: (page = 0, size = 20) => 
    api.get<Video[]>(`/api/videos?page=${page}&size=${size}`),
  
  getVideo: (videoId: string) => 
    api.get<Video>(`/api/videos/${videoId}`),
  
  uploadVideo: (file: File, title: string, description?: string) => 
    api.uploadFile('/api/videos', file, { title, description: description || '' }),
  
  deleteVideo: (videoId: string) => 
    api.delete(`/api/videos/${videoId}`),
  
  likeVideo: (videoId: string) => 
    api.post(`/api/videos/${videoId}/like`),
  
  unlikeVideo: (videoId: string) => 
    api.delete(`/api/videos/${videoId}/like`),
  
  incrementViews: (videoId: string) => 
    api.post(`/api/videos/${videoId}/view`),
};

// Chat API
export const chatApi = {
  getConversations: () => 
    api.get<Conversation[]>('/api/chat/conversations'),
  
  getConversation: (conversationId: string) => 
    api.get<Conversation>(`/api/chat/conversations/${conversationId}`),
  
  getMessages: (conversationId: string, page = 0, size = 50) => 
    api.get<Message[]>(`/api/chat/conversations/${conversationId}/messages?page=${page}&size=${size}`),
  
  sendMessage: (conversationId: string, content: string) => 
    api.post<Message>(`/api/chat/conversations/${conversationId}/messages`, { content }),
  
  createConversation: (participantIds: string[]) => 
    api.post<Conversation>('/api/chat/conversations', { participantIds }),
  
  markAsRead: (conversationId: string, messageId: string) => 
    api.post(`/api/chat/conversations/${conversationId}/messages/${messageId}/read`),
};

// WebSocket for real-time chat
export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(onMessage: (message: Message) => void, onError?: (error: Event) => void) {
    const token = tokenManager.getAccessToken();
    if (!token) {
      console.error('No access token available for WebSocket connection');
      return;
    }

    this.ws = new WebSocket(`${WS_URL}/ws-chat?token=${token}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message: Message = JSON.parse(event.data);
        onMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect(onMessage, onError);
    };
  }

  private attemptReconnect(onMessage: (message: Message) => void, onError?: (error: Event) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        this.connect(onMessage, onError);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Moderation API
export const moderationApi = {
  reportContent: (contentId: string, contentType: 'post' | 'video' | 'comment' | 'user', reason: string) => 
    api.post('/api/moderation/reports', { contentId, contentType, reason }),
  
  getReports: (page = 0, size = 20) => 
    api.get(`/api/moderation/reports?page=${page}&size=${size}`),
  
  resolveReport: (reportId: string, action: 'approve' | 'reject' | 'ban') => 
    api.post(`/api/moderation/reports/${reportId}/resolve`, { action }),
};

export default api;
