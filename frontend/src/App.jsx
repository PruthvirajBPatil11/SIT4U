import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Interests from './pages/Interests'
import '../templatemo-electric-xtra.css'


export default function App() {
return (
<Router>
<Routes>
<Route path="/" element={<Navigate to="/login" />} />
<Route path="/login" element={<Login />} />
<Route path="/interests" element={<Interests />} />
</Routes>
</Router>
)
}