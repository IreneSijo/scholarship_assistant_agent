import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { Card, PageHeader, Badge, Button } from "../components/ui.jsx";

export default function ScholarshipsPage() {
  const [all, setAll] = useState([]);
  const [eligibleIds, setEligibleIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [message, setMessage] = useState(null);

  function refresh() {
    setLoading(true);
    Promise.all([api.getScholarships(), api.getEligibleScholarships()])
      .then(([scholarships, eligible]) => {
        setAll(scholarships);
        setEligibleIds(new Set(eligible.map((s) => s.id)));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleApply(scholarshipId) {
    setApplying(scholarshipId);
    setMessage(null);
    try {
      const application = await api.apply(scholarshipId);
      setMessage(
        application.status === "submitted"
          ? `Submitted! The agent filed your application via Playwright.`
          : application.status === "awaiting_documents"
          ? `Paused - missing: ${application.missing_documents}. Upload them and resume from Applications.`
          : `Application status: ${application.status}. ${application.status === "failed" ? "Check that Chromium is installed for Playwright." : ""}`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(null);
    }
  }

  if (loading) return <p className="text-ink-400">Loading scholarships…</p>;
  if (error) return <p className="text-rust">{error}</p>;

  return (
    <>
      <PageHeader
        eyebrow="Scholarship finder"
        title="Matches for your profile"
        description="Scholarships you qualify for are marked eligible. Applying hands the application off to the LangGraph agent, which fills and files it for you."
      />

      {message && <Card className="mb-6 text-sm text-ink-700 bg-seal/5 border-seal/20">{message}</Card>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {all.map((s) => {
          const eligible = eligibleIds.has(s.id);
          return (
            <Card key={s.id} className={eligible ? "border-seal/40" : ""}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-lg text-ink-800">{s.name}</p>
                <Badge tone={eligible ? "success" : "neutral"}>{eligible ? "Eligible" : "Not eligible"}</Badge>
              </div>
              <p className="text-sm text-ink-400 mt-2">{s.description}</p>
              <dl className="grid grid-cols-2 gap-2 mt-4 text-xs">
                <div>
                  <dt className="text-ink-300">Min CGPA</dt>
                  <dd className="font-mono text-ink-600">{s.minimum_cgpa}</dd>
                </div>
                <div>
                  <dt className="text-ink-300">Max income</dt>
                  <dd className="font-mono text-ink-600">₹{s.maximum_income.toLocaleString("en-IN")}</dd>
                </div>
                <div>
                  <dt className="text-ink-300">Deadline</dt>
                  <dd className="font-mono text-ink-600">{s.deadline}</dd>
                </div>
                <div>
                  <dt className="text-ink-300">Documents needed</dt>
                  <dd className="text-ink-600">{s.required_documents.length}</dd>
                </div>
              </dl>
              <div className="mt-4">
                <Button
                  variant={eligible ? "seal" : "ghost"}
                  disabled={!eligible || applying === s.id}
                  onClick={() => handleApply(s.id)}
                >
                  {applying === s.id ? "Agent is working…" : "Apply with AI agent"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
