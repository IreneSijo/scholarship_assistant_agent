import { useRef, useState } from "react";

const BASE_URL = "http://localhost:8000";

const FILE_FIELDS = [
  { name: "aadhaar_file", label: "Upload Aadhaar" },
  { name: "income_certificate_file", label: "Upload Income Certificate" },
  { name: "marksheet_file", label: "Upload Marksheet" },
  { name: "bonafide_certificate_file", label: "Upload Bonafide Certificate" },
  { name: "passport_photo_file", label: "Upload Passport Photo" },
  { name: "community_certificate_file", label: "Upload Community Certificate" },
];

/**
 * This page stands in for a REAL, independent scholarship website. It is
 * intentionally plain HTML-form styling (not the dashboard's design system)
 * and every field uses a stable `name` attribute, because Playwright's
 * selectors in backend/browser_automation/automation.py target them directly -
 * exactly like automating a real third-party site.
 */
export default function DemoPortalPage() {
  const params = new URLSearchParams(window.location.search);
  const scholarshipId = params.get("scholarship_id") || "";
  const requiredDocuments = (params.get("required_documents") || "").split(",").filter(Boolean);
  const documentLinks = JSON.parse(params.get("document_links") || "{}");
  const [status, setStatus] = useState(null);
  const [attachedDocuments, setAttachedDocuments] = useState({});
  const fileInputRefs = useRef({});

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) {
      setStatus({ type: "error", message: "Please complete every required field and attach each required document before submitting." });
      form.reportValidity();
      return;
    }
    const formData = new FormData(form);
    formData.append("scholarship_id", scholarshipId);
    try {
      const res = await fetch(`${BASE_URL}/demo-portal/submit`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Submission failed");
      setStatus({ type: "success" });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: "#f2f2f2", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", background: "#fff", border: "1px solid #ccc", borderRadius: 4, padding: 32 }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>National Scholarship Application Portal</h1>
        <p style={{ color: "#666", fontSize: 13, marginBottom: 24 }}>
          Demo site {scholarshipId ? `· Scholarship ID: ${scholarshipId}` : ""} — this is the mock external
          website the AI agent fills out via Playwright.
        </p>

        {status?.type === "success" ? (
          <div style={{ background: "#e6f4ea", border: "1px solid #34a853", padding: 16, borderRadius: 4 }}>
            Application received. Thank you for applying.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {[
              ["name", "Full Name", "text"],
              ["email", "Email", "email"],
              ["phone", "Phone", "text"],
              ["college", "College", "text"],
              ["course", "Course", "text"],
              ["cgpa", "CGPA", "number"],
              ["income", "Annual Income", "number"],
              ["state", "State", "text"],
            ].map(([name, label, type]) => (
              <div key={name} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>{label}</label>
                <input name={name} type={type} step="any" required style={inputStyle} />
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Gender</label>
              <select name="gender" required style={inputStyle}>
                <option value="">Select…</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid #eee" }} />

            {FILE_FIELDS.filter((f) => requiredDocuments.includes(f.name.replace("_file", ""))).map((f) => (
              <div key={f.name} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>{f.label}</label>
                <input
                  ref={(element) => {
                    fileInputRefs.current[f.name] = element;
                  }}
                  name={f.name}
                  type="file"
                  required={requiredDocuments.includes(f.name.replace("_file", ""))}
                  style={{ display: "none" }}
                  onChange={(event) => {
                    const documentType = f.name.replace("_file", "");
                    const selectedFile = event.target.files?.[0];
                    const vaultFile = documentLinks[documentType];
                    const isVaultFile = selectedFile && vaultFile && (
                      selectedFile.name === vaultFile.stored_filename || selectedFile.name === vaultFile.filename
                    );
                    setAttachedDocuments((current) => ({
                      ...current,
                      [documentType]: selectedFile
                        ? {
                            filename: isVaultFile ? vaultFile.filename : selectedFile.name,
                            url: isVaultFile ? vaultFile.url : URL.createObjectURL(selectedFile),
                          }
                        : null,
                    }));
                  }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  {attachedDocuments[f.name.replace("_file", "")]?.url ? (
                    <a
                      href={attachedDocuments[f.name.replace("_file", "")].url}
                      target="_blank"
                      rel="noreferrer"
                      style={attachedFileStyle}
                    >
                      {attachedDocuments[f.name.replace("_file", "")].filename}
                    </a>
                  ) : (
                    <span style={emptyFileStyle}>No file chosen</span>
                  )}
                  <button type="button" style={chooseFileStyle} onClick={() => fileInputRefs.current[f.name]?.click()}>
                    Choose file
                  </button>
                </div>
              </div>
            ))}

            <p style={{ color: "#444", fontSize: 13, margin: "20px 0 12px" }}>
              Your application has been filled by the AI agent. Review the details, then submit when ready.
            </p>
            <button type="submit" style={submitStyle}>
              Review &amp; Submit
            </button>
            {status?.type === "error" && <p style={{ color: "#c5221f", fontSize: 13, marginTop: 10 }}>{status.message}</p>}
          </form>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 14,
  boxSizing: "border-box",
};

const attachedFileStyle = {
  ...inputStyle,
  flex: 1,
  color: "#1a73e8",
  textDecoration: "underline",
  cursor: "pointer",
};

const emptyFileStyle = {
  ...inputStyle,
  flex: 1,
  color: "#666",
};

const chooseFileStyle = {
  background: "#fff",
  border: "1px solid #999",
  borderRadius: 4,
  padding: "8px 10px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const submitStyle = {
  background: "#1a73e8",
  color: "#fff",
  border: "none",
  padding: "10px 20px",
  borderRadius: 4,
  fontSize: 14,
  cursor: "pointer",
};
