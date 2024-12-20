// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/common/layout/Layout';
import Home from './pages/Home';
import GameMap from './pages/GameMap';

function App() {
  return (
    <Router>
      <Routes>
        {/* GameMap outside of Layout */}
        <Route path="/game" element={<GameMap />} />
        
        {/* Other routes with Layout */}
        <Route path="/" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/rules" element={<div>Rules Page (Coming Soon)</div>} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;