import { Navigate } from 'react-router-dom';

export default function CitizenLoginPage() {
  return <Navigate to="/login?role=citizen" replace />;
}
