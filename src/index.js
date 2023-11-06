import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { defaultTheme, Provider } from '@adobe/react-spectrum';

const root = ReactDOM.createRoot(document.getElementById('root'));
let theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
function onSelectTheme(val) {
  theme = val;
}
root.render(
  <React.StrictMode>
    <Provider theme={defaultTheme} colorScheme={theme}>
      <App onSelectTheme={onSelectTheme}/>
    </Provider>
  </React.StrictMode>
);
