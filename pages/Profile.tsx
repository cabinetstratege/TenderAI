"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileScreen from '../components/ProfileScreen';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  return <ProfileScreen onDone={() => navigate('/')} />;
};

export default Profile;
