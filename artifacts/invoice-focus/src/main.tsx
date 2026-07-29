import { createRoot } from 'react-dom/client';

import App from './App';
import { installDevelopmentDiagnostics } from './lib/dev-diagnostics';

import './index.css';

installDevelopmentDiagnostics();
createRoot(document.getElementById('root')!).render(<App />);
