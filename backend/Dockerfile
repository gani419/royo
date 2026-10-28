# Build Stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install git and ca-certificates
RUN apk add --no-cache git ca-certificates tzdata

# Copy dependency definitions
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build statically linked Go binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-s -w" \
    -o /app/bin/royo-server \
    ./cmd/server

# Final Lightweight Runtime Stage
FROM alpine:3.19

WORKDIR /app

# Add ca-certificates and tzdata for TLS and timezones
RUN apk add --no-cache ca-certificates tzdata

# Create non-root user for security
RUN addgroup -S royo && adduser -S royo -G royo

# Copy binary from builder
COPY --from=builder /app/bin/royo-server /app/royo-server

# Switch to non-root user
USER royo:royo

# Expose API port
EXPOSE 8080

# Run server
ENTRYPOINT ["/app/royo-server"]

