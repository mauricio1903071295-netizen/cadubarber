const API_BASE = import.meta.env.VITE_API_URL || '';

async function adminRequest(path, token, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }
  return data;
}

export function getAdminConfig(token) {
  return adminRequest('/api/admin/config', token);
}

export function saveAdminConfig(token, config) {
  return adminRequest('/api/admin/config', token, {
    method: 'PUT',
    body: JSON.stringify(config),
  });
}
