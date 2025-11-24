/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features
  experimental: {
    // Enable Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // TypeScript設定
  typescript: {
    // ビルド時の型チェックを有効化
    ignoreBuildErrors: false,
  },

  // ESLint設定
  eslint: {
    // ビルド時のESLintチェックを有効化
    ignoreDuringBuilds: false,
  },

  // 環境変数設定
  env: {
    // クライアント側で利用可能な環境変数はNEXT_PUBLIC_プレフィックスを使用
    // サーバー側のみの環境変数はプレフィックスなし
  },

  // セキュリティヘッダー
  async headers() {
    // 本番環境では同じドメインを使用するため、CORSヘッダーは不要
    // 開発環境のみCORSを有効化
    const isDev = process.env.NODE_ENV === 'development';
    const origin = process.env.CORS_ORIGIN || 'http://localhost:3247';

    return isDev ? [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: origin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Cookie',
          },
        ],
      },
    ] : [];
  },

  // リライトルール: フロントエンド（Vite）のルーティングをサポート
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        // APIルートは除外（Next.jsのAPIルートを優先）
        {
          source: '/:path*',
          has: [
            {
              type: 'header',
              key: 'x-skip-rewrite',
            },
          ],
          destination: '/:path*',
        },
      ],
      fallback: [],
    };
  },

};

export default nextConfig;
