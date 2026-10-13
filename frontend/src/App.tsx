import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Public Pages
import { Home } from './pages/public/Home';
import { Tournaments } from './pages/public/Tournaments';
import { TournamentDetails } from './pages/public/TournamentDetails';
import { Login } from './pages/public/Login';
import { Rules } from './pages/public/Rules';
import { Faq } from './pages/public/Faq';
import { Contact } from './pages/public/Contact';
import { PublicResults } from './pages/public/PublicResults';
import { PrivacyPolicy } from './pages/public/PrivacyPolicy';
import { TermsConditions } from './pages/public/TermsConditions';
import { NotFound } from './pages/public/NotFound';

// Player Dashboard Pages
import { PlayerLayout } from './pages/player/PlayerLayout';
import { PlayerDashboard } from './pages/player/PlayerDashboard';
import { MyTournaments } from './pages/player/MyTournaments';
import { MySquad } from './pages/player/MySquad';
import { MyPayments } from './pages/player/MyPayments';
import { MatchRoom } from './pages/player/MatchRoom';
import { MyResults } from './pages/player/MyResults';
import { NotificationsPage } from './pages/player/NotificationsPage';
import { MyProfile } from './pages/player/MyProfile';
import { AccountSettings } from './pages/player/AccountSettings';

// Admin Operations Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverview } from './pages/admin/AdminOverview';
import { TournamentManagement } from './pages/admin/TournamentManagement';
import { RegistrationManagement } from './pages/admin/RegistrationManagement';
import { SquadManagement } from './pages/admin/SquadManagement';
import { PaymentVerification } from './pages/admin/PaymentVerification';
import { UserManagement } from './pages/admin/UserManagement';
import { MatchScheduling } from './pages/admin/MatchScheduling';
import { RoomCredentialManagement } from './pages/admin/RoomCredentialManagement';
import { ResultsManagement } from './pages/admin/ResultsManagement';
import { NotificationManagement } from './pages/admin/NotificationManagement';
import { WebsiteSettings } from './pages/admin/WebsiteSettings';
import { AuditLogs } from './pages/admin/AuditLogs';

export const App: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-midnight text-icewhite">
      <Navbar />

      <div className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/tournaments/:id" element={<TournamentDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/results" element={<PublicResults />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />

          {/* Player Dashboard Routes */}
          <Route path="/player" element={<PlayerLayout />}>
            <Route index element={<PlayerDashboard />} />
            <Route path="my-tournaments" element={<MyTournaments />} />
            <Route path="my-squad" element={<MySquad />} />
            <Route path="my-payments" element={<MyPayments />} />
            <Route path="match-room" element={<MatchRoom />} />
            <Route path="my-results" element={<MyResults />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<MyProfile />} />
            <Route path="settings" element={<AccountSettings />} />
          </Route>

          {/* Admin Operations Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="tournaments" element={<TournamentManagement />} />
            <Route path="registrations" element={<RegistrationManagement />} />
            <Route path="squads" element={<SquadManagement />} />
            <Route path="payments" element={<PaymentVerification />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="matches" element={<MatchScheduling />} />
            <Route path="credentials" element={<RoomCredentialManagement />} />
            <Route path="results" element={<ResultsManagement />} />
            <Route path="notifications" element={<NotificationManagement />} />
            <Route path="settings" element={<WebsiteSettings />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>

          {/* Catch-All 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
};
