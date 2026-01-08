import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { SessionPage } from './pages/Session';
import { HistoryList } from './pages/HistoryList';
import { HistoryDetail } from './pages/HistoryDetail';
import { Login } from './pages/Login';
import { useWorkoutStore } from './lib/store';

function App() {
  const { authCredentials } = useWorkoutStore();

  if (!authCredentials) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/session" element={<SessionPage />} />
      <Route path="/history" element={<HistoryList />} />
      <Route path="/history/:sessionId" element={<HistoryDetail />} />
    </Routes>
  );
}

export default App;
