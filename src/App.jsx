import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Logo from './components/Logo'

function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Logo size={80} showText={false} />
        </div>
        <div className="flex justify-center mb-2">
          <Logo size={40} showText={true} />
        </div>
        <p className="text-gray-400 mt-4 text-sm">
          Where the sun rises — Northeast India's marketplace
        </p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}