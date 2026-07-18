import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { Card, PageHeader, Badge, Button, EmptyState } from "../components/ui.jsx";

const STATUS_TONE = {
  pending: "neutral",
  awaiting_documents: "warning",
  submitted: "success",
  failed: "danger",
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState(null);
  const [resuming, setResuming] = useState(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);

  function refresh() {
    api
      .getApplications()
      .then(setApplications)
      .catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  async function handleResume(id) {
    setResuming(id);
    setError(null);
    try {
      await api.resumeApplication(id);
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setResuming(null);
    }
  }

  if (error) return <p className="text-rust">{error}</p>;

  return (
    <>
      <PageHeader
        eyebrow="Applications"
        title="Track what the agent has filed"
        description="Applications paused by the agent are waiting on you to upload a missing document. Resuming continues the same LangGraph workflow - it doesn't restart from scratch."
      />

      {applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="Head to Find Scholarships and apply to an eligible scholarship to see the agent in action."
        />
      ) : (
        <div className="space-y-4">
          {applications.map((a) => (
            <Card key={a.id}>
              <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setSelectedApplicationId((current) => (current === a.id ? null : a.id))}
                className="text-left flex-1"
              >
                <p className="font-display text-lg text-ink-800">{a.scholarship_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge tone={STATUS_TONE[a.status] || "neutral"}>{a.status.replace("_", " ")}</Badge>
                  {a.missing_documents && (
                    <span className="text-xs text-ink-400">Missing: {a.missing_documents}</span>
                  )}
                </div>
              </button>
              {a.status === "awaiting_documents" && (
                <Button variant="seal" disabled={resuming === a.id} onClick={() => handleResume(a.id)}>
                  {resuming === a.id ? "Resuming…" : "Resume workflow"}
                </Button>
              )}
              </div>
              {selectedApplicationId === a.id && (
                <dl className="mt-5 pt-4 border-t border-ink-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-ink-400">Scholarship ID</dt>
                    <dd className="font-mono text-ink-700 mt-1">{a.scholarship_id}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-400">Application status</dt>
                    <dd className="text-ink-700 mt-1 capitalize">{a.status.replace("_", " ")}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-400">Applied on</dt>
                    <dd className="text-ink-700 mt-1">{new Date(a.created_at).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-400">Last updated</dt>
                    <dd className="text-ink-700 mt-1">{new Date(a.updated_at).toLocaleString()}</dd>
                  </div>
                </dl>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
