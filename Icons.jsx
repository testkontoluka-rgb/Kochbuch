// Feather-ähnliche SVG-Icons als Inline-Komponenten
export function IconScan({ size = 24, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" strokeLinecap="round"/>
      <path d="M17 3h2a2 2 0 0 1 2 2v2" strokeLinecap="round"/>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" strokeLinecap="round"/>
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" strokeLinecap="round"/>
      <rect x="7" y="7" width="10" height="10" rx="1"/>
    </svg>
  );
}

export function IconBook({ size = 24, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round"/>
    </svg>
  );
}

export function IconTag({ size = 24, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeLinecap="round"/>
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}

export function IconCamera({ size = 24, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeLinecap="round"/>
      <circle cx="12" cy="13" r="4" strokeLinecap="round"/>
    </svg>
  );
}

export function IconLink({ size = 24, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round"/>
    </svg>
  );
}

export function IconText({ size = 24, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <polyline points="4 7 4 4 20 4 20 7" strokeLinecap="round"/>
      <line x1="9" y1="20" x2="15" y2="20" strokeLinecap="round"/>
      <line x1="12" y1="4" x2="12" y2="20" strokeLinecap="round"/>
    </svg>
  );
}

export function IconArrowLeft({ size = 24, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <line x1="19" y1="12" x2="5" y2="12" strokeLinecap="round"/>
      <polyline points="12 19 5 12 12 5" strokeLinecap="round"/>
    </svg>
  );
}

export function IconChevronRight({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <polyline points="9 18 15 12 9 6" strokeLinecap="round"/>
    </svg>
  );
}

export function IconPlus({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round"/>
      <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round"/>
    </svg>
  );
}

export function IconTrash({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <polyline points="3 6 5 6 21 6" strokeLinecap="round"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconX({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round"/>
      <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round"/>
    </svg>
  );
}

export function IconAlertCircle({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round"/>
      <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round"/>
    </svg>
  );
}

export function IconInfo({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12" strokeLinecap="round"/>
      <line x1="12" y1="8" x2="12.01" y2="8" strokeLinecap="round"/>
    </svg>
  );
}

export function IconEdit({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round"/>
    </svg>
  );
}

export function IconUpload({ size = 40, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <polyline points="16 16 12 12 8 16" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="12" y2="21" strokeLinecap="round"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" strokeLinecap="round"/>
    </svg>
  );
}
