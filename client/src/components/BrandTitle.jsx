const BrandTitle = ({ admin = false, className = "" }) => {
  const wrapperClassName = ["brand-title", className].filter(Boolean).join(" ");

  return (
    <div className={wrapperClassName} aria-label={admin ? "KaamSetu admin" : "KaamSetu"}>
      <span className="brand-title__mark" aria-hidden="true" />
      <span className="brand-title__wordmark">
        <span className="brand-title__word brand-title__word--kaam">Kaam</span>
        <span className="brand-title__word brand-title__word--setu">Setu</span>
      </span>
      {admin ? <span className="brand-title__badge">admin</span> : null}
    </div>
  );
};

export default BrandTitle;
