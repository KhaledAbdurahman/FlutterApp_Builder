// Authentication service for Django backend
const API_BASE_URL = "http://localhost:8000/api";

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthError {
  message: string;
  details?: Record<string, string[]>;
}

// Store token in localStorage
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function storeAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

// API helper with auth headers
async function authApiCall<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getStoredToken();

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData.detail ||
      errorData.message ||
      errorData.non_field_errors?.[0] ||
      "An error occurred";
    const error: AuthError = { message, details: errorData };
    throw error;
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

// Login
export async function login(
  username: string,
  password: string,
): Promise<AuthResponse> {
  const response = await authApiCall<AuthResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  storeAuth(response.token, response.user);
  return response;
}

// Register
export async function register(
  username: string,
  email: string,
  password: string,
  password2: string,
): Promise<AuthResponse> {
  const response = await authApiCall<AuthResponse>("/auth/register/", {
    method: "POST",
    body: JSON.stringify({ username, email, password, password2 }),
  });
  storeAuth(response.token, response.user);
  return response;
}

// Logout
export async function logout(): Promise<void> {
  try {
    await authApiCall("/auth/logout/", { method: "POST" });
  } finally {
    clearAuth();
  }
}

// Get current user
export async function getCurrentUser(): Promise<User> {
  return authApiCall<User>("/auth/user/");
}

// Update the main API service to include auth headers
export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Token ${token}` } : {};
}
