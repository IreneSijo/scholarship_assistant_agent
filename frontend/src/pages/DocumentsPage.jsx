import { useEffect, useRef, useState } from "react";
import { api, DOCUMENT_TYPES } from "../api/client.js";
import { Card, PageHeader, Badge } from "../components/ui.jsx";

function UploadButton({ label, busy, onFile }) {
  const inputRef = useRef(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 bg-seal text-white hover:bg-seal-dark"
      >
        {busy ? "Uploading…" : label}
      </button>
    </>
  );
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);
  const [uploadingType, setUploadingType] = useState(null);

  function refresh() {
    api
      .getDocuments()
      .then(setDocuments)
      .catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  async function handleUpload(documentType, file) {
    if (!file) return;
    setUploadingType(documentType);
    setError(null);
    try {
      await api.uploadDocument(documentType, file);
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingType(null);
    }
  }

  const byType = Object.fromEntries(documents.map((d) => [d.document_type, d]));

  return (
    <>
      <PageHeader
        eyebrow="Document vault"
        title="Keep your documents ready"
        description="Every document is tagged by type so the agent can match it to a scholarship's requirements automatically - it never guesses from filenames."
      />

      {error && <p className="text-sm text-rust mb-4">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DOCUMENT_TYPES.map((docType) => {
          const existing = byType[docType.value];
          return (
            <Card key={docType.value} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink-700">{docType.label}</p>
                {existing ? (
                  <div className="mt-1 flex items-center gap-2">
                    <Badge tone="success">Uploaded</Badge>
                    <span className="text-xs text-ink-400 truncate max-w-[10rem]">{existing.filename}</span>
                  </div>
                ) : (
                  <Badge tone="warning">Not uploaded</Badge>
                )}
              </div>
              <UploadButton
                label={existing ? "Replace" : "Upload"}
                busy={uploadingType === docType.value}
                onFile={(file) => handleUpload(docType.value, file)}
              />
            </Card>
          );
        })}
      </div>
    </>
  );
}
