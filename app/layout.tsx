import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://hogun-nv.github.io/trip_plan/guide/'),
  title: 'The City Index — 뉴욕 취향 가이드',
  description: '맛집, 관광, 문화, 쇼핑, 근교 여행을 사진과 지도로 탐색하는 2026 뉴욕 현장 가이드.',
  openGraph: {
    title: 'The City Index — 뉴욕 취향 가이드',
    description: '두 사람을 위한 사진 중심 뉴욕 현장 가이드.',
    type: 'website',
    images: [{ url: 'og.png', width: 1200, height: 630, alt: 'The City Index — New York' }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
