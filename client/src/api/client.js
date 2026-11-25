const rawBase = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL = rawBase ? rawBase.replace(/\/+$/, '') : '/api';

export class ApiError extends Error {
  constructor(message, { status = 500, code = 'API_ERROR', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch {
    throw new ApiError(
      'Unable to reach the clinic server. Please check that the backend is running.',
      { status: 0, code: 'NETWORK_ERROR' }
    );
  }

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  }

  if (!response.ok) {
    const errObj = payload?.error || {};
    throw new ApiError(
      errObj.message || `Request failed with status ${response.status}`,
      {
        status: response.status,
        code: errObj.code || 'REQUEST_FAILED',
        details: errObj.details || null,
      }
    );
  }

  return payload;
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const healthApi = {
  check: () => request('/health'),
};

export const doctorsApi = {
  list: (filters) => request(`/doctors${buildQuery(filters)}`),
  getById: (id) => request(`/doctors/${id}`),
  create: (data) =>
    request('/doctors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  patch: (id, data) =>
    request(`/doctors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  remove: (id) =>
    request(`/doctors/${id}`, {
      method: 'DELETE',
    }),
};

export const appointmentsApi = {
  list: (filters) => request(`/appointments${buildQuery(filters)}`),
  getById: (id) => request(`/appointments/${id}`),
  create: (data) =>
    request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  patch: (id, data) =>
    request(`/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  remove: (id) =>
    request(`/appointments/${id}`, {
      method: 'DELETE',
    }),
};
