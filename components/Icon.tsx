const paths = {
  spark: "M12 2l2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7L12 2Z",
  chat: "M21 11.5a8.4 8.4 0 0 1-9 8.5 10 10 0 0 1-3.1-.5L4 21l1.4-4.2A8.2 8.2 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m12-14a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  bookmark: "M6 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-6-4-6 4V5Z",
  arrow: "M4 12h15m-6-6 6 6-6 6",
  send: "M12 20V4m-6 6 6-6 6 6",
  pin: "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Zm-5.5 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z",
  layers: "m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5m-18 4 9 5 9-5",
  activity: "M3 12h4l3-7 4 14 3-7h4",
  logout: "M10 17l5-5-5-5m5 5H3m10-8h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6",
  briefcase: "M9 7V4h6v3M3 12c6 3 12 3 18 0M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}
