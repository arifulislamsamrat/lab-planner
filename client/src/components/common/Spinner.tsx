interface Props { label?: string; fullPage?: boolean }
export default function Spinner({ label = 'Loading…', fullPage }: Props) {
  return (
    <div className={fullPage ? 'spinner-overlay' : 'spinner-row'}>
      <span className="spinner" aria-hidden="true" />
      <span className="spinner-label">{label}</span>
    </div>
  );
}
