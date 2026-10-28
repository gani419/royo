package youtube

import (
	"context"
	"github.com/tecdroid/royo/internal/repositories"
	"testing"
)

func TestUnavailableSearchDoesNotFabricateVideos(t *testing.T) {
	result, err := NewClient("", repositories.NewMemoryVideoRepository()).SearchVideos(context.Background(), "Classic 350 maintenance", 3)
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Videos) != 0 {
		t.Fatal("unavailable search returned invented videos")
	}
}
