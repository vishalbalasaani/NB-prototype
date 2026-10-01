'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { DataService } from '@/lib/data-service';
import { SplashScreen } from '@/components/splash/SplashScreen';
import { LoginPage } from '@/components/auth/LoginPage';
import { TopHeader, AppModule } from '@/components/navigation/TopHeader';
import { HomeView } from '@/components/dashboard/HomeView';
import { AttendanceWorkspace } from '@/components/attendance/AttendanceWorkspace';
import { AttendanceStaffWorkspace } from '@/components/attendance/AttendanceStaffWorkspace';
import { UpdatesHome } from '@/components/updates/UpdatesHome';
import { MarksWorkspace } from '@/components/marks/MarksWorkspace';
import { StudentsDirectoryView } from '@/components/students/StudentsDirectoryView';
import { ExcelImportView } from '@/components/import/ExcelImportView';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return DataService.getCurrentUser();
  });
  const [activeModule, setActiveModule] = useState<AppModule>(() => {
    const user = DataService.getCurrentUser();
    return user?.role === 'management' ? 'home' : 'attendance';
  });

  // Verify and sync stored session on mount
  useEffect(() => {
    const user = DataService.getCurrentUser();
    if (user && (!currentUser || currentUser.id !== user.id)) {
      setCurrentUser(user);
      setActiveModule(user.role === 'management' ? 'home' : 'attendance');
    }
  }, [currentUser]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveModule(user.role === 'management' ? 'home' : 'attendance');
  };

  const handleLogout = () => {
    DataService.logout();
    setCurrentUser(null);
    setActiveModule('home');
  };

  // 1. Splash Screen Phase (~3 seconds)
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // 2. Authentication Phase
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-nb-app overflow-x-hidden">
      {/* Compact Professional Top Application Header (NO permanent left sidebar) */}
      <TopHeader
        user={currentUser}
        activeModule={activeModule}
        onNavigate={(mod) => {
          if (currentUser.role === 'attendance') return;
          setActiveModule(mod);
        }}
        onLogout={handleLogout}
      />

      {/* Main Module Content Workspace */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {/* LEVEL 1: HOME COMMAND CENTER (Management Only) */}
        {activeModule === 'home' && currentUser.role === 'management' && (
          <HomeView
            user={currentUser}
            onSelectModule={(mod) => setActiveModule(mod)}
          />
        )}

        {/* LEVEL 2: CONTEXTUAL ATTENDANCE WORKSPACE */}
        {activeModule === 'attendance' && (
          currentUser.role === 'attendance' ? (
            <AttendanceStaffWorkspace
              user={currentUser}
              onBackToHome={() => {}}
            />
          ) : (
            <AttendanceWorkspace
              user={currentUser}
              onBackToHome={() => setActiveModule('home')}
            />
          )
        )}

        {/* LEVEL 2: UPDATES WORKSPACE */}
        {activeModule === 'updates' && (
          <UpdatesHome
            user={currentUser}
            onBackToHome={() => setActiveModule('home')}
          />
        )}

        {/* LEVEL 2: MARKS WORKSPACE */}
        {activeModule === 'marks' && (
          <MarksWorkspace
            user={currentUser}
            onBackToHome={() => setActiveModule('home')}
          />
        )}

        {/* MANAGEMENT UTILITIES */}
        {activeModule === 'students' && (
          <StudentsDirectoryView
            user={currentUser}
            onBack={() => setActiveModule('home')}
          />
        )}

        {activeModule === 'import' && (
          <ExcelImportView
            user={currentUser}
            onBack={() => setActiveModule('home')}
            onImportComplete={() => setActiveModule('students')}
          />
        )}
      </main>
    </div>
  );
}
