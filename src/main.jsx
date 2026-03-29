
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // Painel
import Vitrine from './vitrine.jsx' // Vitrine
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Rota do Painel Administrativo (Home) */}
        <Route path="/" element={<App />} />
        
        {/* Rota da Vitrine do Cliente */}
        <Route path="/vitrine" element={<Vitrine />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)