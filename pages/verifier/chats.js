import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ProtectedRoute from '../../components/ProtectedRoute';
import SidebarLayout from '../../components/SidebarLayout';
import api from '../../utils/api';
import { Search, MoreVertical, Send, ArrowLeft } from 'lucide-react';

export default function VerifierChats({ showToast }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const pollRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchChats();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load current user from localStorage for message ownership checks
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      if (u) setCurrentUser(u);
    } catch (e) {
      setCurrentUser(null);
    }
  }, []);

  const router = useRouter();

  useEffect(() => {
    const chatToOpen = router?.query?.open;
    if (chatToOpen && chats.length > 0) {
      const exists = chats.find((c) => String(c.id || c._id) === String(chatToOpen) || String(c._id) === String(chatToOpen));
      if (exists) openChat(exists.id || exists._id || chatToOpen);
      else openChat(chatToOpen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router?.query?.open, chats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/background-verification/chats');
      setChats(res.data.chats || []);
    } catch (err) {
      console.error('Failed to load chats', err);
      showToast?.('Failed to load chats', 'error');
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (chatId) => {
    setSelectedChatId(chatId);
    try {
      const res = await api.get(`/background-verification/chat/${chatId}`);
      setSelectedChat(res.data || null);
      setMessages(res.data?.messages || []);
      startPolling(chatId);
    } catch (err) {
      console.error('Failed to open chat', err);
      showToast?.(err?.response?.data?.message || 'Failed to open chat', 'error');
    }
  };

  const startPolling = (chatId) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/background-verification/chat/${chatId}`);
        setMessages(res.data?.messages || []);
      } catch (err) {
        // ignore polling errors
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const handleSend = async () => {
    if (!messageText?.trim() || !selectedChatId) return;
    try {
      setSending(true);
      await api.post(`/background-verification/chat/${selectedChatId}/message`, { message: messageText.trim() });
      // Optimistically append message with current user info (if available)
      setMessages((m) => [...m, {
        senderId: currentUser?._id || null,
        senderEmail: currentUser?.email || '',
        senderName: currentUser?.name || 'You',
        senderRole: currentUser?.role || '',
        message: messageText.trim(),
        createdAt: new Date().toISOString()
      }]);
      setMessageText('');
      fetchChats();
    } catch (err) {
      console.error('Failed to send message', err);
      showToast?.(err?.response?.data?.message || 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatChatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return formatTime(date);
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Verifier Chats - TruePortMe</title>
      </Head>

      <div className="h-screen flex flex-col bg-white">
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className={`${selectedChatId ? 'hidden lg:flex' : 'flex'} w-full lg:w-[400px] flex-col bg-white border-r border-gray-200`}>
            {/* Sidebar Header */}
            <div className="bg-white px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-gray-900 text-xl font-medium">Chats</h1>
                <button className="text-gray-500 hover:text-gray-800 transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search or start new chat"
                  className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-200"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto bg-white">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-400">Loading...</div>
                </div>
              ) : chats.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-400 text-sm">No chats yet.</div>
                </div>
              ) : (
                chats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openChat(c.id)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                      selectedChatId === c.id ? 'bg-gray-100' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-800 font-medium flex-shrink-0">
                      {getInitials(c.title)}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-gray-900 font-medium text-sm truncate">{c.title}</h3>
                        <span className="text-gray-500 text-xs ml-2 flex-shrink-0">
                          {formatChatDate(c.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-500 text-sm truncate">
                          {c.lastMessage ? `${c.lastMessage.senderName}: ${c.lastMessage.text}` : c.participant?.institute}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`${selectedChatId ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-white`}>
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="bg-white px-4 py-2 flex items-center gap-3 border-b border-gray-200">
                  <button
                    onClick={() => setSelectedChatId(null)}
                    className="lg:hidden text-gray-500 hover:text-gray-800"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-800 font-medium flex-shrink-0">
                    {getInitials(
                      selectedChat.participants.sharedContact?.name ??
                      selectedChat.participants.requestingVerifier?.name ??
                      'Chat'
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-gray-900 font-medium text-base truncate">
                      {selectedChat.participants.sharedContact?.name ?? selectedChat.participants.requestingVerifier?.name ?? 'Chat'}
                    </h2>
                    <p className="text-gray-500 text-xs truncate">
                      {selectedChat.participants.requestingVerifier?.institute || selectedChat.participants.sharedContact?.institute}
                    </p>
                  </div>

                  {/* removed action buttons */}
                </div>

                {/* Messages Area */}
                <div 
                  className="flex-1 overflow-y-auto px-4 py-4"
                  style={{
                    backgroundColor: '#fff'
                  }}
                >
                  {messages.map((m, idx) => {
                    const isOwn = currentUser && String(m.senderId) === String(currentUser._id);
                    const prev = messages[idx - 1];
                    const isSameSenderAsPrev = prev && String(prev.senderId) === String(m.senderId);
                    // whatsapp-like grouping: small top margin for same sender, show name only when different
                    return (
                      <div
                        key={idx}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        style={{ marginTop: isSameSenderAsPrev ? 4 : 12 }}
                      >
                        <div
                          className={`max-w-[75%] px-3 py-2 shadow-sm break-words whitespace-pre-wrap ${
                            isOwn
                              ? 'bg-blue-600 text-white rounded-lg rounded-tr-none'
                              : 'bg-gray-100 text-gray-900 rounded-lg rounded-tl-none'
                          }`}
                          // slightly change border radius for grouped messages: if same sender as next, remove bottom rounding
                          style={{
                            borderBottomRight: isOwn && messages[idx + 1] && messages[idx + 1].senderName === m.senderName ? '4px solid transparent' : undefined,
                            borderBottomLeft: !isOwn && messages[idx + 1] && messages[idx + 1].senderName === m.senderName ? '4px solid transparent' : undefined,
                          }}
                        >
                          {!isSameSenderAsPrev && !isOwn && (
                            <div className="text-gray-600 text-xs font-medium mb-1">
                              {m.senderName}
                            </div>
                          )}
                          <div className="text-sm">
                            {m.message}
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className={`text-[10px] ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                              {formatTime(m.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area (emoji removed) */}
                <div className="bg-white px-4 py-3 border-t border-gray-200">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message"
                        className="w-full bg-transparent text-gray-900 placeholder-gray-400 px-4 py-2.5 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleSend}
                      disabled={sending || !messageText.trim()}
                      className={`p-2 rounded-full transition-colors ${
                        messageText.trim()
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'text-gray-400'
                      }`}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <div className="w-80 text-center">
                  <div className="w-48 h-48 mx-auto mb-8 relative">
                    <div className="absolute inset-0 bg-gray-100 rounded-full"></div>
                    <div className="absolute inset-8 bg-white rounded-full flex items-center justify-center">
                      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                        <path d="M40 15C26.2 15 15 26.2 15 40C15 44.8 16.4 49.3 18.8 53.1L16.5 62.5L26.3 60.3C30 62.5 34.3 64 39 64H40C53.8 64 65 52.8 65 39C65 25.2 53.8 15 40 15Z" stroke="#9CA3AF" strokeWidth="2" fill="none"/>
                        <circle cx="30" cy="36" r="2" fill="#9CA3AF"/>
                        <circle cx="40" cy="36" r="2" fill="#9CA3AF"/>
                        <circle cx="50" cy="36" r="2" fill="#9CA3AF"/>
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-2xl text-gray-900 font-light mb-3">TruePortMe Chats</h2>
                  <p className="text-sm leading-relaxed">
                    Select a chat to view messages
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

VerifierChats.getLayout = function getLayout(page) {
  return <SidebarLayout title="Chats">{page}</SidebarLayout>;
};
