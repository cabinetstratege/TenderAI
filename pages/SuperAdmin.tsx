"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import SuperAdminScreen from '../components/SuperAdminScreen';

const SuperAdmin: React.FC = () => {
  const navigate = useNavigate();
  return <SuperAdminScreen />;
};

export default SuperAdmin;
