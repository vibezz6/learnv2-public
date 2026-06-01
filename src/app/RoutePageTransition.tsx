import { useLocation, Outlet } from "react-router-dom";

/** Subtle fade on route changes (desktop daily driver). */
export function RoutePageTransition() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="route-page min-h-full">
      <Outlet />
    </div>
  );
}
