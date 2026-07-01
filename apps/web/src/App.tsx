import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import GuildLayout from './pages/GuildLayout';
import StandingsPage from './pages/StandingsPage';
import TeamsPage from './pages/TeamsPage';
import ScrimmagesPage from './pages/ScrimmagesPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/g/:guildId" element={<GuildLayout />}>
        <Route index element={<StandingsPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="scrimmages" element={<ScrimmagesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
