// テーマ2: ダイナミック - グラデーション、大胆な配色、活力あるデザイン
export const palette = {
  primary: {
    main: '#1DA1F2', // Xブルー
    light: '#4AB3F4',
    dark: '#0C8BD9',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#A855F7', // 紫（グラデーション用）
    light: '#C084FC',
    dark: '#9333EA',
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#10B981', // 緑
    light: '#34D399',
    dark: '#059669',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#F59E0B', // オレンジ
    light: '#FBBF24',
    dark: '#D97706',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#EF4444', // 赤
    light: '#F87171',
    dark: '#DC2626',
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#3B82F6', // 青
    light: '#60A5FA',
    dark: '#2563EB',
    contrastText: '#FFFFFF',
  },
  grey: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  background: {
    default: '#F9FAFB', // 明るい背景
    paper: '#FFFFFF', // カード背景（白）
  },
  text: {
    primary: '#1F2937', // ダークグレー
    secondary: '#6B7280', // グレー
    disabled: '#9CA3AF',
  },
  divider: 'rgba(0, 0, 0, 0.12)',
  // カスタムカラー（グラデーション用）
  gradient: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    accent: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
};

// TypeScript型定義用
declare module '@mui/material/styles' {
  interface Palette {
    gradient: {
      primary: string;
      secondary: string;
      accent: string;
    };
  }
  interface PaletteOptions {
    gradient?: {
      primary?: string;
      secondary?: string;
      accent?: string;
    };
  }
}
