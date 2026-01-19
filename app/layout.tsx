
import React from 'react';
import './globals.css';

export const metadata = {
  title: 'LuminaLink | Image to Link',
  description: 'Generate high-speed public links for your images instantly.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  );
}
