"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatsScreen from '../components/StatsScreen';

const Stats: React.FC = () => {
  const navigate = useNavigate();
  return <StatsScreen onNavigateTender={(id) => navigate(`/tender/${id}`)} />;
};

export default Stats;
