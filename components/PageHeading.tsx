import { Icon, type IconName } from "./Icon";

export function PageHeading({ title, description, icon, action }: {
  title: string;
  description: string;
  icon: IconName;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-heading">
      <span className="tile-icon page-icon"><Icon name={icon} size={22} /></span>
      <div className="heading-copy">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="heading-action">{action}</div>}
    </header>
  );
}
