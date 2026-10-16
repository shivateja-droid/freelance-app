import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const token = localStorage.getItem('token');
  const usertype = localStorage.getItem('usertype');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/authenticate" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(usertype)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
