"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import MyTendersScreen from '../components/MyTendersScreen';

const MyTenders: React.FC = () => {
  const navigate = useNavigate();
  return <MyTendersScreen onNavigateTender={(id) => navigate(`/tender/${id}`)} />;
};

export default MyTenders;
