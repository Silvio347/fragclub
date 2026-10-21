import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { ShopProvider } from './context/ShopContext';
import { TeamsProvider } from './context/TeamsContext';
import { PartyProvider } from './context/PartyContext';
import { QueueProvider } from './context/QueueContext';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';
import PageLoader from './components/PageLoader';
import Landing from './pages/Landing';

// Landing carrega junto; o resto vira chunks separados, baixados ao abrir a rota
const Login = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Register })));
const Home = lazy(() => import('./pages/Home'));
const PlayLayout = lazy(() => import('./pages/play/PlayLayout'));
const Ranked = lazy(() => import('./pages/play/Ranked'));
const Lobbies = lazy(() => import('./pages/play/Lobbies'));
const ServerBrowser = lazy(() => import('./pages/play/ServerBrowser'));
const MatchRoom = lazy(() => import('./pages/MatchRoom'));
const Ranking = lazy(() => import('./pages/Ranking'));
const Tournaments = lazy(() => import('./pages/Tournaments'));
const Profile = lazy(() => import('./pages/Profile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Premium = lazy(() => import('./pages/Premium'));
const MatchDetails = lazy(() => import('./pages/MatchDetails'));
const History = lazy(() => import('./pages/History'));
const Teams = lazy(() => import('./pages/teams/Teams'));
const TeamPage = lazy(() => import('./pages/teams/TeamPage'));
const Shop = lazy(() => import('./pages/Shop'));

// Comportamentos do React Router v7 já ativados (evita surpresa no upgrade)
export const ROUTER_FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true };

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

// key = nick para resetar estado local ao navegar entre perfis
function ProfileRoute() {
  const { nick } = useParams();
  return <Profile key={nick} />;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <ShopProvider>
          <TeamsProvider>
            <PartyProvider>
              <QueueProvider>
                <Suspense fallback={<PageLoader fullscreen />}>
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
                      <Route path="times" element={<Teams />} />
                      <Route path="times/:id" element={<TeamPage />} />
                      <Route path="loja" element={<Shop />} />
                      <Route path="ranking" element={<Ranking />} />
                      <Route path="campeonatos" element={<Tournaments />} />
                      <Route path="perfil/editar" element={<EditProfile />} />
                      <Route path="perfil/:nick" element={<ProfileRoute />} />
                      <Route path="premium" element={<Premium />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </QueueProvider>
            </PartyProvider>
          </TeamsProvider>
        </ShopProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}
