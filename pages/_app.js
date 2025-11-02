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
  // If a page provides its own `getLayout`, trust it (it will render SidebarLayout when needed).
  // Otherwise render the global Navbar above pages that do not opt into a layout.
  const getLayout = Component.getLayout || ((page) => (
    <>
      <Navbar />
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