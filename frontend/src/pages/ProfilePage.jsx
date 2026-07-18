import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { Card, PageHeader, Button } from "../components/ui.jsx";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  college: "",
  course: "",
  year: 1,
  cgpa: "",
  gender: "Female",
  category: "General",
  annual_income: "",
  state: "",
};

const FIELD_GROUPS = [
  {
    title: "Identity",
    fields: [
      { key: "name", label: "Full name", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "text" },
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: ["Female", "Male", "Other"],
      },
      {
        key: "category",
        label: "Category",
        type: "select",
        options: ["General", "OBC", "SC", "ST", "EWS", "Minority"],
      },
      { key: "state", label: "State", type: "text" },
    ],
  },
  {
    title: "Academics",
    fields: [
      { key: "college", label: "College", type: "text" },
      { key: "course", label: "Course", type: "text" },
      { key: "year", label: "Year of study", type: "number" },
      { key: "cgpa", label: "CGPA (out of 10)", type: "number", step: "0.01" },
    ],
  },
  {
    title: "Financial",
    fields: [{ key: "annual_income", label: "Annual family income (₹)", type: "number" }],
  },
];

export default function ProfilePage() {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getProfile()
      .then((p) => setForm(p))
      .catch(() => {
        /* no profile yet, keep empty form */
      });
  }, []);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload = {
        ...form,
        year: Number(form.year),
        cgpa: Number(form.cgpa),
        annual_income: Number(form.annual_income),
      };
      const result = await api.saveProfile(payload);
      setForm(result);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Applicant profile"
        title="Tell the agent about yourself"
        description="This is the single source of truth the AI agent uses to check eligibility and pre-fill applications."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {FIELD_GROUPS.map((group) => (
          <Card key={group.title}>
            <p className="font-display text-lg text-ink-700 mb-4">{group.title}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {group.fields.map((field) => (
                <label key={field.key} className="block">
                  <span className="text-xs font-medium text-ink-400 uppercase tracking-wide">{field.label}</span>
                  {field.type === "select" ? (
                    <select
                      className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-seal/40"
                      value={form[field.key] ?? ""}
                      onChange={(e) => update(field.key, e.target.value)}
                      required
                    >
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-seal/40"
                      type={field.type}
                      step={field.step}
                      value={form[field.key] ?? ""}
                      onChange={(e) => update(field.key, e.target.value)}
                      required
                    />
                  )}
                </label>
              ))}
            </div>
          </Card>
        ))}

        <div className="flex items-center gap-4">
          <Button type="submit" variant="seal" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
          {saved && <span className="text-sm text-moss font-medium">Profile saved.</span>}
          {error && <span className="text-sm text-rust font-medium">{error}</span>}
        </div>
      </form>
    </>
  );
}
