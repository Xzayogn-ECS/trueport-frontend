import { useEffect, useState } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import api from '../../utils/api';

export default function MyRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [selected, setSelected] = useState(null);
  // Submit referees modal state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitRequest, setSubmitRequest] = useState(null);
  const [availableVerifiers, setAvailableVerifiers] = useState([]);
  const [selectedVerifierIds, setSelectedVerifierIds] = useState(new Set());
  const [refereeContacts, setRefereeContacts] = useState([]);
  const [submittingRefs, setSubmittingRefs] = useState(false);

  const formatDate = (d) => {
    try {
      return d ? new Date(d).toLocaleString() : '—';
    } catch {
      return '—';
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/background-verification/my-requests');
      const payload = res?.data ?? {};
      const data = payload.requests ?? [];
      setRequests(Array.isArray(data) ? data : []);
      setPendingCount(Number(payload.pendingCount || 0));
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load requests');
      setRequests([]);
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers for submit referees modal
  const openSubmitModal = (request) => {
    setSubmitRequest(request);
    const slots = Number(request.refereeContactsRequested || 3);
    setRefereeContacts(Array.from({ length: slots }, () => ({})));
    setSubmitModalOpen(true);
  };

  const addVerifierAsReferee = (verifier) => {
    setRefereeContacts((prev) => {
      const entry = { name: verifier.name, email: verifier.email, phone: verifier.phone || '', role: verifier.institute || '' };
      const idx = prev.findIndex((p) => !p || (!p.email && !p.name && !p.phone));
      if (idx >= 0) {
        const cp = [...prev]; cp[idx] = entry; return cp;
      }
      return [...prev, entry];
    });
  };

  const addSelectedVerifiers = () => {
    if (selectedVerifierIds.size === 0) return;
    const chosen = availableVerifiers.filter(v => selectedVerifierIds.has(v._id || v.id));
    setRefereeContacts((prev) => {
      const cp = [...prev];
      for (const v of chosen) {
        const entry = { name: v.name, email: v.email, phone: v.phone || '', role: v.institute || '' };
        const idx = cp.findIndex((p) => !p || (!p.email && !p.name && !p.phone));
        if (idx >= 0) cp[idx] = entry; else cp.push(entry);
      }
      return cp;
    });
    // clear selection
    setSelectedVerifierIds(new Set());
  };

  const updateRefereeField = (idx, field, value) => {
    setRefereeContacts((prev) => {
      const cp = [...prev]; cp[idx] = { ...(cp[idx] || {}), [field]: value }; return cp;
    });
  };

  const removeReferee = (idx) => {
    setRefereeContacts((prev) => prev.filter((_, i) => i !== idx));
  };

  const addEmptyReferee = () => {
    setRefereeContacts((prev) => [...prev, {}]);
  };

  const handleSubmitReferees = async () => {
    if (!submitRequest) return;
    const minRequired = Number(submitRequest.refereeContactsRequested || 3);
    const cleaned = refereeContacts.map(r => ({ name: (r.name||'').trim(), email: (r.email||'').trim(), phone: (r.phone||'').trim(), role: (r.role||'').trim() })).filter(r => r.name || r.email || r.phone);
    if (cleaned.length < minRequired) {
      alert(`Please provide at least ${minRequired} referee contacts`);
      return;
    }

    // basic validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    for (const r of cleaned) {
      if (!r.name || !r.email || !r.phone) {
        alert('Each referee must have name, email and phone');
        return;
      }
      if (!emailRegex.test(r.email)) {
        alert(`Invalid email: ${r.email}`);
        return;
      }
    }

    try {
      setSubmittingRefs(true);
      const requestId = submitRequest.id ?? submitRequest._id;
      const res = await api.post(`/background-verification/${requestId}/submit-references`, { refereeContacts: cleaned });
      // success
      alert(res.data?.message || 'Referee contacts submitted successfully');
      setSubmitModalOpen(false);
      setSubmitRequest(null);
      setRefereeContacts([]);
      // refresh list
      fetchRequests();
    } catch (err) {
      console.error('Failed to submit referees:', err);
      alert(err?.response?.data?.message || err?.message || 'Failed to submit referees');
    } finally {
      setSubmittingRefs(false);
    }
  };

  // Fetch available verifiers from student's institute when modal opens
  useEffect(() => {
    if (!submitModalOpen) return;
    let mounted = true;
    const fetchVerifiers = async () => {
      try {
        const resp = await api.get('/users/institute-verifiers');
        const list = resp.data?.verifiers ?? resp.data ?? [];
        if (mounted) setAvailableVerifiers(list);
      } catch (err) {
        console.error('Failed to fetch institute verifiers:', err);
      }
    };
    fetchVerifiers();
    return () => { mounted = false; };
  }, [submitModalOpen]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">My Background Verification Requests {pendingCount > 0 && (<span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">{pendingCount} pending</span>)}</h2>

        {loading && <div className="text-sm text-gray-500">Loading requests...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {!loading && !error && requests.length === 0 && (
          <div className="text-sm text-gray-600">You have not received or created any background verification requests yet.</div>
        )}

        {!loading && requests.length > 0 && (
          <div className="overflow-x-auto bg-white border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Verifier</th>
                  <th className="px-4 py-3 text-left">Requested</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Requested At</th>
                  <th className="px-4 py-3 text-left">Expires At</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id || r._id} className="border-t">
                      <td className="px-4 py-3">{r.id ?? r._id ?? '—'}</td>
                      <td className="px-4 py-3">{r.verifier?.name ?? r.verifierName ?? '—'}</td>
                      <td className="px-4 py-3">{r.refereeContactsRequested ?? r.refereeNeeded ?? '—'}</td>
                      <td className="px-4 py-3">{r.refereeContactsSubmitted ?? 0}</td>
                      <td className="px-4 py-3 capitalize">{(r.status || r.requestStatus || 'unknown').toString()}</td>
                      <td className="px-4 py-3">{r.requestedAt ? new Date(r.requestedAt).toLocaleString() : (r.createdAt ? new Date(r.createdAt).toLocaleString() : '—')}</td>
                      <td className="px-4 py-3">{r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelected(r)}
                          className="text-sm text-primary-600 hover:underline"
                        >
                          View
                        </button>
                        {r.status === 'PENDING' && (
                          <button
                            onClick={() => openSubmitModal(r)}
                            className="text-sm text-white bg-primary-600 px-2 py-1 rounded"
                          >
                            Submit Referees
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Details modal / panel */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Request Details</h3>
                  <p className="text-xs text-gray-500">ID: {selected.id ?? selected._id}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-sm text-gray-500">Close</button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="border rounded p-3 bg-gray-50">
                  <div className="text-sm text-gray-600">Verifier</div>
                  <div className="font-medium">{selected.verifier?.name ?? selected.verifierName ?? '—'}</div>
                  <div className="text-xs text-gray-500">{selected.verifier?.email ?? selected.verifierEmail ?? ''}</div>
                  <div className="text-xs text-gray-500">{selected.verifier?.institute ?? selected.verifierInstitute ?? ''}</div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 border rounded">
                    <div className="text-xs text-gray-500">Requested</div>
                    <div className="font-medium">{selected.refereeContactsRequested ?? '—'}</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="text-xs text-gray-500">Submitted</div>
                    <div className="font-medium">{selected.refereeContactsSubmitted ?? 0}</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="text-xs text-gray-500">Status</div>
                    <div className="font-medium capitalize">{(selected.status || selected.requestStatus || '—').toString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border rounded">
                    <div className="text-xs text-gray-500">Requested At</div>
                    <div className="font-medium">{formatDate(selected.requestedAt)}</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="text-xs text-gray-500">Submitted At</div>
                    <div className="font-medium">{formatDate(selected.submittedAt)}</div>
                  </div>
                </div>

                <div className="p-3 border rounded">
                  <div className="text-xs text-gray-500">Expires At</div>
                  <div className="font-medium">{formatDate(selected.expiresAt)}</div>
                </div>

                {selected.notes && (
                  <div className="p-3 border rounded bg-gray-50">
                    <div className="text-xs text-gray-500">Notes</div>
                    <div className="text-sm">{selected.notes}</div>
                  </div>
                )}

                {selected.refereeContacts && selected.refereeContacts.length > 0 && (
                  <div className="p-3 border rounded">
                    <div className="text-xs text-gray-500 mb-2">Referee Contacts</div>
                    <div className="space-y-2">
                      {selected.refereeContacts.map((rc, i) => (
                        <div key={i} className="p-2 bg-white border rounded">
                          <div className="font-medium">{rc.name}</div>
                          <div className="text-xs text-gray-500">{rc.email} • {rc.phone}</div>
                          {rc.role && <div className="text-xs text-gray-500">{rc.role}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button onClick={() => setSelected(null)} className="px-4 py-2 border rounded">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Referees Modal */}
        {submitModalOpen && submitRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Submit Referee Contacts</h3>
                <button onClick={() => setSubmitModalOpen(false)} className="text-gray-500">Close</button>
              </div>

              <p className="text-sm text-gray-600 mb-3">Request from <strong>{submitRequest.verifier?.name}</strong>. Please provide at least {submitRequest.refereeContactsRequested} referee contacts.</p>

              <div className="space-y-3">
                {/* Helper: select existing verifiers (checkbox list) */}
                {availableVerifiers.length > 0 && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Select existing verifiers from your institute</label>
                    <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                      {availableVerifiers.map((v) => {
                        const vid = v._id || v.id;
                        const checked = selectedVerifierIds.has(vid);
                        return (
                          <label key={vid} className="flex items-center gap-2 text-sm py-1">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setSelectedVerifierIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(vid)) next.delete(vid); else next.add(vid);
                                  return next;
                                });
                              }}
                            />
                            <span className="flex-1 min-w-0">
                              <div className="font-medium">{v.name}</div>
                              <div className="text-xs text-gray-500">{v.email}</div>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <div className="mt-2">
                      <button onClick={addSelectedVerifiers} className="px-3 py-1 bg-primary-600 text-white rounded text-sm">Add selected</button>
                      <span className="ml-3 text-xs text-gray-500">Or click a verifier below to add quickly</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto mt-2">
                      {availableVerifiers.map((v) => (
                        <button
                          key={(v._id || v.id) + '-quick'}
                          onClick={() => addVerifierAsReferee(v)}
                          className="px-3 py-1 bg-gray-100 rounded text-sm"
                        >
                          {v.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Referee contacts list */}
                <div className="space-y-2">
                  {refereeContacts.map((ref, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <input className="form-input w-full" placeholder="Name" value={ref.name || ''} onChange={(e) => updateRefereeField(idx, 'name', e.target.value)} />
                      </div>
                      <div className="col-span-4">
                        <input className="form-input w-full" placeholder="Email" value={ref.email || ''} onChange={(e) => updateRefereeField(idx, 'email', e.target.value)} />
                      </div>
                      <div className="col-span-3">
                        <input className="form-input w-full" placeholder="Phone" value={ref.phone || ''} onChange={(e) => updateRefereeField(idx, 'phone', e.target.value)} />
                      </div>
                      <div className="col-span-1">
                        <button onClick={() => removeReferee(idx)} className="text-sm text-red-600">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={addEmptyReferee} className="px-3 py-1 bg-white border rounded">Add Empty</button>
                  <div className="text-sm text-gray-500">Minimum required: {submitRequest.refereeContactsRequested}</div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setSubmitModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={handleSubmitReferees} disabled={submittingRefs} className="px-4 py-2 bg-primary-600 text-white rounded">{submittingRefs ? 'Submitting...' : 'Submit Referees'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

// Use SidebarLayout as the page layout so _app can avoid rendering the top Navbar
MyRequestsPage.getLayout = function getLayout(page) {
  return <SidebarLayout title="My Requests">{page}</SidebarLayout>;
};

