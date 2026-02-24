import { useAuth } from "../../context/AuthContext";
import AdminSupervisorView from "./AdminSupervisorView";
import MiGrupoView from "./MiGrupoView";

export default function SupervisorPage() {
  const { hasRole } = useAuth();
  return hasRole("superadmin", "admin") ? (
    <AdminSupervisorView />
  ) : (
    <MiGrupoView />
  );
}
