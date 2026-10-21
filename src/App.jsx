import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PartyProvider } from './context/PartyContext';
import { QueueProvider } from './context/QueueContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import { Login, Register } from './pages/Auth';
import Home from './pages/Home';
import PlayLayout from './pages/play/PlayLayout';
import Ranked from './pages/play/Ranked';
import Lobbies from './pages/play/Lobbies';
import ServerBrowser from './pages/play/ServerBrowser';
import MatchRoom from './pages/MatchRoom';
import Ranking from './pages/Ranking';
import Tournaments from './pages/Tournaments';
import Profile from './pages/Profile';
import Premium from './pages/Premium';
import MatchDetails from './pages/MatchDetails';
import History from './pages/History';

// Rotas do app exigem sessão (mock); senão manda pro login e volta depois
function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

// key = id para resetar o estado (veto, chat) ao trocar de partida
function MatchRoute() {
  const { id } = useParams();
  return <MatchRoom key={id} />;
}

export default function App() {
  return (
    <AuthProvider>
      <PartyProvider>
        <QueueProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Register />} />
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route path="inicio" element={<Home />} />
              <Route path="jogar" element={<PlayLayout />}>
                <Route index element={<Ranked />} />
                <Route path="lobbies" element={<Lobbies />} />
                <Route path="retake" element={<ServerBrowser key="retake" type="retake" />} />
                <Route path="dm" element={<ServerBrowser key="dm" type="dm" />} />
              </Route>
              <Route path="partida/:id" element={<MatchRoute />} />
              <Route path="partidas/:matchId" element={<MatchDetails />} />
              <Route path="historico/:nick" element={<History />} />
              <Route path="ranking" element={<Ranking />} />
              <Route path="campeonatos" element={<Tournaments />} />
              <Route path="perfil/:nick" element={<Profile />} />
              <Route path="premium" element={<Premium />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </QueueProvider>
      </PartyProvider>
    </AuthProvider>
  );
}
