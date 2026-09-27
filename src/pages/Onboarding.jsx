import React from 'react';
import { useNavigate } from 'react-router-dom';
import Onboarding from '@/components/btau/Onboarding';

export default function OnboardingPage() {
  const navigate = useNavigate();
  return <Onboarding onDone={() => navigate('/', { replace: true })} />;
}