import { Outlet } from 'react-router-dom';

// Each tab renders this layout so the tab owns its Outlet and can host nested
// child routes (e.g. /moments/:id) while staying inside the shared TabLayout
// (which keeps the bottom tab bar visible). The flat tab paths still resolve
// via their index element, so direct URL access is unchanged.
export default function TabOutletLayout() {
  return <Outlet />;
}