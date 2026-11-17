import { Navigate } from 'react-router-dom';

export default function GovernmentLoginPage() {
  return <Navigate to="/login?role=government" replace />;
}
