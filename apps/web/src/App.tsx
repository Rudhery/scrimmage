import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import GuildLayout from './pages/GuildLayout';
import OverviewPage from './pages/OverviewPage';
import StandingsPage from './pages/StandingsPage';
import TeamsPage from './pages/TeamsPage';
import ScrimmagesPage from './pages/ScrimmagesPage';
import ChampionshipsPage from './pages/ChampionshipsPage';
import ChampionshipDetailPage from './pages/ChampionshipDetailPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/g/:guildId" element={<GuildLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="standings" element={<StandingsPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="scrimmages" element={<ScrimmagesPage />} />
        <Route path="championships" element={<ChampionshipsPage />} />
        <Route path="championships/:champId" element={<ChampionshipDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
