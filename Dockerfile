# ---------- Build ----------
FROM golang:1.26 AS builder

WORKDIR /build

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./

RUN CGO_ENABLED=0 GOOS=linux go build -o server .


# ---------- Runtime ----------
FROM alpine:3.20

WORKDIR /app

COPY --from=builder /build/server ./server
COPY frontend/ ./frontend/

EXPOSE 8080

CMD ["./server"]