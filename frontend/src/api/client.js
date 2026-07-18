const BASE_URL = "http://localhost:8000";

export function documentFileUrl(filepath) {
  const filename = filepath.split(/[\\/]/).pop();
  return `${BASE_URL}/files/${encodeURIComponent(filename)}`;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: options.body instanceof FormData ? undefined : { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getProfile: () => request("/profile"),
  saveProfile: (profile) => request("/profile", { method: "POST", body: JSON.stringify(profile) }),

  getDocuments: () => request("/documents"),
  uploadDocument: (documentType, file) => {
    const form = new FormData();
    form.append("document_type", documentType);
    form.append("file", file);
    return request("/documents", { method: "POST", body: form });
  },
  deleteDocument: (documentId) => request(`/documents/${documentId}`, { method: "DELETE" }),

  getScholarships: () => request("/scholarships"),
  getEligibleScholarships: () => request("/eligible-scholarships"),

  apply: (scholarshipId) => request("/apply", { method: "POST", body: JSON.stringify({ scholarship_id: scholarshipId }) }),
  getApplications: () => request("/applications"),
  resumeApplication: (applicationId) => request(`/applications/${applicationId}/resume`, { method: "POST" }),

  getDashboard: () => request("/dashboard"),

  chat: (message) => request("/chat", { method: "POST", body: JSON.stringify({ message }) }),
};

export const DOCUMENT_TYPES = [
  { value: "aadhaar", label: "Aadhaar Card" },
  { value: "passport_photo", label: "Passport Photo" },
  { value: "income_certificate", label: "Income Certificate" },
  { value: "marksheet", label: "Marksheet" },
  { value: "bonafide_certificate", label: "Bonafide Certificate" },
  { value: "community_certificate", label: "Community Certificate" },
];
