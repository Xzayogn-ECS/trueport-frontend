import '../styles/globals.css';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { useToast } from '../utils/hooks';

function MyApp({ Component, pageProps }) {
  const { toasts, showToast, removeToast } = useToast();

  // Make toast functions available to all pages
  const pagePropsWithToast = {
    ...pageProps,
    showToast,
  };

  // Support per-page layout pattern
  const getLayout = Component.getLayout || ((page) => (
    <>
      {/* Hide Navbar when SidebarLayout is active */}
      {typeof window !== 'undefined' && document.body.classList.contains('with-sidebar') ? null : <Navbar />}
      {page}
    </>
  ));

  return (
    <>
      {getLayout(<Component {...pagePropsWithToast} />)}
      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default MyApp;