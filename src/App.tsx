import React from 'react';
import { TenantProvider } from './core/tenant/TenantContext';
import { AuthProvider, useAuth } from './core/auth/AuthContext';
import { Header } from './components/Header';
import { ClientHome } from './views/client/ClientHome';
import { BarberDashboard } from './views/barber/BarberDashboard';
import { OwnerDashboard } from './views/owner/OwnerDashboard';
import { SuperAdminDashboard } from './views/superadmin/SuperAdminDashboard';

import { QRCodeModal } from './components/QRCodeModal';
import { ClientAuthModal } from './components/ClientAuthModal';

const MainRouter: React.FC = () => {
  const { currentRole } = useAuth();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Dynamic Header with Tenant Branding */}
      <Header />

      {/* Main Viewport */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">

        {currentRole === 'client' && <ClientHome />}
        {currentRole === 'barber' && <BarberDashboard />}
        {currentRole === 'owner' && <OwnerDashboard />}
        {currentRole === 'superadmin' && <SuperAdminDashboard />}
      </main>

      {/* Modals */}
      <QRCodeModal />
      <ClientAuthModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <TenantProvider>
      <AuthProvider>
        <MainRouter />
      </AuthProvider>
    </TenantProvider>
  );
};

export default App;
