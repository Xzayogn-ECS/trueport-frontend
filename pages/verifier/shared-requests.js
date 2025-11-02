import { useEffect, useState } from 'react';
import Head from 'next/head';
import ProtectedRoute from '../../components/ProtectedRoute';
import SidebarLayout from '../../components/SidebarLayout';
import api from '../../utils/api';
import { useRouter } from 'next/router';

export default function SharedRequests({ showToast }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchSharedRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSharedRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/background-verification/shared-requests');
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('Failed to load shared requests', err);
      showToast?.('Failed to load shared requests', 'error');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (requestId) => {
    try {
      setStarting(true);
      const res = await api.post(`/background-verification/shared-requests/${requestId}/start-chat`);
      const chatId = res.data?.chatId;
      if (chatId) {
        // navigate to chats and open the chat
        router.push(`/verifier/chats?open=${chatId}`);
      } else {
        showToast?.('Chat started but server did not return chat id', 'warning');
      }
    } catch (err) {
      console.error('Failed to start chat', err);
      showToast?.(err?.response?.data?.message || 'Failed to start chat', 'error');
    } finally {
      setStarting(false);
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Shared Requests - Verifier</title>
      </Head>

      <div className="min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold mb-3">Requests Shared With You</h1>

          <div className="bg-white rounded-lg border p-4">
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : requests.length === 0 ? (
              <div className="text-sm text-gray-500">No requests shared with you.</div>
            ) : (
              <div className="space-y-3">
                {requests.map((r) => (
                  <div key={r.id} className="p-3 border rounded flex items-start justify-between">
                    <div>
                      <div className="font-medium">{r.student?.name}</div>
                      <div className="text-xs text-gray-500">{r.student?.email} • {r.student?.institute}</div>
                      <div className="text-sm mt-2">Referee: <span className="font-medium">{r.referee?.name}</span> — {r.referee?.email}</div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {r.chatId ? (
                        <button onClick={() => router.push(`/verifier/chats?open=${r.chatId}`)} className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm">Open Chat</button>
                      ) : (
                        <button disabled={starting} onClick={() => handleStartChat(r.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">{starting ? 'Starting...' : 'Start Chat'}</button>
                      )}
                      <div className="text-xs text-gray-500">Status: {r.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

SharedRequests.getLayout = function getLayout(page) {
  return <SidebarLayout title="Shared Requests">{page}</SidebarLayout>;
};
