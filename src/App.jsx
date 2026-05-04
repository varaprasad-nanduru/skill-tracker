import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import RolePage from './pages/RolePage'
import useTheme from './hooks/useTheme'

export default function App() {
  useTheme()
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/role/:roleId" element={<RolePage />} />
      </Routes>
    </BrowserRouter>
  )
}
