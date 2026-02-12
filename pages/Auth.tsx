
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthScreen from '../components/AuthScreen';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  return <AuthScreen onAuthenticated={() => navigate('/')} />;
};

export default Auth;
