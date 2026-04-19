import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LuminaraHome from './LuminaraHomepage'
import LuminaraResult from './LuminaraResult'
import SignIn from './SignIn.jsx'
import Dictionary from './Dictionary.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LuminaraHome />} />
        <Route path="/result" element={<LuminaraResult />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/dictionary" element={<Dictionary />} />
        <Route path="/library" element={<Navigate to="/dictionary" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App