import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function BGChatRedirect() {
  const router = useRouter();
  const { chatId } = router.query;

  useEffect(() => {
    if (!chatId) return;
    // Redirect to verifier chat page and open specific chat via query param
    router.replace(`/verifier/chats?open=${encodeURIComponent(chatId)}`);
  }, [chatId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <div className="text-gray-700">Opening chat…</div>
      </div>
    </div>
  );
}
