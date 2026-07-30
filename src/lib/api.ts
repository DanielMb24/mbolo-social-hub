import {
  getErrorMessage,
  getHttpStatus,
  httpErrorTitle,
  notifyAppError,
  shouldNotifyHttpError,
} from "./error-notifier";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:8080');
const WS_URL = import.meta.env.VITE_WS_URL ?? (import.meta.env.PROD ? '' : 'ws://localhost:8080');

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

const unwrapApiData = <T>(response: unknown, fallback: T): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as ApiResponse<T>).data;
    return data ?? fallback;
  }

  return (response ?? fallback) as T;
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.readAsDataURL(file);
  });

export interface AuthResponse {
  success?: boolean;
  accessToken: string;
  refreshToken?: string;
  userId: string;
  message?: string;
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
  fullname?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  followersCount?: number;
  followingCount?: number;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  mediaUrls?: string[];
  likes: string[];
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
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
  type?: "PRIVATE" | "GROUP";
  groupName?: string;
  lastMessage?: Message | string;
  lastMessageTime?: string;
  unreadCount?: number;
  updatedAt: string;
}

export interface SearchResponse {
  users: UserProfile[];
  posts: Post[];
  conversations: Conversation[];
}

// Token management
export const tokenManager = {
  getAccessToken: () => localStorage.getItem('token') || localStorage.getItem('accessToken'),
  setTokens: (accessToken: string) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('accessToken', accessToken);
  },
  clearTokens: () => {
    localStorage.removeItem('token');
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
        credentials: 'include',
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
            credentials: 'include',
          });
          return this.handleResponse<T>(retryResponse);
        } else {
          tokenManager.clearTokens();
          notifyAppError({
            title: "Session expirée",
            message: "Reconnectez-vous pour continuer.",
            severity: "warning",
            status: 401,
            source: endpoint,
          });
          window.location.href = '/';
          throw new Error('Session expirée. Reconnectez-vous.');
        }
      }
      
      return this.handleResponse<T>(response);
    } catch (error) {
      const status = getHttpStatus(error);
      if (shouldNotifyHttpError(status)) {
        notifyAppError({
          title: httpErrorTitle(status),
          message: status ? getErrorMessage(error) : "Impossible de joindre le serveur.",
          severity: status === 401 ? "warning" : "error",
          status,
          source: endpoint,
        });
      }

      if (import.meta.env.DEV && status !== 404) {
        console.error('API Request Error:', { endpoint, status, error });
      }
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    let responseData: any;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    if (!response.ok) {
      const errorMessage = responseData?.message || 
                          responseData?.error || 
                          (typeof responseData === 'string' ? responseData : '') ||
                          `Erreur ${response.status}: ${response.statusText}`;
      const error = new Error(errorMessage);
      (error as any).response = { data: responseData, status: response.status };
      throw error;
    }
    
    return responseData;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        const apiResponse: ApiResponse<AuthResponse> = await response.json();
        if (apiResponse.data) {
          tokenManager.setTokens(apiResponse.data.accessToken);
          return true;
        }
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
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          ...additionalData,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: await fileToDataUrl(file),
        }),
      });

      return this.handleResponse(response);
    } catch (error) {
      const status = getHttpStatus(error);
      if (shouldNotifyHttpError(status)) {
        notifyAppError({
          title: httpErrorTitle(status),
          message: status ? getErrorMessage(error) : "Upload interrompu. Vérifiez votre connexion.",
          severity: status === 413 ? "warning" : "error",
          status,
          source: endpoint,
        });
      }
      throw error;
    }
  }
}

// API instance
export const api = new ApiClient(API_BASE_URL);

// Auth API
export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/login', data);
    return response.data!;
  },
  
  register: async (data: RegisterRequest) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/register', data);
    return response.data!;
  },
  
  logout: () => {
    tokenManager.clearTokens();
    return api.post('/api/auth/logout').catch(() => undefined);
  },
  
  refreshToken: async () => {
    const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/refresh');
    return response.data!;
  },
  
  getCurrentUser: async () => {
    const response = await api.get<ApiResponse<UserProfile> | UserProfile>('/api/auth/me');
    return unwrapApiData<UserProfile>(response, null as unknown as UserProfile);
  },
};

// User API
export const userApi = {
  getProfile: async (userId: string) => {
    const response = await api.get<ApiResponse<UserProfile>>(`/api/users/${userId}`);
    return response.data!;
  },
  
  updateProfile: async (userId: string, data: Partial<UserProfile>) => {
    const response = await api.put<ApiResponse<UserProfile>>(`/api/users/${userId}`, data);
    return response.data!;
  },
  
  uploadAvatar: (userId: string, file: File) => 
    api.uploadFile(`/api/users/${userId}/avatar`, file),
  
  uploadCover: (userId: string, file: File) => 
    api.uploadFile(`/api/users/${userId}/cover`, file),
  
  searchUsers: async (query: string) => {
    const response = await api.get<ApiResponse<UserProfile[]> | UserProfile[]>(`/api/users/search?q=${encodeURIComponent(query)}`);
    return unwrapApiData<UserProfile[]>(response, []);
  },
  
  followUser: (userId: string) => 
    api.post(`/api/users/${userId}/follow`),
  
  unfollowUser: (userId: string) => 
    api.delete(`/api/users/${userId}/follow`),
  
  getFollowers: async (userId: string) => {
    const response = await api.get<ApiResponse<UserProfile[]> | UserProfile[]>(`/api/users/${userId}/followers`);
    return unwrapApiData<UserProfile[]>(response, []);
  },
  
  getFollowing: async (userId: string) => {
    const response = await api.get<ApiResponse<UserProfile[]> | UserProfile[]>(`/api/users/${userId}/following`);
    return unwrapApiData<UserProfile[]>(response, []);
  },

  isFollowing: async (userId: string) => {
    const response = await api.get<ApiResponse<boolean> | boolean>(`/api/users/${userId}/is-following`);
    return unwrapApiData<boolean>(response, false);
  },
};

