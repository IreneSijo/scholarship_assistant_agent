import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { Card, PageHeader, SealProgress, Badge, EmptyState, Button } from "../components/ui.jsx";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-ink-400">Loading dashboard…</p>;

  if (error) {
    return (
      <EmptyState
        title="No profile yet"
        description="Create your profile to unlock the dashboard, document vault, and scholarship matching."
        action={
          <Link to="/profile">
            <Button variant="seal">Create your profile</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Your scholarship dashboard"
        description="A live snapshot of your profile, documents, and applications, kept in sync by the AI agent."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-400 mb-4">Profile completion</p>
          <SealProgress percent={data.profile_completion_pct} label="Fields filled out on your applicant profile" />
        </Card>

        <Card>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-400 mb-4">Documents</p>
          <p className="font-display text-3xl text-ink-800">
            {data.documents_uploaded}
            <span className="text-ink-300 text-xl"> / {data.documents_total_types}</span>
          </p>
          <p className="text-sm text-ink-400 mt-2">
            {data.missing_document_types.length
              ? `Missing: ${data.missing_document_types.join(", ")}`
              : "Vault complete"}
          </p>
        </Card>

        <Card>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-400 mb-4">Eligible scholarships</p>
          <p className="font-display text-3xl text-ink-800">{data.eligible_scholarships_count}</p>
          <Link to="/scholarships" className="text-sm text-seal-dark font-medium hover:underline">
            View matches →
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-400 mb-4">Applications</p>
          <div className="flex gap-8">
            <div>
              <p className="font-display text-2xl text-ink-800">{data.applications_total}</p>
              <p className="text-xs text-ink-400">Total filed</p>
            </div>
            <div>
              <p className="font-display text-2xl text-ink-800">{data.applications_pending}</p>
              <p className="text-xs text-ink-400">Pending</p>
            </div>
            <div>
              <p className="font-display text-2xl text-moss">{data.applications_submitted}</p>
              <p className="text-xs text-ink-400">Submitted</p>
            </div>
          </div>
        </Card>

        <Card>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-400 mb-4">
            Paused - waiting on you
          </p>
          {data.applications_awaiting_documents.length === 0 ? (
            <p className="text-sm text-ink-400">Nothing is blocked. The agent is clear to proceed on all applications.</p>
          ) : (
            <ul className="space-y-3">
              {data.applications_awaiting_documents.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink-700">{a.scholarship_name}</p>
                    <Badge tone="warning">Missing: {a.missing_documents}</Badge>
                  </div>
                  <Link to="/applications" className="text-xs text-seal-dark font-medium hover:underline">
                    Resolve →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
