import React, { useState } from 'react';
import { Box, Card, Chip, Slider, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

interface PostScheduleSettingsProps {
  frequency: number;
  postTimes: string[];
  onFrequencyChange: (frequency: number) => void;
  onPostTimesChange: (times: string[]) => void;
}

const AVAILABLE_TIME_SLOTS = [
  '06:00',
  '09:00',
  '12:00',
  '15:00',
  '18:00',
  '21:00',
  '23:00'
];

export const PostScheduleSettings: React.FC<PostScheduleSettingsProps> = ({
  frequency,
  postTimes,
  onFrequencyChange,
  onPostTimesChange
}) => {
  const [localFrequency, setLocalFrequency] = useState(frequency);

  const handleFrequencyChange = (_event: Event, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    setLocalFrequency(value);
  };

  const handleFrequencyCommit = () => {
    onFrequencyChange(localFrequency);
  };

  const handleTimeToggle = (time: string) => {
    const isActive = postTimes.includes(time);
    let newTimes: string[];

    if (isActive) {
      newTimes = postTimes.filter(t => t !== time);
    } else {
      newTimes = [...postTimes, time].sort();
    }

    onPostTimesChange(newTimes);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
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
          <Calendar size={20} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            投稿頻度設定
          </Typography>
        </Box>

        {/* 投稿頻度スライダー */}
        <Box sx={{ mb: 3.5 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, fontWeight: 500 }}
          >
            1日の投稿回数
          </Typography>
          <Box sx={{ px: 1 }}>
            <Slider
              value={localFrequency}
              onChange={handleFrequencyChange}
              onChangeCommitted={handleFrequencyCommit}
              min={3}
              max={5}
              step={1}
              marks
              valueLabelDisplay="off"
              sx={{
                color: '#1DA1F2',
                height: 10,
                '& .MuiSlider-track': {
                  border: 'none',
                  background: 'linear-gradient(90deg, #1DA1F2 0%, #0E7FC7 100%)'
                },
                '& .MuiSlider-thumb': {
                  width: 28,
                  height: 28,
                  backgroundColor: '#1DA1F2',
                  boxShadow: '0 2px 6px rgba(29, 161, 242, 0.4)',
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 4px 12px rgba(29, 161, 242, 0.5)'
                  }
                },
                '& .MuiSlider-rail': {
                  backgroundColor: '#F3F4F6',
                  opacity: 1
                }
              }}
            />
            <Typography
              variant="h5"
              sx={{
                textAlign: 'center',
                color: '#1DA1F2',
                fontWeight: 700,
                mt: 1.5,
                fontFamily: 'SF Mono, Monaco, monospace'
              }}
            >
              {localFrequency}回/日
            </Typography>
          </Box>
        </Box>

        {/* 投稿時間帯選択 */}
        <Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, fontWeight: 500 }}
          >
            投稿時間帯
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {AVAILABLE_TIME_SLOTS.map((time, index) => {
              const isActive = postTimes.includes(time);
              return (
                <motion.div
                  key={time}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Chip
                    label={time}
                    onClick={() => handleTimeToggle(time)}
                    sx={{
                      py: 2.5,
                      px: 3,
                      fontSize: '16px',
                      fontWeight: 600,
                      fontFamily: 'SF Mono, Monaco, monospace',
                      border: '2px solid',
                      borderColor: isActive ? '#1DA1F2' : '#E5E7EB',
                      bgcolor: isActive
                        ? 'rgba(29, 161, 242, 1)'
                        : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#6B7280',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isActive
                        ? '0 4px 12px rgba(29, 161, 242, 0.4)'
                        : 'none',
                      '&:hover': {
                        bgcolor: isActive
                          ? 'rgba(29, 161, 242, 0.9)'
                          : '#F0F9FF',
                        borderColor: '#1DA1F2',
                        transform: 'translateY(-2px)',
                        boxShadow: isActive
                          ? '0 6px 16px rgba(29, 161, 242, 0.5)'
                          : '0 2px 8px rgba(29, 161, 242, 0.2)'
                      }
                    }}
                  />
                </motion.div>
              );
            })}
          </Box>
        </Box>
      </Card>
    </motion.div>
  );
};
