import React, { useState } from 'react';
import { Box, Card, Chip, Typography, TextField, IconButton, InputAdornment } from '@mui/material';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Code,
  Palette,
  TrendingUp,
  Heart,
  DollarSign,
  Tag,
  Plus,
  X
} from 'lucide-react';
import type { PresetKeyword } from '@/types';

interface KeywordSelectorProps {
  selectedKeywords: string[];
  onKeywordToggle: (keyword: string) => void;
  maxSelection?: number;
}

const PRESET_KEYWORDS: PresetKeyword[] = [
  { id: 'business', label: 'ビジネス・起業', icon: 'briefcase' },
  { id: 'programming', label: 'プログラミング・技術', icon: 'code' },
  { id: 'design', label: 'デザイン・クリエイティブ', icon: 'palette' },
  { id: 'marketing', label: 'マーケティング・SNS', icon: 'trending-up' },
  { id: 'health', label: '筋トレ・健康', icon: 'heart' },
  { id: 'investment', label: '投資・副業', icon: 'dollar-sign' }
];

const PRESET_LABELS = PRESET_KEYWORDS.map(k => k.label);

const getIcon = (iconName: string, size = 16) => {
  const iconMap: Record<string, React.ReactElement> = {
    briefcase: <Briefcase size={size} />,
    code: <Code size={size} />,
    palette: <Palette size={size} />,
    'trending-up': <TrendingUp size={size} />,
    heart: <Heart size={size} />,
    'dollar-sign': <DollarSign size={size} />
  };
  return iconMap[iconName] || <Tag size={size} />;
};

export const KeywordSelector: React.FC<KeywordSelectorProps> = ({
  selectedKeywords,
  onKeywordToggle,
  maxSelection = 3
}) => {
  const [customInput, setCustomInput] = useState('');

  const isSelected = (keyword: string) => selectedKeywords.includes(keyword);
  const canSelectMore = selectedKeywords.length < maxSelection;

  // カスタムキーワード（プリセット以外）を抽出
  const customKeywords = selectedKeywords.filter(k => !PRESET_LABELS.includes(k));

  const handleToggle = (keyword: string) => {
    if (isSelected(keyword) || canSelectMore) {
      onKeywordToggle(keyword);
    }
  };

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selectedKeywords.includes(trimmed) && canSelectMore) {
      onKeywordToggle(trimmed);
      setCustomInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card
        sx={{
          p: 3.5,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%)',
          borderRadius: 2,
          boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
          <Tag size={20} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            興味関心キーワード
          </Typography>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, fontWeight: 500 }}
        >
          プリセットから選択（最大{maxSelection}つ）
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
          {PRESET_KEYWORDS.map((keyword, index) => {
            const selected = isSelected(keyword.label);
            return (
              <motion.div
                key={keyword.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Chip
                  icon={getIcon(keyword.icon)}
                  label={keyword.label}
                  onClick={() => handleToggle(keyword.label)}
                  className={selected ? 'selected' : ''}
                  data-testid={`keyword-chip-${keyword.id}`}
                  sx={{
                    py: 2.5,
                    px: 2.5,
                    fontSize: '14px',
                    fontWeight: 600,
                    border: '2px solid',
                    borderColor: selected ? '#1DA1F2' : '#E5E7EB',
                    bgcolor: selected
                      ? 'rgba(29, 161, 242, 1)'
                      : '#FFFFFF',
                    color: selected ? '#FFFFFF' : '#6B7280',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: selected
                      ? '0 4px 12px rgba(29, 161, 242, 0.4)'
                      : 'none',
                    '&:hover': {
                      bgcolor: selected
                        ? 'rgba(29, 161, 242, 0.9)'
                        : '#F0F9FF',
                      borderColor: '#1DA1F2',
                      transform: 'translateY(-2px)',
                      boxShadow: selected
                        ? '0 6px 16px rgba(29, 161, 242, 0.5)'
                        : '0 2px 8px rgba(29, 161, 242, 0.2)'
                    },
                    '& .MuiChip-icon': {
                      color: selected ? '#FFFFFF' : '#6B7280'
                    }
                  }}
                />
              </motion.div>
            );
          })}
        </Box>

        {/* カスタムキーワード入力 */}
        <Box sx={{ mt: 3 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.5, fontWeight: 500 }}
          >
            カスタムキーワードを追加
          </Typography>
          <TextField
            size="small"
            placeholder="例: AI、料理、旅行..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!canSelectMore}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleAddCustom}
                    disabled={!canSelectMore || !customInput.trim()}
                    size="small"
                    sx={{
                      bgcolor: canSelectMore && customInput.trim() ? '#1DA1F2' : 'transparent',
                      color: canSelectMore && customInput.trim() ? '#FFFFFF' : '#9CA3AF',
                      '&:hover': {
                        bgcolor: canSelectMore && customInput.trim() ? '#1A91DA' : 'transparent',
                      },
                      '&.Mui-disabled': {
                        color: '#D1D5DB',
                      },
                    }}
                  >
                    <Plus size={18} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              width: '100%',
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: '#1DA1F2',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1DA1F2',
                },
              },
            }}
          />
        </Box>

        {/* カスタムキーワード表示 */}
        {customKeywords.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1, fontWeight: 500, fontSize: '0.75rem' }}
            >
              追加したキーワード
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {customKeywords.map((keyword) => (
                <Chip
                  key={keyword}
                  label={keyword}
                  icon={<Tag size={14} />}
                  onDelete={() => onKeywordToggle(keyword)}
                  deleteIcon={<X size={14} />}
                  sx={{
                    py: 2,
                    px: 1.5,
                    fontSize: '13px',
                    fontWeight: 600,
                    border: '2px solid #10B981',
                    bgcolor: '#10B981',
                    color: '#FFFFFF',
                    '& .MuiChip-icon': {
                      color: '#FFFFFF'
                    },
                    '& .MuiChip-deleteIcon': {
                      color: 'rgba(255,255,255,0.7)',
                      '&:hover': {
                        color: '#FFFFFF',
                      },
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* 選択数表示 */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 2,
            color: canSelectMore ? 'text.secondary' : '#EF4444',
            fontWeight: 500,
          }}
        >
          {selectedKeywords.length}/{maxSelection} 選択中
          {!canSelectMore && ' （上限に達しています）'}
        </Typography>
      </Card>
    </motion.div>
  );
};
