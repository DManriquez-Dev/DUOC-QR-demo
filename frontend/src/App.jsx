import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Scanner from './pages/Scanner'
import RoomInfo from './pages/RoomInfo'
import ErrorQR from './pages/ErrorQR'
import Help from './pages/Help'
import Layout from './components/Layout'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="scanner" element={<Scanner />} />
        <Route path="roominfo" element={<RoomInfo />} />
        <Route path="error" element={<ErrorQR />} />
        <Route path="help" element={<Help />} />
      </Route>
    </Routes>
  )
}

export default App
