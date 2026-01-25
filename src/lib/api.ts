// API service for Django backend
import { getStoredToken } from "./auth";

const API_BASE_URL = "http://localhost:8000/api";

export interface ProjectJsonData {
  app_name: string;
  package_name: string;
  screens: unknown[];
}

export interface SavedProject {
  id: number;
  name: string;
  description: string;
  json_data: ProjectJsonData;
  created_at: string;
  updated_at: string;
}

export interface GenerationLog {
  id: number;
  project_id: number;
  timestamp: string;
  level: string;
  message: string;
}

export interface ApiError {
  message: string;
  details?: unknown;
}

export interface GenerateSavedProjectResponse {
  status: "success" | "error";
  message: string;
  download_url?: string;
}

export interface ApkBuildResponse {
  status: "success" | "error" | "building";
  message: string;
  build_id?: string;
  download_url?: string;
}

// Helper function for API calls with authentication
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  expectBlob: boolean = false,
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
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Server error (${response.status}): ${errorText || "Unknown error"}`,
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const contentDisposition = response.headers.get("content-disposition") || "";

  // Always read once as ArrayBuffer so we can safely detect ZIP vs JSON
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const isZip = bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b; // PK

  const shouldTreatAsBlob =
    expectBlob ||
    contentType.includes("application/zip") ||
    contentType.includes("application/octet-stream") ||
    contentType.includes("application/x-zip") ||
    contentDisposition.toLowerCase().includes("attachment");

  if (shouldTreatAsBlob) {
    if (arrayBuffer.byteLength === 0) {
      throw new Error("Expected a file download but the response was empty.");
    }

    if (isZip) {
      return new Blob([arrayBuffer], {
        type: "application/zip",
      }) as unknown as T;
    }

    // Not a ZIP - most likely the backend returned JSON/text (e.g. generation error)
    const text = new TextDecoder().decode(arrayBuffer);
    let message = text;
    try {
      const json = JSON.parse(text) as any;
      message =
        json?.message || json?.error || json?.detail || JSON.stringify(json);
    } catch {
      // keep raw text
    }

    throw new Error(
      `Expected a ZIP file but received ${contentType || "unknown content-type"}: ${String(message).slice(0, 300)}`,
    );
  }

  // Non-blob response path
  if (isZip) {
    return new Blob([arrayBuffer], { type: "application/zip" }) as unknown as T;
  }

  if (arrayBuffer.byteLength === 0) return {} as T;

  const text = new TextDecoder().decode(arrayBuffer);
  return JSON.parse(text) as T;
}

// Quick generate - no database storage (returns ZIP)
export async function quickGenerate(payload: {
  app_name: string;
  package_name: string;
  json_data: { screens: unknown[] };
}): Promise<Blob> {
  return apiCall<Blob>(
    "/generate/quick_generate/",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true, // expectBlob
  );
}

// List all saved projects
export async function listProjects(): Promise<SavedProject[]> {
  return apiCall<SavedProject[]>("/projects/");
}

// Get a single project
export async function getProject(projectId: number): Promise<SavedProject> {
  return apiCall<SavedProject>(`/projects/${projectId}/`);
}

// Create/save a new project
export async function createProject(data: {
  name: string;
  description?: string;
  json_data: ProjectJsonData;
}): Promise<SavedProject> {
  return apiCall<SavedProject>("/projects/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update an existing project
export async function updateProject(
  projectId: number,
  data: {
    name?: string;
    description?: string;
    json_data?: ProjectJsonData;
  },
): Promise<SavedProject> {
  return apiCall<SavedProject>(`/projects/${projectId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Delete a project
export async function deleteProject(projectId: number): Promise<void> {
  return apiCall<void>(`/projects/${projectId}/`, {
    method: "DELETE",
  });
}

// Generate Flutter project from saved project (returns JSON with download_url)
export async function generateFromSaved(
  projectId: number,
): Promise<GenerateSavedProjectResponse> {
  return apiCall<GenerateSavedProjectResponse>(
    `/projects/${projectId}/generate/`,
    { method: "POST" },
  );
}

// Download generated project (returns ZIP)
export async function downloadProject(projectId: number): Promise<Blob> {
  return apiCall<Blob>(`/projects/${projectId}/download/`, {}, true);
}

// View generation logs
export async function getProjectLogs(
  projectId: number,
): Promise<GenerationLog[]> {
  return apiCall<GenerationLog[]>(`/projects/${projectId}/logs/`);
}

// Build APK from saved project
export async function buildApkFromSaved(
  projectId: number,
): Promise<ApkBuildResponse> {
  return apiCall<ApkBuildResponse>(`/projects/${projectId}/build_apk/`, {
    method: "POST",
  });
}

// Quick build APK (no database storage)
export async function quickBuildApk(payload: {
  app_name: string;
  package_name: string;
  json_data: { screens: unknown[] };
}): Promise<Blob> {
  return apiCall<Blob>(
    "/generate/build_apk/",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true, // expectBlob
  );
}

// Download APK file
export async function downloadApk(projectId: number): Promise<Blob> {
  return apiCall<Blob>(`/projects/${projectId}/download_apk/`, {}, true);
}

// Helper to download blob as file
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