// Post API
export const postApi = {
  getFeed: async (page = 0, size = 20) => {
    try {
      const res = await api.get<any>(`/api/posts?page=${page}&size=${size}`);
      const data = unwrapApiData<any>(res, {});
      return data?.data?.content || data?.content || (Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('getFeed error:', error);
      return []; // Retourner un tableau vide en cas d'erreur
    }
  },
  
  getPost: async (postId: string) => {
    const response = await api.get<ApiResponse<Post>>(`/api/posts/${postId}`);
    return response.data!;
  },
  
  createPost: async (data: { content: string }, mediaFiles?: File[]) => {
    if (mediaFiles && mediaFiles.length > 0) {
      // Handle file upload separately
      const response = await api.uploadFile('/api/posts', mediaFiles[0], { content: data.content });
      return unwrapApiData<Post>(response, response);
    }
    const response = await api.post<ApiResponse<Post> | Post>('/api/posts', data);
    return unwrapApiData<Post>(response, response as Post);
  },
  
  deletePost: (postId: string) => 
    api.delete(`/api/posts/${postId}`),
  
  likePost: (postId: string) => 
    api.post(`/api/posts/${postId}/like`),
  
  unlikePost: (postId: string) => 
    api.post(`/api/posts/${postId}/like`), // Toggle like/unlike
  
  getComments: async (postId: string) => {
    const response = await api.get<ApiResponse<any>>(`/api/posts/${postId}/comments`);
    // Le backend retourne un objet paginé avec content
    const data = response.data;
    if (data && typeof data === 'object' && 'content' in data) {
      return data.content || [];
    }
    return Array.isArray(data) ? data : [];
  },
  
  addComment: async (postId: string, content: string) => {
    const response = await api.post<ApiResponse<Comment>>(`/api/posts/${postId}/comments`, { content });
    return response.data!;
  },
  
  deleteComment: (postId: string, commentId: string) => 
    api.delete(`/api/posts/${postId}/comments/${commentId}`),
};

export interface StoryRecord {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  avatarInitials: string;
  mediaUrl?: string;
  mediaType: "image" | "video" | "text";
  content?: string;
  backgroundColor?: string;
  createdAt: string;
  expiresAt: string;
  seen: boolean;
  duration?: number;
  views?: number;
}

export const storyApi = {
  getStories: async () => {
    const response = await api.get<ApiResponse<StoryRecord[]> | StoryRecord[]>('/api/stories');
    return unwrapApiData<StoryRecord[]>(response, []);
  },
  getMyStories: async () => {
    const response = await api.get<ApiResponse<StoryRecord[]> | StoryRecord[]>('/api/stories/me');
    return unwrapApiData<StoryRecord[]>(response, []);
  },
  createStory: async (story: Partial<StoryRecord>, file?: File) => {
    const response = file
      ? await api.uploadFile('/api/stories', file, {
          mediaType: story.mediaType || 'image',
          content: story.content || '',
          backgroundColor: story.backgroundColor || '',
          username: story.username || '',
          avatarInitials: story.avatarInitials || '',
        })
      : await api.post<ApiResponse<StoryRecord> | StoryRecord>('/api/stories', story);
    return unwrapApiData<StoryRecord>(response, response as StoryRecord);
  },
  deleteStory: (storyId: string) => api.delete(`/api/stories/${storyId}`),
  markSeen: (storyId: string) => api.post(`/api/stories/${storyId}/seen`),
};

export interface AppNotificationRecord {
  id: string;
  type: "message" | "like" | "comment" | "story" | "follow";
  title: string;
  body: string;
  avatar?: string;
  avatarInitials: string;
  read: boolean;
  createdAt: string;
}

export const notificationApi = {
  getNotifications: async () => {
    const response = await api.get<ApiResponse<AppNotificationRecord[]> | AppNotificationRecord[]>('/api/notifications');
    return unwrapApiData<AppNotificationRecord[]>(response, []);
  },
  getUnreadCount: async () => {
    const response = await api.get<ApiResponse<{ count: number }> | { count: number }>('/api/notifications/unread-count');
    return unwrapApiData<{ count: number }>(response, { count: 0 }).count;
  },
  markRead: (id: string) => api.post(`/api/notifications/${id}/read`),
  markAllRead: () => api.post('/api/notifications/read-all'),
  dismiss: (id: string) => api.delete(`/api/notifications/${id}`),
};

export const searchApi = {
  global: async (query: string) => {
    const response = await api.get<ApiResponse<SearchResponse> | SearchResponse>(`/api/search?q=${encodeURIComponent(query)}`);
    return unwrapApiData<SearchResponse>(response, { users: [], posts: [], conversations: [] });
  },
};

// Video API
export const videoApi = {
  getVideos: async (page = 0, size = 20) => {
    const response = await api.get<ApiResponse<Video[]> | Video[]>(`/api/videos?page=${page}&size=${size}`);
    return unwrapApiData<Video[]>(response, []);
  },
  
  getVideo: (videoId: string) => 
    api.get<Video>(`/api/videos/${videoId}`),
  
  uploadVideo: async (file: File, title: string, description?: string) => {
    const response = await api.uploadFile('/api/videos', file, { title, description: description || '' });
    return unwrapApiData<Video>(response, response);
  },
  
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
