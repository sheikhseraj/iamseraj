const paths = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3c4 4 4 14 0 18 M12 3c-4 4-4 14 0 18',
  people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  requests: 'M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9 M9 3v6h6 M13 15h4 M15 13v4 M9 3l6 6',
  shield: 'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3 M8 12l3 3 5-6',
  warning: 'M12 3L2 21h20L12 3 M12 9v5 M12 17v.01',
  blocked: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M5.6 5.6l12.8 12.8',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',
  audit: 'M8 3h8v4H8z M8 5H5v16h14V5h-3 M8 11h8 M8 15h8',
  user: 'M20 21v-2a7 7 0 0 0-14 0v2 M17 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  logout: 'M9 3H4v18h5 M13 7l5 5-5 5 M7 12h11',
  search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 7v5l3 2',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  arrow: 'M4 12h16 M14 6l6 6-6 6',
  tools: 'M3 7h18 M6 3v8 M18 3v8 M3 17h18 M12 13v8',
  phone: 'M7 4l3 4-2 2c1 3 3 5 6 6l2-2 4 3c-1 4-5 4-10 0S3 8 7 4'
}
export default function Icon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.dashboard} /></svg>
}
