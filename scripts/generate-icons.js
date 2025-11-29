import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// おしゃれなPWAアイコンSVG（グラデーション + 上昇矢印 + 人のシルエット）
const iconSVG = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- グラデーション背景: Xブルーからライトブルー -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1DA1F2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4FC3F7;stop-opacity:1" />
    </linearGradient>

    <!-- アイコングラデーション: 白からライトブルー -->
    <linearGradient id="iconGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#E3F2FD;stop-opacity:0.9" />
    </linearGradient>

    <!-- 影効果 -->
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
      <feOffset dx="0" dy="4" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- 角丸背景 -->
  <rect width="512" height="512" rx="100" ry="100" fill="url(#bgGradient)"/>

  <!-- メインアイコングループ -->
  <g filter="url(#shadow)">
    <!-- 上昇する人のシルエット（3人） -->
    <!-- 一番下の人（小さめ、薄め） -->
    <circle cx="160" cy="340" r="22" fill="url(#iconGradient)" opacity="0.6"/>
    <path d="M 160 365 L 145 430 M 160 365 L 175 430 M 160 365 L 160 395 M 145 395 L 175 395"
          stroke="url(#iconGradient)" stroke-width="16" stroke-linecap="round" opacity="0.6"/>

    <!-- 真ん中の人（中サイズ） -->
    <circle cx="220" cy="280" r="26" fill="url(#iconGradient)" opacity="0.8"/>
    <path d="M 220 310 L 200 385 M 220 310 L 240 385 M 220 310 L 220 345 M 200 345 L 240 345"
          stroke="url(#iconGradient)" stroke-width="18" stroke-linecap="round" opacity="0.8"/>

    <!-- 一番上の人（大きめ、はっきり） -->
    <circle cx="280" cy="200" r="30" fill="url(#iconGradient)"/>
    <path d="M 280 235 L 255 320 M 280 235 L 305 320 M 280 235 L 280 275 M 255 275 L 305 275"
          stroke="url(#iconGradient)" stroke-width="20" stroke-linecap="round"/>

    <!-- 上昇矢印（右上に向かう） -->
    <path d="M 320 340 L 420 180"
          stroke="url(#iconGradient)" stroke-width="24" stroke-linecap="round"/>
    <path d="M 420 180 L 380 195 M 420 180 L 405 220"
          stroke="url(#iconGradient)" stroke-width="24" stroke-linecap="round"/>

    <!-- 装飾的な上昇ライン -->
    <path d="M 140 380 Q 200 320, 260 240 Q 300 180, 380 120"
          stroke="#FFFFFF" stroke-width="3" fill="none" opacity="0.4" stroke-dasharray="10,10"/>
  </g>

  <!-- 輝きエフェクト -->
  <circle cx="400" cy="120" r="8" fill="#FFFFFF" opacity="0.8"/>
  <circle cx="420" cy="140" r="5" fill="#FFFFFF" opacity="0.6"/>
  <circle cx="380" cy="100" r="6" fill="#FFFFFF" opacity="0.7"/>
</svg>
`;

// Favicon用のシンプル版SVG
const faviconSVG = `
<svg width="32" height="32" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1DA1F2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4FC3F7;stop-opacity:1" />
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="100" ry="100" fill="url(#bgGradient)"/>

  <!-- シンプルな上昇矢印 -->
  <path d="M 180 380 L 330 180" stroke="#FFFFFF" stroke-width="40" stroke-linecap="round"/>
  <path d="M 330 180 L 270 210 M 330 180 L 300 240"
        stroke="#FFFFFF" stroke-width="40" stroke-linecap="round"/>

  <!-- 装飾的なドット -->
  <circle cx="200" cy="350" r="20" fill="#FFFFFF" opacity="0.7"/>
  <circle cx="250" cy="280" r="25" fill="#FFFFFF" opacity="0.8"/>
  <circle cx="300" cy="210" r="30" fill="#FFFFFF"/>
</svg>
`;

async function generateIcons() {
  console.log('🎨 PWAアイコンを生成しています...\n');

  const iconsDir = join(__dirname, '..', 'public', 'icons');

  // SVGをバッファに変換
  const svgBuffer = Buffer.from(iconSVG);
  const faviconSvgBuffer = Buffer.from(faviconSVG);

  try {
    // 192x192 (PWA用)
    console.log('📱 icon-192x192.png を生成中...');
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(join(iconsDir, 'icon-192x192.png'));
    console.log('✅ icon-192x192.png 完了\n');

    // 512x512 (PWA用)
    console.log('📱 icon-512x512.png を生成中...');
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(join(iconsDir, 'icon-512x512.png'));
    console.log('✅ icon-512x512.png 完了\n');

    // 180x180 (Apple Touch Icon用)
    console.log('🍎 apple-touch-icon.png を生成中...');
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(join(iconsDir, 'apple-touch-icon.png'));
    console.log('✅ apple-touch-icon.png 完了\n');

    // 32x32 (Favicon用 - シンプル版使用)
    console.log('🌐 favicon-32x32.png を生成中...');
    await sharp(faviconSvgBuffer)
      .resize(32, 32)
      .png()
      .toFile(join(iconsDir, 'favicon-32x32.png'));
    console.log('✅ favicon-32x32.png 完了\n');

    // 16x16 (Favicon用 - シンプル版使用)
    console.log('🌐 favicon-16x16.png を生成中...');
    await sharp(faviconSvgBuffer)
      .resize(16, 16)
      .png()
      .toFile(join(iconsDir, 'favicon-16x16.png'));
    console.log('✅ favicon-16x16.png 完了\n');

    // SVGファイルも保存
    console.log('📄 icon.svg を保存中...');
    writeFileSync(join(iconsDir, 'icon.svg'), iconSVG);
    console.log('✅ icon.svg 完了\n');

    console.log('🎉 全てのアイコンが正常に生成されました！\n');
    console.log('📁 保存先: /public/icons/\n');
    console.log('生成されたファイル:');
    console.log('  - icon-192x192.png (PWA)');
    console.log('  - icon-512x512.png (PWA)');
    console.log('  - apple-touch-icon.png (iOS)');
    console.log('  - favicon-32x32.png (ブラウザ)');
    console.log('  - favicon-16x16.png (ブラウザ)');
    console.log('  - icon.svg (ソース)\n');

    console.log('💡 次のステップ:');
    console.log('  1. index.html に以下を追加:');
    console.log('     <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png">');
    console.log('     <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png">');
    console.log('     <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">');
    console.log('  2. manifest.json (PWA設定) を作成してアイコンを登録\n');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

generateIcons();
