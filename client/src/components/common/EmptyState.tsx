interface Props {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, action }: Props) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {description && <p className="mb-3">{description}</p>}
      {action}
    </div>
  );
}