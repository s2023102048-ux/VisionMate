import './globals.css';

export const metadata = {
  title: 'VisionMate — Real-Time PWD Accessibility Map',
  description: 'A crowdsourced real-time map helping wheelchair users and mobility-impaired individuals navigate safely.',
  icons: {
    icon: '/favicon.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'VisionMate',
    description: 'PWD Accessibility Map',
    images: [{ url: '/logo.png' }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
        />
    </head>
      <body>{children}</body>
    </html>
  );
}
