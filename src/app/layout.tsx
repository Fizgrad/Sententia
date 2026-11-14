import type { Metadata, Viewport } from 'next';
import { assetPath } from '@/lib/asset-path';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sententia · 拾句 — 让词汇在语境中生根',
  description: '有外刊阅读质感的雅思语境记忆工具。在阅读中拾句，用主动提取留住记忆。',
  manifest: assetPath('/manifest.webmanifest'),
  icons: { icon: assetPath('/icon.svg'), apple: assetPath('/icon.svg') },
  appleWebApp: { capable: true, title: '拾句', statusBarStyle: 'default' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#faf9f6' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=localStorage.getItem('sententia-theme')||'light'}catch{}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
