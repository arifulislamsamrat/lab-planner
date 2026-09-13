import { Link } from 'react-router-dom';

export interface Crumb { label: string; to?: string }
interface Props { items: Crumb[] }

export default function Breadcrumb({ items }: Props) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((c, i) => (
        <span key={i} className="row">
          {i > 0 && <span className="sep">/</span>}
          {c.to ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}