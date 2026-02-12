import React from 'react';
import { useNavigate } from 'react-router-dom';
import WelcomeScreen from '../components/WelcomeScreen';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  return <WelcomeScreen onComplete={() => navigate('/')} />;
};

export default Welcome;
