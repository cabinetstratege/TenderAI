"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import PricingScreen from '../components/PricingScreen';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  return <PricingScreen onSubscribed={() => navigate('/')} />;
};

export default Pricing;
