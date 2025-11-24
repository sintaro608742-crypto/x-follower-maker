import { createTheme } from '@mui/material/styles';
import { palette } from './palette';
import { typography } from './typography';
import { components } from './components';

export const theme = createTheme({
  palette: {
    mode: 'light',
    ...palette,
  },
  typography,
  components,
  shape: {
    borderRadius: 12,
  },
  spacing: 8, // 8の倍数システム
  shadows: [
    'none',
    '0 2px 4px rgba(0,0,0,0.2)',
    '0 4px 8px rgba(0,0,0,0.25)',
    '0 8px 16px rgba(0,0,0,0.3)',
    '0 12px 24px rgba(0,0,0,0.35)',
    '0 16px 32px rgba(0,0,0,0.4)',
    '0 20px 40px rgba(0,0,0,0.45)',
    '0 24px 48px rgba(0,0,0,0.5)',
    '0 2px 4px rgba(0,0,0,0.2)',
    '0 4px 8px rgba(0,0,0,0.25)',
    '0 8px 16px rgba(0,0,0,0.3)',
    '0 12px 24px rgba(0,0,0,0.35)',
    '0 16px 32px rgba(0,0,0,0.4)',
    '0 20px 40px rgba(0,0,0,0.45)',
    '0 24px 48px rgba(0,0,0,0.5)',
    '0 2px 4px rgba(0,0,0,0.2)',
    '0 4px 8px rgba(0,0,0,0.25)',
    '0 8px 16px rgba(0,0,0,0.3)',
    '0 12px 24px rgba(0,0,0,0.35)',
    '0 16px 32px rgba(0,0,0,0.4)',
    '0 20px 40px rgba(0,0,0,0.45)',
    '0 24px 48px rgba(0,0,0,0.5)',
    '0 2px 4px rgba(0,0,0,0.2)',
    '0 4px 8px rgba(0,0,0,0.25)',
    '0 8px 16px rgba(0,0,0,0.3)',
  ],
});

export default theme;
