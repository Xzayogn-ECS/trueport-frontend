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

  return (
    <>
      <Navbar />
      <Component {...pagePropsWithToast} />
      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default MyApp;