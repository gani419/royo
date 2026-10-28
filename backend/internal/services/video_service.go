package services

import (
	"context"

	"github.com/tecdroid/royo/internal/models"
	"github.com/tecdroid/royo/internal/youtube"
)

type VideoService struct {
	ytClient *youtube.Client
}

func NewVideoService(ytClient *youtube.Client) *VideoService {
	return &VideoService{ytClient: ytClient}
}

func (s *VideoService) Search(ctx context.Context, query string, maxResults int) (*models.VideoSearchResponse, error) {
	return s.ytClient.SearchVideos(ctx, query, maxResults)
}

