/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Thin client for the Deeper backend's journey-progress endpoints. The Vite dev server
// proxies /api to the backend (see vite.config.ts); production serves both behind the
// same host, so a relative path works there too — mirrors work/jobs/frontend/src/api.

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || "Request failed");
  }
  return res.json();
}

export interface JourneyProgressResponse {
  completedStageIds: string[];
}

export const api = {
  getJourneyProgress: () => request<JourneyProgressResponse>("/journey/progress"),
  completeJourneyStage: (stageId: string) =>
    request<JourneyProgressResponse>("/journey/progress", {
      method: "POST",
      body: JSON.stringify({ stageId }),
    }),
  explainMemory: (code: string, stateInfo?: unknown) =>
    request<{ explanation: string }>("/gemini/explain-memory", {
      method: "POST",
      body: JSON.stringify({ code, stateInfo }),
    }),
  generateLesson: (topic: string, gradeLevel?: string) =>
    request<{ lessonPlan: string }>("/gemini/generate-lesson", {
      method: "POST",
      body: JSON.stringify({ topic, gradeLevel }),
    }),
};
