/**
 * API service for ChurnAI backend
 * Connects frontend to FastAPI server at localhost:8000
 * All authenticated requests include JWT token from localStorage.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getToken() {
    return localStorage.getItem('churnai_token');
}

function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(url, options = {}) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            ...authHeaders(),
            ...options.headers,
        };
        // Remove Content-Type for FormData
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }
        const res = await fetch(`${API_BASE}${url}`, {
            ...options,
            headers,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(err.detail || err.error || `HTTP ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        console.error(`API error [${url}]:`, err);
        throw err;
    }
}

// ── File Operations ─────────────────────────────────────────

export async function uploadFile(file, category) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `Upload failed: HTTP ${res.status}`);
    }
    return res.json();
}

export async function listFiles(category) {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/files${params}`);
}

export async function getFileInfo(processCode) {
    return request(`/files/${processCode}`);
}

export async function deleteFile(processCode) {
    return request(`/files/${processCode}`, { method: 'DELETE' });
}

// ── Validation ──────────────────────────────────────────────

export async function validateFile(processCode) {
    return request(`/validate/${processCode}`, { method: 'POST' });
}

// ── Process (Upload → Validate → Train → Predict) ──────────

export async function processFile(processCode, threshold = 0.5) {
    return request(`/process/${processCode}?threshold=${threshold}`, { method: 'POST' });
}

// ── Results ─────────────────────────────────────────────────

export async function listResults(category) {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/results${params}`);
}

export async function getResults(processCode, { page = 1, pageSize = 50, riskLevel, search, minProbability, maxProbability, prediction } = {}) {
    let params = `?page=${page}&page_size=${pageSize}`;
    if (riskLevel) params += `&risk_level=${riskLevel}`;
    if (search) params += `&search=${encodeURIComponent(search)}`;
    if (minProbability != null) params += `&min_probability=${minProbability}`;
    if (maxProbability != null) params += `&max_probability=${maxProbability}`;
    if (prediction) params += `&prediction=${prediction}`;
    return request(`/results/${processCode}${params}`);
}

// ── Export ───────────────────────────────────────────────────

export async function exportResults(processCode, format = 'csv', columns = [], filename = '') {
    let params = `?format=${format}`;
    if (columns.length > 0) params += `&columns=${columns.join(',')}`;
    if (filename) params += `&filename=${encodeURIComponent(filename)}`;

    const res = await fetch(`${API_BASE}/export/${processCode}${params}`, {
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`Export failed: HTTP ${res.status}`);
    return res.blob();
}

// ── Recommendations ─────────────────────────────────────────

export async function getRecommendations(processCode) {
    return request(`/recommendations/${processCode}`);
}

// ── Categories ──────────────────────────────────────────────

export async function registerCategory(data) {
    return request('/categories', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function listCategories() {
    return request('/categories');
}

export async function listAllCategories() {
    const res = await fetch(`${API_BASE}/categories/all`);
    if (!res.ok) throw new Error('Failed to load categories');
    return res.json();
}

// ── Dashboard ───────────────────────────────────────────────

export async function getDashboardStats(category) {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/dashboard/stats${params}`);
}

export async function validateSchema(file, category) {
    const formData = new FormData();
    formData.append('file', file);
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    const res = await fetch(`${API_BASE}/validate-schema${params}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Validation failed' }));
        throw new Error(err.detail || 'Validation failed');
    }
    return res.json();
}

// ── User ────────────────────────────────────────────────────

export async function setActiveCategory(category) {
    return request(`/auth/category?category=${encodeURIComponent(category)}`, { method: 'PUT' });
}

// ── Health Check ────────────────────────────────────────────

export async function healthCheck() {
    try {
        const res = await request('/health');
        return res.status === 'ok';
    } catch {
        return false;
    }
}
