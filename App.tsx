
import React, { useState, useEffect } from 'react';
import OnboardingScreen from './components/OnboardingScreen';
import DashboardScreen from './components/DashboardScreen';

const App: React.FC = () => {
  const [seenOnboarding, setSeenOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onboardingStatus = localStorage.getItem('seen_onboarding');
    if (onboardingStatus === 'true') {
      setSeenOnboarding(true);
    }
    setLoading(false);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('seen_onboarding', 'true');
    setSeenOnboarding(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0F0B1A]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return seenOnboarding ? (
    <DashboardScreen />
  ) : (
    <OnboardingScreen onComplete={handleOnboardingComplete} />
  );
};

export default App;
