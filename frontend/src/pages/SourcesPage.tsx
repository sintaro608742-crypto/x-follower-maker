import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import { MainLayout } from '@/layouts/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link,
  Trash2,
  FileText,
  BookOpen,
  MessageCircle,
  Quote,
  Sparkles,
  ExternalLink,
  Calendar,
  Globe,
  Upload,
  FolderOpen,
  Download,
  PlusCircle,
  Library,
  CheckCircle,
  Edit,
  CalendarPlus,
} from 'lucide-react';
import { SourcesService } from '@/services/api/SourcesService';
import { PostsService } from '@/services/api/PostsService';
import type {
  Source,
  GeneratedPost,
  GenerationStyle,
  SourceListResponse,
} from '@/types';
import { logger } from '@/lib/logger';

const sourcesService = new SourcesService();
const postsService = new PostsService();

// 生成スタイル定義
const GENERATION_STYLES = [
  {
    id: 'summary' as const,
    title: '要約・解説型',
    description: 'ソースの内容をわかりやすく要約して伝える',
    icon: BookOpen,
    color: '#10B981',
  },
  {
    id: 'opinion' as const,
    title: '意見・考察型',
    description: 'ソースを踏まえた自分の意見や考察を発信',
    icon: MessageCircle,
    color: '#8B5CF6',
  },
  {
    id: 'quote' as const,
    title: '引用＋補足型',
    description: '重要なポイントを引用し、補足説明を加える',
    icon: Quote,
    color: '#F59E0B',
  },
];

// 生成数オプション
const COUNT_OPTIONS = [1, 3, 5, 10];

