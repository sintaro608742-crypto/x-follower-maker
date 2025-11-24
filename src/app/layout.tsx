/**
 * Root Layout
 *
 * Next.js 14 App Routerのルートレイアウト
 */

export const metadata = {
  title: 'Xフォロワーメーカー',
  description: 'AI自動投稿でフォロワーを増やすサービス',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
