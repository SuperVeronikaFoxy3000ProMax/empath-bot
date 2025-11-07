import React from 'react'
import ReactDOM from 'react-dom/client'
import { MaxUI } from '@maxhub/max-ui'
import App from './App.jsx'
import '@maxhub/max-ui/dist/styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MaxUI>
      <App />
    </MaxUI>
  </React.StrictMode>,
)