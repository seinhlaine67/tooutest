import { Link } from "react-router-dom";

export default function SeriesCard({ item, className = "card-link" }) {
  const routeToken = item.slug || item.id || "series";
  const detailHref = `/series/${encodeURIComponent(routeToken)}${
    item.id ? `?id=${encodeURIComponent(item.id)}` : ""
  }`;

  return (
    <Link className={className} to={detailHref}>
      <div className="card">
        <div className="card-media">
          {item.badge ? <span className="card-badge">{item.badge}</span> : null}
          <div className="card-media-inner">
            <img src={item.image} alt={item.title} />
          </div>
        </div>
        <div className="card-genre">{item.genre}</div>
        <div className="card-title">{item.title}</div>
        <div className="card-meta">
          <span>
            <i className="fa-regular fa-eye" /> {item.views}
          </span>
          <span className="like">
            <i className="fa-regular fa-heart" /> {item.likes}
          </span>
        </div>
      </div>
    </Link>
  );
}
