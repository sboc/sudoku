export const ShareIcon = () => {
  return (
    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1v10M4.5 4.5L8 1l3.5 3.5"/>
      <path d="M4 8v5h8V8"/>
    </svg>
  );
};

export const PowerIcon = () => {
  return (
    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M8 3v4.5"/>
      <path d="M5.5 5A5 5 0 1 0 10.5 5"/>
    </svg>
  );
};

export const CheckIcon = () => {
  return (
    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l4 4 6-7"/>
    </svg>
  );
};

export const CrossIcon = () => {
  return (
    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 4l8 8M12 4l-8 8"/>
    </svg>
  );
};

export const PencilIcon = () => {
  return (
    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z"/>
    </svg>
  );
};


export const HelpIcon = () => {
  return (
    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M6.5 6.5a1.5 1.5 0 0 1 3 0c0 1.5-1.5 1.5-1.5 2.8"/>
      <circle cx="8" cy="12" r="0.7" fill="currentColor" stroke="none"/>
    </svg>
  );
};

export const AutoIcon = ({ checked }: { checked: boolean }) => (
  <svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="2.5" width="11" height="11" rx="2"/>
    {checked && <path d="M5 8.5l2.5 2.5L11 5.5"/>}
  </svg>
);

export const GearIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="2.5"/>
    <path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.6 3.6l.9.9M11.5 11.5l.9.9M3.6 12.4l.9-.9M11.5 4.5l.9-.9"/>
  </svg>
);
