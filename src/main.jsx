import React from 'react'
import ReactDOM from 'react-dom/client'
import { MaxUI } from '@maxhub/max-ui'
import App from './App.jsx'
import '@maxhub/max-ui/dist/styles.css'

// Инициализация MAX Bridge
if (window.WebApp) {
    window.WebApp.ready();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MaxUI platform="ios" colorScheme="light">
      <App />
    </MaxUI>
  </React.StrictMode>
)