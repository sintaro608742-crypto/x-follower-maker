import type { Components, Theme } from '@mui/material/styles';

export const components: Components<Omit<Theme, 'components'>> = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '12px 24px',
        height: 44,
        fontWeight: 500,
        boxShadow: 'none',
        transition: 'all 0.2s ease-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        '&:active': {
          transform: 'scale(0.98)',
        },
      },
      containedPrimary: {
        background: 'linear-gradient(135deg, #1DA1F2 0%, #A855F7 100%)',
        '&:hover': {
          background: 'linear-gradient(135deg, #0C8BD9 0%, #9333EA 100%)',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease-out',
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        backgroundImage: 'none',
      },
      elevation1: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      },
      elevation2: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
      },
      elevation3: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
          '&.Mui-focused': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontWeight: 500,
      },
      filled: {
        backgroundColor: 'rgba(29, 161, 242, 0.2)',
        color: '#4AB3F4',
        border: '1px solid rgba(29, 161, 242, 0.4)',
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        transition: 'all 0.2s ease-out',
        '&:hover': {
          transform: 'scale(1.1)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        // ライトテーマ対応: 削除してpaletteの設定を使用
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        // ライトテーマ対応: 削除してpaletteの設定を使用
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        margin: '4px 8px',
        transition: 'all 0.2s ease-out',
        '&:hover': {
          backgroundColor: 'rgba(29, 161, 242, 0.1)',
          transform: 'translateX(4px)',
        },
        '&.Mui-selected': {
          background: 'linear-gradient(90deg, rgba(29, 161, 242, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
          borderLeft: '3px solid #1DA1F2',
          '&:hover': {
            background: 'linear-gradient(90deg, rgba(29, 161, 242, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)',
          },
        },
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
      bar: {
        borderRadius: 4,
        background: 'linear-gradient(90deg, #1DA1F2 0%, #A855F7 100%)',
      },
    },
  },
};
