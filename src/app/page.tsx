/**
 * Home Page
 *
 * Next.js 14 App Routerのホームページ
 */

export default function Home() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Xフォロワーメーカー</h1>
      <p>バックエンドAPIサーバーが起動しています</p>
      <p>ポート: 8432</p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><a href="/api/auth/signin">認証 (/api/auth/*)</a></li>
        <li>Twitter OAuth URL: GET /api/twitter/auth/url</li>
        <li>Twitter連携解除: POST /api/twitter/disconnect</li>
      </ul>
    </main>
  );
}
