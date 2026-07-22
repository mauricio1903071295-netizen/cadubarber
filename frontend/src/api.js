const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }
  return data;
}

export function getServices() {
  return request('/api/services');
}

export function getAvailability(serviceId) {
  return request(`/api/availability?serviceId=${encodeURIComponent(serviceId)}`);
}

export function createAppointment(payload) {
  return request('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
