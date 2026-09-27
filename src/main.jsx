import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { base44 } from '@/api/base44Client'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

base44.analytics.track({ eventName: 'app_opened' })