"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsScreen from '../components/SettingsScreen';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  return (
    <SettingsScreen
      onLogout={() => navigate('/auth')}
      onRestartTutorial={() => navigate('/')}
    />
  );
};

export default Settings;