export const SourcesPage = () => {
  // State
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // URL Input State
  const [urlInput, setUrlInput] = useState('');
  const [addingSource, setAddingSource] = useState(false);

  // Selected Source State
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);

  // Generation State
  const [generateStyle, setGenerateStyle] = useState<GenerationStyle>('summary');
  const [generateCount, setGenerateCount] = useState(3);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  // Delete Confirmation Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<Source | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Snackbar State
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Edit Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<GeneratedPost | null>(null);
  const [editContent, setEditContent] = useState('');

  // Schedule Dialog State
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [schedulingPost, setSchedulingPost] = useState<GeneratedPost | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduling, setScheduling] = useState(false);

  // Load sources
  const loadSources = useCallback(async () => {
    try {
      setLoading(true);
      const response: SourceListResponse = await sourcesService.getList();
      setSources(response.sources);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to load sources', { error: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  // Show snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Handle URL submission
  const handleAddSource = async () => {
    if (!urlInput.trim()) {
      showSnackbar('URLを入力してください', 'error');
      return;
    }

    try {
      setAddingSource(true);
      const response = await sourcesService.createFromUrl({
        url: urlInput.trim(),
      });

      setSources((prev) => [response.source, ...prev]);
      setUrlInput('');
      showSnackbar(response.message);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      showSnackbar(error.message, 'error');
    } finally {
      setAddingSource(false);
    }
  };

  // Handle source selection for generation
  const handleSelectForGeneration = async (source: Source) => {
    try {
      setSelectedSource(source);
      const response = await sourcesService.getById(source.id);
      setGeneratedPosts(response.generated_posts);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      showSnackbar(error.message, 'error');
    }
  };

  // Handle source deletion
  const handleDeleteClick = (source: Source, e: React.MouseEvent) => {
    e.stopPropagation();
    setSourceToDelete(source);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sourceToDelete) return;

    try {
      setDeleting(true);
      await sourcesService.delete(sourceToDelete.id);
      setSources((prev) => prev.filter((s) => s.id !== sourceToDelete.id));
      if (selectedSource?.id === sourceToDelete.id) {
        setSelectedSource(null);
        setGeneratedPosts([]);
      }
      showSnackbar('ソースを削除しました');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      showSnackbar(error.message, 'error');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSourceToDelete(null);
    }
  };

  // Handle post generation
  const handleGeneratePosts = async () => {
    if (!selectedSource) return;

    try {
      setGenerating(true);
      const response = await sourcesService.generatePosts(selectedSource.id, {
        style: generateStyle,
        count: generateCount,
        custom_prompt: customPrompt || undefined,
      });

      setGeneratedPosts((prev) => [...response.posts, ...prev]);
      showSnackbar(response.message);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      showSnackbar(error.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Handle edit post
  const handleEditClick = (post: GeneratedPost) => {
    setEditingPost(post);
    setEditContent(post.content);
    setEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!editingPost) return;

    // ローカルで投稿を更新
    setGeneratedPosts((prev) =>
      prev.map((p) =>
        p.id === editingPost.id
          ? { ...p, content: editContent, char_count: editContent.length }
          : p
      )
    );

    setEditDialogOpen(false);
    setEditingPost(null);
    setEditContent('');
    showSnackbar('投稿を編集しました');
  };

  // Handle schedule post (投稿予約)
  const handleScheduleClick = (post: GeneratedPost) => {
    setSchedulingPost(post);
    // デフォルトで明日の同じ時間を設定
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split('T')[0]);
    setScheduleTime('12:00');
    setScheduleDialogOpen(true);
  };

  const handleScheduleConfirm = async () => {
    if (!schedulingPost || !scheduleDate || !scheduleTime) return;

    try {
      setScheduling(true);
      // 日本時間（JST）としてDateオブジェクトを作成し、ISO8601形式に変換
      const localDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
      const scheduledAt = localDateTime.toISOString();
      await postsService.create(schedulingPost.content, scheduledAt);

      setScheduleDialogOpen(false);
      setSchedulingPost(null);
      setScheduleDate('');
      setScheduleTime('');
      showSnackbar('投稿を予約しました');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      showSnackbar(error.message, 'error');
    } finally {
      setScheduling(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Get source icon based on type
  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'url':
        return { icon: Globe, color: '#3B82F6', bgColor: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' };
      case 'pdf':
        return { icon: FileText, color: '#EF4444', bgColor: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' };
      case 'docx':
        return { icon: FileText, color: '#2563EB', bgColor: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' };
      case 'txt':
      case 'md':
        return { icon: FileText, color: '#6B7280', bgColor: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)' };
      default:
        return { icon: FileText, color: '#6B7280', bgColor: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)' };
    }
  };

  // Get style badge color
  const getStyleBadgeColor = (style: GenerationStyle) => {
    switch (style) {
      case 'summary':
        return { bg: '#D1FAE5', color: '#059669' };
      case 'opinion':
        return { bg: '#EDE9FE', color: '#7C3AED' };
      case 'quote':
        return { bg: '#FEF3C7', color: '#D97706' };
      default:
        return { bg: '#E5E7EB', color: '#6B7280' };
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error.message}
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        {/* Page Header */}
        <Box sx={{ mb: 4, pb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 800,
                color: '#111827',
              }}
            >
              ソースライブラリ
            </Typography>
            <Chip
              label="BETA"
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '10px',
              }}
            />
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            WebサイトやファイルからAIが深い洞察を持った投稿を生成します
          </Typography>
        </Box>

        {/* Source Upload Card */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}
          >
            <PlusCircle size={20} />
            ソースを追加
          </Typography>

          <Box sx={{ display: 'flex', gap: 2.5 }}>
            {/* URL Input Box */}
            <Box
              sx={{
                flex: 1,
                border: '2px dashed #D1D5DB',
                borderRadius: 3,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: '#FAFBFC',
                '&:hover': {
                  borderColor: '#1DA1F2',
                  background: '#F0F9FF',
                },
              }}
            >
              <Box sx={{ color: '#1DA1F2', mb: 2 }}>
                <Link size={48} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1F2937', mb: 1 }}>
                URLから追加
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                ブログ記事、ニュース、WebサイトのURLを入力
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="https://example.com/article"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={addingSource}
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddSource}
                  disabled={addingSource || !urlInput.trim()}
                  sx={{
                    background: 'linear-gradient(135deg, #1DA1F2 0%, #0E7FC7 100%)',
                    fontWeight: 600,
                    px: 2,
                    borderRadius: 2,
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0E7FC7 0%, #0B5D91 100%)',
                    },
                  }}
                >
                  {addingSource ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : (
                    <>
                      <Download size={16} style={{ marginRight: 4 }} />
                      取得
                    </>
                  )}
                </Button>
              </Box>
            </Box>

            {/* File Upload Box */}
            <Box
              sx={{
                flex: 1,
                border: '2px dashed #D1D5DB',
                borderRadius: 3,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: '#FAFBFC',
                '&:hover': {
                  borderColor: '#1DA1F2',
                  background: '#F0F9FF',
                },
              }}
            >
              <Box sx={{ color: '#1DA1F2', mb: 2 }}>
                <Upload size={48} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1F2937', mb: 1 }}>
                ファイルをアップロード
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                PDF、Word、テキストファイルをドラッグ&ドロップ
              </Typography>
              <Button
                variant="outlined"
                sx={{
                  borderColor: '#1DA1F2',
                  color: '#1DA1F2',
                  fontWeight: 600,
                  borderRadius: 2,
                  '&:hover': {
                    background: '#F0F9FF',
                  },
                }}
              >
                <FolderOpen size={16} style={{ marginRight: 4 }} />
                ファイルを選択
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                対応形式: PDF, DOCX, TXT, MD（最大50MB）
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Source Library */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Library size={20} />
              登録済みソース
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {sources.length}件
            </Typography>
          </Box>

          {sources.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: '#6B7280' }}>
              <FileText size={64} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#4B5563', mb: 1 }}>
                ソースがありません
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                URLまたはファイルからソースを追加してください
              </Typography>
            </Box>
          ) : (
            <Box>
              <AnimatePresence>
                {sources.map((source) => {
                  const iconInfo = getSourceIcon(source.source_type);
                  const IconComponent = iconInfo.icon;
                  return (
                    <motion.div
                      key={source.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <Card
                        sx={{
                          mb: 2,
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: 2,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.12)',
                          },
                        }}
                      >
                        <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2.5, '&:last-child': { pb: 2.5 } }}>
                          {/* Source Icon */}
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              background: iconInfo.bgColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <IconComponent size={24} color="#FFFFFF" />
                          </Box>

                          {/* Source Content */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 600,
                                color: '#1F2937',
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {source.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                              {source.source_url && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Link size={12} />
                                  {new URL(source.source_url).hostname}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <FileText size={12} />
                                {source.word_count.toLocaleString()}文字
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Calendar size={12} />
                                {formatDate(source.created_at)} 追加
                              </Typography>
                            </Box>
                            {source.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  lineHeight: 1.5,
                                }}
                              >
                                {source.description}
                              </Typography>
                            )}
                          </Box>

                          {/* Source Actions */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleSelectForGeneration(source)}
                              sx={{
                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                fontWeight: 600,
                                px: 2,
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                },
                              }}
                            >
                              <Sparkles size={14} style={{ marginRight: 4 }} />
                              生成
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              color="inherit"
                              onClick={(e) => handleDeleteClick(source, e)}
                              sx={{
                                borderColor: '#E5E7EB',
                                color: '#6B7280',
                                '&:hover': {
                                  borderColor: '#EF4444',
                                  color: '#EF4444',
                                  background: '#FEF2F2',
                                },
                              }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </Box>
          )}
        </Paper>

        {/* Generation Section */}
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
          >
            <Sparkles size={20} />
            投稿を生成
          </Typography>

          {selectedSource ? (
            <>
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                  border: '2px solid #BAE6FD',
                  borderRadius: 3,
                  p: 3,
                  mb: 3,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#0369A1', mb: 2 }}>
                  「{selectedSource.title}」から投稿を生成
                </Typography>

                {/* Style Selector */}
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#4B5563', mb: 2 }}>
                  生成スタイルを選択
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
                  {GENERATION_STYLES.map((style) => (
                    <Box
                      key={style.id}
                      onClick={() => setGenerateStyle(style.id)}
                      sx={{
                        flex: 1,
                        background: generateStyle === style.id
                          ? 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)'
                          : '#FFFFFF',
                        border: generateStyle === style.id ? '2px solid #1DA1F2' : '2px solid #E5E7EB',
                        borderRadius: 2,
                        p: 2.5,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'center',
                        boxShadow: generateStyle === style.id ? '0 4px 12px rgba(29, 161, 242, 0.3)' : 'none',
                        '&:hover': {
                          borderColor: '#1DA1F2',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${style.color} 0%, ${style.color}dd 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px',
                        }}
                      >
                        <style.icon size={20} color="#FFFFFF" />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937', mb: 0.5 }}>
                        {style.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {style.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Count Selector */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#4B5563' }}>
                    生成する投稿数:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {COUNT_OPTIONS.map((count) => (
                      <Button
                        key={count}
                        variant={generateCount === count ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setGenerateCount(count)}
                        sx={{
                          minWidth: 40,
                          height: 40,
                          fontWeight: 600,
                          ...(generateCount === count
                            ? {
                                background: 'linear-gradient(135deg, #1DA1F2 0%, #0E7FC7 100%)',
                              }
                            : {
                                borderColor: '#E5E7EB',
                                color: '#4B5563',
                                '&:hover': {
                                  borderColor: '#1DA1F2',
                                  background: '#F0F9FF',
                                },
                              }),
                        }}
                      >
                        {count}
                      </Button>
                    ))}
                  </Box>
                </Box>

                {/* Custom Prompt */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#4B5563', mb: 1 }}>
                    カスタム指示（任意）:
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="例：初心者向けに分かりやすく、絵文字を多めに使って明るいトーンで書いてください"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        background: '#FFFFFF',
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    生成内容に関する追加の指示やリクエストを自由に記述できます
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleGeneratePosts}
                  disabled={generating}
                  sx={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    fontWeight: 700,
                    py: 1.5,
                    borderRadius: 2,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 16px rgba(16, 185, 129, 0.4)',
                    },
                  }}
                >
                  {generating ? (
                    <>
                      <CircularProgress size={20} sx={{ color: '#fff', mr: 1 }} />
                      AIが投稿を生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} style={{ marginRight: 8 }} />
                      AIで投稿を生成
                    </>
                  )}
                </Button>
              </Box>

              {/* Generated Posts */}
              {generatedPosts.length > 0 && (
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
                  >
                    <CheckCircle size={18} color="#10B981" />
                    生成された投稿（{generatedPosts.length}件）
                  </Typography>
                  {generatedPosts.map((post) => {
                    const badgeColor = getStyleBadgeColor(post.style);
                    const styleInfo = GENERATION_STYLES.find((s) => s.id === post.style);
                    return (
                      <Card
                        key={post.id}
                        sx={{
                          mb: 2,
                          backgroundColor: '#FFFFFF',
                          border: '2px solid #E5E7EB',
                          borderRadius: 2,
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: '#1DA1F2',
                            boxShadow: '0 4px 12px rgba(29, 161, 242, 0.15)',
                          },
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Chip
                              icon={styleInfo ? <styleInfo.icon size={12} /> : undefined}
                              label={styleInfo?.title || post.style}
                              size="small"
                              sx={{
                                background: badgeColor.bg,
                                color: badgeColor.color,
                                fontWeight: 600,
                                '& .MuiChip-icon': { color: badgeColor.color },
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {post.char_count}/280文字
                            </Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              lineHeight: 1.6,
                              mb: 2,
                            }}
                          >
                            {post.content}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleEditClick(post)}
                              sx={{
                                borderColor: '#E5E7EB',
                                color: '#4B5563',
                                '&:hover': {
                                  borderColor: '#1DA1F2',
                                  background: '#F0F9FF',
                                },
                              }}
                            >
                              <Edit size={14} style={{ marginRight: 4 }} />
                              編集
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleScheduleClick(post)}
                              sx={{
                                background: 'linear-gradient(135deg, #1DA1F2 0%, #0E7FC7 100%)',
                                fontWeight: 600,
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #0E7FC7 0%, #0B5D91 100%)',
                                },
                              }}
                            >
                              <CalendarPlus size={14} style={{ marginRight: 4 }} />
                              投稿予約
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </>
          ) : (
            <Box
              sx={{
                textAlign: 'center',
                py: 6,
                px: 3,
                background: '#F9FAFB',
                borderRadius: 2,
                border: '2px dashed #E5E7EB',
              }}
            >
              <Sparkles size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#4B5563', mb: 1 }}>
                ソースを選択してください
              </Typography>
              <Typography variant="body2" color="text.secondary">
                上のリストからソースの「生成」ボタンをクリックして投稿を生成します
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>ソースを削除</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              「{sourceToDelete?.title}」を削除しますか？
              <br />
              この操作は取り消せません。関連する生成投稿も削除されます。
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
              キャンセル
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
              {deleting ? <CircularProgress size={20} /> : '削除する'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Post Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Edit size={20} />
            投稿を編集
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="投稿内容を編集..."
              sx={{
                mt: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: editContent.length > 280 ? '#EF4444' : '#6B7280',
                }}
              >
                {editContent.length}/280文字
              </Typography>
              {editContent.length > 280 && (
                <Typography variant="caption" color="error">
                  280文字を超えています
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => {
                setEditDialogOpen(false);
                setEditingPost(null);
                setEditContent('');
              }}
              color="inherit"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleEditSave}
              variant="contained"
              disabled={editContent.length === 0 || editContent.length > 280}
              sx={{
                background: 'linear-gradient(135deg, #1DA1F2 0%, #0E7FC7 100%)',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(135deg, #0E7FC7 0%, #0B5D91 100%)',
                },
              }}
            >
              保存
            </Button>
          </DialogActions>
        </Dialog>

        {/* Schedule Post Dialog */}
        <Dialog
          open={scheduleDialogOpen}
          onClose={() => !scheduling && setScheduleDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarPlus size={20} />
            投稿を予約
          </DialogTitle>
          <DialogContent>
            {schedulingPost && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  予約する投稿内容：
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    background: '#F9FAFB',
                    borderRadius: 2,
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {schedulingPost.content}
                  </Typography>
                </Box>
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="投稿日"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0],
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
              <TextField
                label="投稿時間"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => {
                setScheduleDialogOpen(false);
                setSchedulingPost(null);
                setScheduleDate('');
                setScheduleTime('');
              }}
              color="inherit"
              disabled={scheduling}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleScheduleConfirm}
              variant="contained"
              disabled={scheduling || !scheduleDate || !scheduleTime}
              sx={{
                background: 'linear-gradient(135deg, #1DA1F2 0%, #0E7FC7 100%)',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(135deg, #0E7FC7 0%, #0B5D91 100%)',
                },
              }}
            >
              {scheduling ? (
                <>
                  <CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} />
                  予約中...
                </>
              ) : (
                '予約する'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </motion.div>
    </MainLayout>
  );
};

export default SourcesPage;
