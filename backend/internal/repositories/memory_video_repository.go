package repositories

import (
	"context"
	"sync"
	"time"

	"github.com/tecdroid/royo/internal/models"
)

type memoryVideoCacheItem struct {
	videos    []models.YouTubeVideoItem
	expiresAt time.Time
}

type MemoryVideoRepository struct {
	mu    sync.RWMutex
	cache map[string]*memoryVideoCacheItem
}

func NewMemoryVideoRepository() *MemoryVideoRepository {
	return &MemoryVideoRepository{
		cache: make(map[string]*memoryVideoCacheItem),
	}
}

func (r *MemoryVideoRepository) GetCachedVideos(ctx context.Context, query string) ([]models.YouTubeVideoItem, bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	item, exists := r.cache[query]
	if !exists || time.Now().After(item.expiresAt) {
		return nil, false, nil
	}

	cloned := make([]models.YouTubeVideoItem, len(item.videos))
	copy(cloned, item.videos)
	return cloned, true, nil
}

func (r *MemoryVideoRepository) CacheVideos(ctx context.Context, query string, videos []models.YouTubeVideoItem, ttl time.Duration) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	cloned := make([]models.YouTubeVideoItem, len(videos))
	copy(cloned, videos)

	r.cache[query] = &memoryVideoCacheItem{
		videos:    cloned,
		expiresAt: time.Now().Add(ttl),
	}
	return nil
}

