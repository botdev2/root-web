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
    case "user":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5.2 19.2a7 7 0 0 1 13.6 0" />
        </svg>
      );
    case "id":
      return (
        <svg {...props}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
          <circle cx="9" cy="12" r="2.1" />
          <path d="M13 10.5h5M13 13.5h3.5" />
        </svg>
      );
    case "dots":
      return (
        <svg {...props}>
          <circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none" />
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
    case "eye":
      return (
        <svg {...props}>
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
          <circle cx="12" cy="12" r="2.8" />
        </svg>
      );
    case "eye-off":
      return (
        <svg {...props}>
          <path d="M4 4l16 16M9.9 6A9.6 9.6 0 0 1 12 5.5C18 5.5 21.5 12 21.5 12a16 16 0 0 1-3.2 3.9M6.1 8.1A16 16 0 0 0 2.5 12S6 18.5 12 18.5c1.3 0 2.5-.3 3.6-.8" />
        </svg>
      );
    case "chart":
      return (
        <svg {...props}>
          <path d="M4 19V5M4 19h16" />
          <path d="M8 15l3.5-4.5 3 2.5L19 7" />
        </svg>
      );
    case "edit":
      return (
        <svg {...props}>
          <path d="M14.5 5.5 18.5 9.5" />
          <path d="M12.2 7.8 5.5 14.5V18.5H9.5L16.2 11.8Z" />
        </svg>
      );
    case "grip":
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      );
    case "key":
      return (
        <svg {...props}>
          <circle cx="8" cy="15" r="3.2" />
          <path d="M10.4 13.4 20 4.8M16.5 5.2l3 3M15 8.2l2.2 2.2" />
        </svg>
      );
    case "lock":
      return (
        <svg {...props}>
          <rect x="6" y="11" width="12" height="9" rx="1.5" />
          <path d="M8.5 11V8.2a3.5 3.5 0 0 1 7 0V11" />
        </svg>
      );
    case "shield":
      return (
        <svg {...props}>
          <path d="M12 3.5 19 6.5v5.2c0 4.2-2.8 7.2-7 8.8-4.2-1.6-7-4.6-7-8.8V6.5z" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...props}>
          <rect x="3.5" y="6.5" width="17" height="12" rx="2" />
          <path d="M3.5 10h17" />
          <circle cx="16.2" cy="14.2" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "branch":
      return (
        <svg {...props}>
          <circle cx="6" cy="6" r="2" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="12" r="2" />
          <path d="M6 8v8M8 6h4.5A3.5 3.5 0 0 1 16 9.5V12" />
        </svg>
      );
    case "warn":
      return (
        <svg {...props}>
          <path d="M12 4.5 21 19.5H3z" />
          <path d="M12 10v4.5" />
          <circle cx="12" cy="17" r="0.7" fill="currentColor" stroke="none" />
        </svg>
      );
    case "info":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 11v5.5M12 7.6v.2" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <path d="m8.5 12.2 2.4 2.4 4.6-5" />
        </svg>
      );
    case "monitor":
      return (
        <svg {...props}>
          <rect x="3.5" y="5" width="17" height="11.5" rx="1.5" />
          <path d="M8 20h8M12 16.5V20" />
        </svg>
      );
    case "server":
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="6" rx="1.2" />
          <rect x="4" y="14" width="16" height="6" rx="1.2" />
          <circle cx="8" cy="7" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="8" cy="17" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );
    case "book":
      return (
        <svg {...props}>
          <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5z" />
          <path d="M5 5.5v16" />
        </svg>
      );
    case "coin":
      return (
        <svg {...props}>
          <ellipse cx="12" cy="12" rx="8" ry="8" />
          <path d="M12 8v8M9.5 10.2c.6-.8 1.5-1.2 2.5-1.2s2 .5 2.5 1.4c.4.8-.1 1.6-2.5 1.8s-2.9.9-2.5 1.9c.5.9 1.5 1.3 2.6 1.3s2-.4 2.6-1.2" />
        </svg>
      );
    case "link":
      return (
        <svg {...props}>
          <path d="M10 13.5 8.8 14.7a3.2 3.2 0 0 1-4.5-4.5L6.5 8" />
          <path d="M14 10.5 15.2 9.3a3.2 3.2 0 0 1 4.5 4.5L17.5 16" />
          <path d="m9 15 6-6" />
        </svg>
      );
    case "steps":
      return (
        <svg {...props}>
          <path d="M5 19h6v-6h6V7h2" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="11" cy="13" r="2" />
          <circle cx="17" cy="7" r="2" />
        </svg>
      );
    default:
      return <svg {...props} />;
  }
}
