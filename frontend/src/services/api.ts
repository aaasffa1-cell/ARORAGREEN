// Base API URL:
// 1. If explicitly set via VITE_API_BASE_URL, use that.
// 2. In production / hosted environments (e.g. Vercel), default to relative '/api'
//    (same-origin unified deployment with zero CORS issues).
// 3. In local development (localhost / 127.0.0.1), use 'http://localhost:4000/api'.
function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Runtime browser domain check: On Vercel or any hosted domain, use relative '/api' on same origin
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocal) {
      return '/api';
    }
  }

  return import.meta.env.PROD ? '/api' : 'http://localhost:4000/api';
}

const API_BASE = getApiBaseUrl().replace(/\/+$/, '');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;

  // Support Authorization Bearer token header in addition to cookies for cross-domain reliability
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('arora_session_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Ensures HTTP-only cookie is passed
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Authentication
  auth: {
    sendOtp: (email: string) => request<{ success: boolean; message: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
    verifyOtp: async (email: string, otp: string) => {
      const res = await request<{ success: boolean; session_token?: string; user: any }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
      if (res.session_token && typeof localStorage !== 'undefined') {
        localStorage.setItem('arora_session_token', res.session_token);
      }
      return res;
    },
    me: () => request<{ authenticated: boolean; user: any }>('/auth/me'),
    updateProfile: (profile: any) => request<{ success: boolean; user: any }>('/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    }),
    logout: async () => {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('arora_session_token');
      }
      return request<{ success: boolean }>('/auth/logout', { method: 'POST' });
    },
  },

  // Tournaments
  tournaments: {
    list: (params?: Record<string, string>) => {
      const search = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ tournaments: any[] }>(`/tournaments${search}`);
    },
    get: (id: string) => request<{ tournament: any; matches: any[]; registered_squads: any[] }>(`/tournaments/${id}`),
    create: (data: any) => request<{ success: boolean; tournament: any }>('/tournaments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request<{ success: boolean; tournament: any }>(`/tournaments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    updateStatus: (id: string, status: string, publication_status?: string) =>
      request<{ success: boolean; tournament: any }>(`/tournaments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, publication_status }),
      }),
  },

  // Squads
  squads: {
    getMySquad: () => request<{ squad: any; members: any[] }>('/squads/my-squad'),
    saveSquad: (data: any) => request<{ success: boolean; squad_id: string }>('/squads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getAllAdmin: () => request<{ squads: any[] }>('/squads/admin/all'),
  },

  // Registrations
  registrations: {
    register: (tournament_id: string, squad_id: string) =>
      request<{ success: boolean; registration: any; requires_payment: boolean; entry_fee: number }>(
        '/registrations',
        {
          method: 'POST',
          body: JSON.stringify({ tournament_id, squad_id }),
        }
      ),
    getMyRegistrations: () => request<{ registrations: any[] }>('/registrations/my'),
    getAdminList: (params?: Record<string, string>) => {
      const search = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ registrations: any[] }>(`/registrations/admin${search}`);
    },
    updateStatus: (id: string, status?: string, slot_number?: number) =>
      request<{ success: boolean; registration: any }>(`/registrations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, slot_number }),
      }),
  },

  // Payments
  payments: {
    submit: (registration_id: string, utr: string, notes?: string) =>
      request<{ success: boolean; payment: any }>('/payments/submit', {
        method: 'POST',
        body: JSON.stringify({ registration_id, utr, notes }),
      }),
    getMyPayments: () => request<{ payments: any[] }>('/payments/my'),
    getAdminAll: (status?: string) => {
      const search = status ? `?status=${status}` : '';
      return request<{ payments: any[] }>(`/payments/admin/all${search}`);
    },
    reviewDecision: (id: string, decision: 'Verified' | 'Rejected', note?: string, rejection_reason?: string) =>
      request<{ success: boolean; message: string }>(`/payments/admin/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, note, rejection_reason }),
      }),
  },

  // Matches & Credentials
  matches: {
    getMyRoom: () => request<{ rooms: any[] }>('/matches/my-room'),
    getAdminAll: () => request<{ matches: any[] }>('/matches/admin/all'),
    configureCredentials: (match_id: string, room_id: string, room_password: string, scheduled_time?: string) =>
      request<{ success: boolean }>('/matches/admin/credentials', {
        method: 'POST',
        body: JSON.stringify({ match_id, room_id, room_password, scheduled_time }),
      }),
    getEligibleCaptains: (matchId: string) =>
      request<{ match: any; has_credentials: boolean; eligible_count: number; captains: any[] }>(
        `/matches/admin/${matchId}/eligible-captains`
      ),
    sendCredentials: (matchId: string) =>
      request<{ success: boolean; message: string; stats: { total: number; successful: number; failed: number } }>(
        `/matches/admin/${matchId}/send-credentials`,
        {
          method: 'POST',
        }
      ),
  },

  // Results
  results: {
    getPublic: () => request<{ results: any[] }>('/results/public'),
    getTournamentResults: (tournamentId: string) => request<{ results: any[] }>(`/results/tournament/${tournamentId}`),
    getMyResults: () => request<{ results: any[] }>('/results/my'),
    saveAdmin: (data: any) => request<{ success: boolean }>('/results/admin/save', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    togglePublish: (tournamentId: string, is_published: boolean) =>
      request<{ success: boolean }>(`/results/admin/${tournamentId}/publish`, {
        method: 'PATCH',
        body: JSON.stringify({ is_published }),
      }),
  },

  // Notifications
  notifications: {
    get: () => request<{ notifications: any[]; unread_count: number }>('/notifications'),
    markRead: (id: string) => request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request<{ success: boolean }>('/notifications/read-all', { method: 'PATCH' }),
    broadcast: (title: string, message: string, type?: string, link?: string) =>
      request<{ success: boolean }>('/notifications/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title, message, type, link }),
      }),
  },

  // Settings
  settings: {
    get: () => request<{ settings: any }>('/settings'),
    update: (data: any) => request<{ success: boolean; settings: any }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },

  // Admin
  admin: {
    getOverview: () => request<{ metrics: any; recent_activity: any[] }>('/admin/overview'),
    getUsers: (search?: string) => {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      return request<{ users: any[] }>(`/admin/users${query}`);
    },
    suspendUser: (id: string, is_suspended: boolean) =>
      request<{ success: boolean }>(`/admin/users/${id}/suspend`, {
        method: 'PATCH',
        body: JSON.stringify({ is_suspended }),
      }),
    getAuditLogs: () => request<{ audit_logs: any[] }>('/admin/audit-logs'),
    getDeliveryLogs: () => request<{ delivery_logs: any[] }>('/admin/delivery-logs'),
  },
};
