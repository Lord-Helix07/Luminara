import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LuminaraHome from './LuminaraHomepage'
import LuminaraResult from './LuminaraResult'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LuminaraHome />} />
        <Route path="/result" element={<LuminaraResult />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App