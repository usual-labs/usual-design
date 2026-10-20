import { Layout } from './components/Layout';
import { Labs } from './pages/Labs';
import { Design } from './pages/Design';
import { Docs } from './pages/Docs';

export function App() {
  const path = window.location.pathname.replace(/\/+$/, '');
  const page = path === '/design/docs' ? 'docs' : path === '/design' ? 'design' : 'labs';
  return (
    <Layout page={page}>
      {page === 'docs' ? <Docs /> : page === 'design' ? <Design /> : <Labs />}
    </Layout>
  );
}
