package models

import "time"

type YouTubeVideoItem struct {
	ID           string    `json:"id"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	ThumbnailURL string    `json:"thumbnailUrl"`
	ChannelTitle string    `json:"channelTitle"`
	PublishedAt  time.Time `json:"publishedAt"`
	VideoURL     string    `json:"videoUrl"`
}

type VideoSearchResponse struct {
	Query   string             `json:"query"`
	Videos  []YouTubeVideoItem `json:"videos"`
	Cached  bool               `json:"cached"`
}

