import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@fontsource-variable/manrope';
import './styles.css';
import './onboarding.css';
import './showcase.css';

const root = document.getElementById('root');
if (!root) throw new Error('The wizard root could not be found.');
createRoot(root).render(<App />);
