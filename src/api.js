const DEFAULT_TIMEOUT_MS = 30000;
const API_URL_STORAGE_KEY = 'acms:appsScriptUrl';
const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby4L4c3opMzAPeJMz2Ocqn5Twj4IjpTFT1BUp18EAnr6H9uhHsk5a9f-Q5nNCxQocFt/exec';

function normalizeApiUrl(url) {
  const value = (url || '').trim();
  if (!value) return '';
  // Apps Script's development URL requires editor authentication and cannot be
  // used by the browser application. Keep the configured deployment on /exec.
  return value.replace(/\/(dev|exec)\/?(?:\?.*)?$/, '/exec');
}

export function getApiUrl() {
  return normalizeApiUrl(localStorage.getItem(API_URL_STORAGE_KEY) || import.meta.env.VITE_APPS_SCRIPT_URL || DEFAULT_APPS_SCRIPT_URL);
}

export function setApiUrl(url) {
  localStorage.setItem(API_URL_STORAGE_KEY, normalizeApiUrl(url));
}

export async function callAcms(action, payload = {}) {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return { ok: false, offline: true, message: 'No Apps Script URL configured. Using demo data.' };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload, source: 'web' }),
      signal: controller.signal
    });
    const text = await response.text();
    try {
      const result = JSON.parse(text);
      return { ...result, httpStatus: response.status };
    } catch {
      return {
        ok: false,
        httpStatus: response.status,
        message: response.ok
          ? 'The endpoint did not return JSON. Confirm that the Apps Script Web App is deployed with access set to Anyone.'
          : `Backend returned HTTP ${response.status}. Confirm the /exec deployment URL and Web App access setting.`
      };
    }
  } catch (error) {
    const timedOut = error.name === 'AbortError';
    return {
      ok: false,
      error: error.message,
      message: timedOut
        ? 'The backend did not respond within 30 seconds. Check the Apps Script deployment and spreadsheet permissions.'
        : 'Backend call failed. Check the /exec URL, Web App access setting, and browser network connection. Demo mode is still available.'
    };
  } finally {
    clearTimeout(timer);
  }
}
