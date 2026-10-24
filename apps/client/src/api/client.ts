const API_BASE = '/api';

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('vps_token');
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem('vps_token');
    localStorage.removeItem('vps_user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => apiRequest('/auth/me'),
  getUsers: () => apiRequest('/auth/users'),
  createUser: (data: any) => apiRequest('/auth/users', { method: 'POST', body: JSON.stringify(data) }),

  // Stats
  getStats: () => apiRequest('/stats'),

  // Nodes
  getNodes: () => apiRequest('/nodes'),
  getNode: (id: string) => apiRequest(`/nodes/${id}`),
  generateJoinToken: (name?: string) => apiRequest('/nodes/join-token', { method: 'POST', body: JSON.stringify({ name }) }),
  toggleDrainNode: (id: string) => apiRequest(`/nodes/${id}/drain`, { method: 'PATCH' }),
  deleteNode: (id: string) => apiRequest(`/nodes/${id}`, { method: 'DELETE' }),

  // VPS
  getVpsList: () => apiRequest('/vps'),
  getVps: (id: string) => apiRequest(`/vps/${id}`),
  createVps: (data: any) => apiRequest('/vps', { method: 'POST', body: JSON.stringify(data) }),
  actionVps: (id: string, action: string, payload?: any) => apiRequest(`/vps/${id}/action`, { method: 'POST', body: JSON.stringify({ action, payload }) }),
  deleteVps: (id: string) => apiRequest(`/vps/${id}`, { method: 'DELETE' }),

  // IPAM
  getIpam: () => apiRequest('/ipam'),
  createPool: (data: any) => apiRequest('/ipam/pools', { method: 'POST', body: JSON.stringify(data) }),

  // Templates
  getTemplates: () => apiRequest('/templates'),
  createTemplate: (data: any) => apiRequest('/templates', { method: 'POST', body: JSON.stringify(data) }),

  // Logs
  getLogs: () => apiRequest('/logs'),
};
