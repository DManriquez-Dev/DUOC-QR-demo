import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Scanner from './pages/Scanner'
import RoomInfo from './pages/RoomInfo'
import ErrorQR from './pages/ErrorQR'

function App() {
  return (
    <Routes>
      <Route path="/"          element={<Home />} />
      <Route path="/scanner"   element={<Scanner />} />
      <Route path="/sala/:id"  element={<RoomInfo />} />
      <Route path="/error"     element={<ErrorQR />} />
    </Routes>
  )
}

export default App
