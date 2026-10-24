export default function UnderConstruction({ children, className = "" }) {
  return (
    <div className={`uc-wrap ${className}`}>
      <div className="uc-blur" aria-hidden="true">
        {children}
      </div>
      <div className="uc-veil">
        <p className="uc-label">Under Construction</p>
      </div>
    </div>
  );
}
