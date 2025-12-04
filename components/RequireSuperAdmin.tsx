import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactElement;
}

const RequireSuperAdmin: React.FC<Props> = ({ children }) => {
  const { isSuperAdmin, loading, session } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireSuperAdmin;