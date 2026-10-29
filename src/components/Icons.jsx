export function Icon({ name, size = 16, className = "" }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };

  switch (name) {
    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.2-3.2" />
        </svg>
      );
    case "folder":
      return (
        <svg {...props}>
          <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
        </svg>
      );
    case "chat":
      return (
        <svg {...props}>
          <path d="M5 17.5 4 21l3.8-1.4A8.5 8.5 0 1 0 5 17.5z" />
        </svg>
      );
    case "pin":
      return (
        <svg {...props}>
          <path d="M15 4.5 19.5 9M9.5 10.5 14 6l4 4-4.5 4.5M9.5 10.5 4 20l9.5-5.5" />
        </svg>
      );
    case "archive":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="4" rx="1" />
          <path d="M5 8v11h14V8M10 12h4" />
        </svg>
      );
    case "paperclip":
      return (
        <svg {...props}>
          <path d="m8.5 13.5 6-6a2.3 2.3 0 0 1 3.2 3.2l-7.2 7.2a3.4 3.4 0 0 1-4.8-4.8l7-7" />
        </svg>
      );
    case "send":
      return (
        <svg {...props} strokeWidth={2.2}>
          <path d="m6 14 6-6 6 6" />
        </svg>
      );
    case "bot":
      return (
        <svg {...props}>
          <rect x="5.5" y="8" width="13" height="9.5" rx="2.5" />
          <path d="M12 8V4.5" />
          <circle cx="9.5" cy="12.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="12.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "list":
      return (
        <svg {...props}>
          <path d="M10 7h9M10 12h9M10 17h9" />
          <circle cx="6" cy="7" r="1" fill="currentColor" stroke="none" />
          <circle cx="6" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="6" cy="17" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "cloud":
      return (
        <svg {...props}>
          <path d="M7 18h9.2a3.8 3.8 0 0 0 .3-7.6 5.2 5.2 0 0 0-10 1.5A3.3 3.3 0 0 0 7 18z" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...props}>
          <path d="m8 10 4 4 4-4" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...props}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      );
    case "plus":
      return (
        <svg {...props}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "x":
      return (
        <svg {...props}>
          <path d="M7 7l10 10M17 7 7 17" />
        </svg>
      );
    case "spark":
      return (
        <svg {...props}>
          <path d="M12 3.5 13.6 9l5.4 1.6L13.6 12 12 17.5 10.4 12 5 10.6 10.4 9z" />
        </svg>
      );
    case "menu":
      return (
        <svg {...props}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "play":
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M8 6.5v11l9-5.5z" />
        </svg>
      );
    case "record":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "globe":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <path d="M4 12h16M12 4a14 14 0 0 1 0 16M12 4a14 14 0 0 0 0 16" />
        </svg>
      );
    case "download":
      return (
        <svg {...props}>
          <path d="M12 4v11M8 11l4 4 4-4M5 19h14" />
        </svg>
      );
    default:
      return <svg {...props} />;
  }
}
