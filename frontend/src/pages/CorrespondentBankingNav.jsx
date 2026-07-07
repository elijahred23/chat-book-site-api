import { NavLink } from "react-router-dom";
import { moduleNavItems } from "../correspondent_banking/modules";

export default function CorrespondentBankingNav() {
  return (
    <nav className="banking-module-nav" aria-label="Correspondent banking modules">
      {moduleNavItems.map((item) => (
        <NavLink
          className={({ isActive }) => `banking-module-nav__link${isActive ? " banking-module-nav__link--active" : ""}`}
          end={item.path === "/correspondent-banking"}
          key={item.id}
          to={item.path}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
