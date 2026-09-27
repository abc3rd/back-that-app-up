import React from 'react';
import { useNavigate } from 'react-router-dom';
import Onboarding from '@/components/btau/Onboarding';
import { useSettings } from '@/hooks/useSettings';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const settings = useSettings();
  const handleDone = () => {
    // After setup, the pre-roll buffer stands by automatically on every launch.
    settings.setAutoListen(true);
    navigate('/', { replace: true });
  };
  return <Onboarding onDone={handleDone} />;
}