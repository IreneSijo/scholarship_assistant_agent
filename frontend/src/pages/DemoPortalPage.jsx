import { useState } from "react";

const BASE_URL = "http://localhost:8000";

const FILE_FIELDS = [
  { name: "aadhaar_file", label: "Upload Aadhaar" },
  { name: "income_certificate_file", label: "Upload Income Certificate" },
  { name: "marksheet_file", label: "Upload Marksheet" },
  { name: "bonafide_certificate_file", label: "Upload Bonafide Certificate" },
  { name: "passport_photo_file", label: "Upload Passport Photo" },
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
  const [status, setStatus] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    formData.append("scholarship_id", scholarshipId);
    try {
      const res = await fetch(`${BASE_URL}/demo-portal/submit`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Submission failed");
      setStatus("success");
    } catch (err) {
      setStatus("error");
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

        {status === "success" ? (
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

            {FILE_FIELDS.map((f) => (
              <div key={f.name} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>{f.label}</label>
                <input name={f.name} type="file" style={inputStyle} />
              </div>
            ))}

            <button type="submit" style={submitStyle}>
              Submit Application
            </button>
            {status === "error" && <p style={{ color: "#c5221f", fontSize: 13, marginTop: 10 }}>Submission failed.</p>}
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

const submitStyle = {
  background: "#1a73e8",
  color: "#fff",
  border: "none",
  padding: "10px 20px",
  borderRadius: 4,
  fontSize: 14,
  cursor: "pointer",
};
