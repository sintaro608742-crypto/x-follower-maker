import { useState, useEffect } from 'react';
import { PostsService } from '@/services/api/PostsService';
import type { Post, PostFilter, PostDateGroup, PostUpdateRequest } from '@/types';
import { logger } from '@/lib/logger';

const service = new PostsService();

export const usePostsData = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [filter, setFilter] = useState<PostFilter>('today');

  const fetchPosts = async () => {
    try {
      setLoading(true);
      logger.debug('Fetching posts', { hookName: 'usePostsData' });

      const result = await service.getList();
      setPosts(result);

      // 最初の投稿を自動選択
      if (result.length > 0 && !selectedPostId) {
        setSelectedPostId(result[0].id);
      }

      logger.info('Posts fetched successfully', {
        count: result.length,
        hookName: 'usePostsData',
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to fetch posts', {
        error: error.message,
        hookName: 'usePostsData',
      });
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    logger.debug('Hook mounted', { hookName: 'usePostsData' });
    fetchPosts();
  }, []);

  const updatePost = async (request: PostUpdateRequest) => {
    try {
      logger.debug('Updating post', { postId: request.post_id });
      const updatedPost = await service.update(request);
      setPosts((prev) =>
        prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
      );
      logger.info('Post updated successfully', { postId: request.post_id });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to update post', { error: error.message, postId: request.post_id });
      throw error;
    }
  };

  const deletePost = async (postId: string) => {
    try {
      logger.debug('Deleting post', { postId });
      await service.delete(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));

      // 削除された投稿が選択されていた場合、選択を解除
      if (selectedPostId === postId) {
        const remaining = posts.filter((p) => p.id !== postId);
        setSelectedPostId(remaining.length > 0 ? remaining[0].id : null);
      }

      logger.info('Post deleted successfully', { postId });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to delete post', { error: error.message, postId });
      throw error;
    }
  };

  const regeneratePost = async (postId: string) => {
    try {
      logger.debug('Regenerating post', { postId });
      const regeneratedPost = await service.regenerate(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === regeneratedPost.id ? regeneratedPost : p))
      );
      logger.info('Post regenerated successfully', { postId });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to regenerate post', { error: error.message, postId });
      throw error;
    }
  };

  const approvePost = async (postId: string) => {
    try {
      logger.debug('Approving post', { postId });
      const approvedPost = await service.approve(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === approvedPost.id ? approvedPost : p))
      );
      logger.info('Post approved successfully', { postId });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to approve post', { error: error.message, postId });
      throw error;
    }
  };

  const retryPost = async (postId: string) => {
    try {
      logger.debug('Retrying post', { postId });
      const retriedPost = await service.retry(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === retriedPost.id ? retriedPost : p))
      );
      logger.info('Post retry successful', { postId });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to retry post', { error: error.message, postId });
      throw error;
    }
  };

  const createManualPost = async (content: string, scheduledAt: string) => {
    try {
      logger.debug('Creating manual post', { scheduledAt });
      const newPost = await service.create(content, scheduledAt);
      setPosts((prev) => [...prev, newPost]);
      setSelectedPostId(newPost.id);
      logger.info('Manual post created successfully', { postId: newPost.id });
      return newPost;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to create manual post', { error: error.message });
      throw error;
    }
  };

  // 日付でグループ化
  const groupedPosts: PostDateGroup[] = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const groups: { [key: string]: PostDateGroup } = {};

    const filteredPosts = posts.filter((post) => {
      const postDate = new Date(post.scheduled_at);
      postDate.setHours(0, 0, 0, 0);

      switch (filter) {
        case 'today':
          return postDate.getTime() === today.getTime();
        case 'tomorrow':
          return postDate.getTime() === tomorrow.getTime();
        case 'week':
          return postDate >= today && postDate < nextWeek;
        case 'all':
          return true;
        default:
          return true;
      }
    });

    filteredPosts.forEach((post) => {
      const postDate = new Date(post.scheduled_at);
      const dateKey = postDate.toISOString().split('T')[0];

      if (!groups[dateKey]) {
        const isToday = postDate.getTime() === today.getTime();
        const isTomorrow = postDate.getTime() === tomorrow.getTime();

        let displayLabel = `${postDate.getMonth() + 1}月${postDate.getDate()}日`;
        if (isToday) {
          displayLabel = `今日（${displayLabel}）`;
        } else if (isTomorrow) {
          displayLabel = `明日（${displayLabel}）`;
        }

        groups[dateKey] = {
          date: dateKey,
          displayLabel,
          posts: [],
          count: 0,
        };
      }

      groups[dateKey].posts.push(post);
      groups[dateKey].count++;
    });

    // 日付順にソート
    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
  })();

  const selectedPost = posts.find((p) => p.id === selectedPostId) || null;

  return {
    posts,
    groupedPosts,
    loading,
    error,
    selectedPost,
    selectedPostId,
    filter,
    setFilter,
    setSelectedPostId,
    refetch: fetchPosts,
    updatePost,
    deletePost,
    regeneratePost,
    approvePost,
    retryPost,
    createManualPost,
  };
};
