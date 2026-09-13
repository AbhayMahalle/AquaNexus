/**
 * Centralized API service layer for AquaNexus ERP.
 * 
 * When the real backend is available, calls go to VITE_API_URL.
 * When unavailable, callers handle fallback locally.
 */

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data?: T; error?: string; status: number }> {
  const url = API_BASE ? `${API_BASE}${endpoint}` : endpoint;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return { ok: true, data, status: res.status };
    }

    const errorBody = await res.text().catch(() => '');
    return {
      ok: false,
      error: errorBody || `Request failed with status ${res.status}`,
      status: res.status,
    };
  } catch {
    return {
      ok: false,
      error: 'Backend is not available. Operating in local mode.',
      status: 0,
    };
  }
}

// ─── Toast notification utility ─────────────────────────────────────
// Lightweight in-app notification without external dependencies.
// Renders a fixed-position banner that auto-dismisses.

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export function showToast(message: string, type: ToastType = 'info', durationMs = 3000) {
  const existing = document.getElementById('aqua-toast');
  if (existing) existing.remove();

  const colors: Record<ToastType, string> = {
    success: 'background:#F0FDF4;color:#166534;border-color:#16A34A',
    error: 'background:#FEF2F2;color:#991B1B;border-color:#DC2626',
    info: 'background:#EFF6FF;color:#1E40AF;border-color:#2563EB',
    warning: 'background:#FFFBEB;color:#92400E;border-color:#F59E0B',
  };

  const toast = document.createElement('div');
  toast.id = 'aqua-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position:fixed;top:24px;right:24px;z-index:9999;
    padding:12px 20px;border-radius:12px;border:1px solid;
    font-size:13px;font-weight:600;font-family:Inter,system-ui,sans-serif;
    box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);
    animation:slideInRight 0.3s ease-out;
    ${colors[type]};
  `;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, durationMs);
}

// ─── CSV Export utility ─────────────────────────────────────────────

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: string; header: string }[],
  filename: string
) {
  if (data.length === 0) {
    showToast('No data to export', 'warning');
    return;
  }

  const header = columns.map(c => `"${c.header}"`).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key];
      return `"${String(val ?? '').replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast(`Exported ${data.length} records to CSV`, 'success');
}
