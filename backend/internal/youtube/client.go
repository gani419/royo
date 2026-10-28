package youtube

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/tecdroid/royo/internal/models"
	"github.com/tecdroid/royo/internal/repositories"
)

const CacheTTL = 7 * 24 * time.Hour // 7 days cache

type Client struct {
	apiKey     string
	videoRepo  repositories.VideoRepository
	httpClient *http.Client
}

func NewClient(apiKey string, videoRepo repositories.VideoRepository) *Client {
	return &Client{
		apiKey:    apiKey,
		videoRepo: videoRepo,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

type youtubeSearchItem struct {
	ID struct {
		VideoID string `json:"videoId"`
	} `json:"id"`
	Snippet struct {
		PublishedAt  string `json:"publishedAt"`
		ChannelTitle string `json:"channelTitle"`
		Title        string `json:"title"`
		Description  string `json:"description"`
		Thumbnails   struct {
			Medium struct {
				URL string `json:"url"`
			} `json:"medium"`
		} `json:"thumbnails"`
	} `json:"snippet"`
}

type youtubeSearchAPIResponse struct {
	Items []youtubeSearchItem `json:"items"`
}

func (c *Client) SearchVideos(ctx context.Context, searchQuery string, maxResults int) (*models.VideoSearchResponse, error) {
	cleanQuery := strings.TrimSpace(searchQuery)
	if cleanQuery == "" {
		return &models.VideoSearchResponse{Query: cleanQuery, Videos: []models.YouTubeVideoItem{}}, nil
	}

	if maxResults <= 0 || maxResults > 10 {
		maxResults = 5
	}

	// 1. Check Database Cache
	if c.videoRepo != nil {
		if cached, found, err := c.videoRepo.GetCachedVideos(ctx, cleanQuery); err == nil && found {
			return &models.VideoSearchResponse{
				Query:  cleanQuery,
				Videos: cached,
				Cached: true,
			}, nil
		}
	}

	// Unavailable search must never be presented as verified video metadata.
	if c.apiKey == "" {
		return &models.VideoSearchResponse{
			Query:  cleanQuery,
			Videos: []models.YouTubeVideoItem{},
			Cached: false,
		}, nil
	}

	// 3. Query YouTube Data API v3
	apiURL := fmt.Sprintf(
		"https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=%s&maxResults=%d&key=%s",
		url.QueryEscape(cleanQuery),
		maxResults,
		c.apiKey,
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return &models.VideoSearchResponse{Query: cleanQuery, Videos: []models.YouTubeVideoItem{}}, nil
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return &models.VideoSearchResponse{
			Query:  cleanQuery,
			Videos: []models.YouTubeVideoItem{},
			Cached: false,
		}, nil
	}

	var apiResp youtubeSearchAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, fmt.Errorf("failed to decode youtube api response: %w", err)
	}

	var results []models.YouTubeVideoItem
	for _, item := range apiResp.Items {
		if item.ID.VideoID == "" {
			continue
		}

		pubTime, _ := time.Parse(time.RFC3339, item.Snippet.PublishedAt)
		thumb := item.Snippet.Thumbnails.Medium.URL
		if thumb == "" {
			thumb = fmt.Sprintf("https://img.youtube.com/vi/%s/mqdefault.jpg", item.ID.VideoID)
		}

		results = append(results, models.YouTubeVideoItem{
			ID:           item.ID.VideoID,
			Title:        item.Snippet.Title,
			Description:  item.Snippet.Description,
			ThumbnailURL: thumb,
			ChannelTitle: item.Snippet.ChannelTitle,
			PublishedAt:  pubTime,
			VideoURL:     fmt.Sprintf("https://www.youtube.com/watch?v=%s", item.ID.VideoID),
		})
	}

	// 4. Cache in database
	if c.videoRepo != nil && len(results) > 0 {
		_ = c.videoRepo.CacheVideos(ctx, cleanQuery, results, CacheTTL)
	}

	return &models.VideoSearchResponse{
		Query:  cleanQuery,
		Videos: results,
		Cached: false,
	}, nil
}
