# YouTube Clone Backend - Technical Specification

## 📋 Loyiha haqida

## 🎯 Asosiy talablar

### Texnologiyalar

- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache**: Redis
- **File Storage**: AWS S3 (LocalStack for development)
- **Video Processing**: FFmpeg
- **Queue**: Bull Queue (Redis)
- **Search**: Elasticsearch (optional)
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx
- **SSL**: mkcert (local development)
- **CI/CD**: GitHub Actions

### Arxitektura talablari

- RESTful API
- Role-based access control (RBAC)
- Video processing pipeline
- Real-time notifications
- Advanced search functionality
- Analytics va metrics
- Rate limiting va security

## 🏗️ Database Schema (Prisma)

O'quvchilar quyidagi modellarni o'zlari yaratishlari kerak:

### Asosiy modellar

```prisma
model User {
  id              String   @id @default(uuid())
  email           String   @unique
  username        String   @unique
  firstName       String
  lastName        String
  avatar          String?
  role            Role     @default(USER)
  is_email_verified      Boolean  @default(false)
  is_phone_verified      Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  videos          Video[]
  comments        Comment[]
  likes           Like[]
  subscriptions   Subscription[] @relation("UserSubscriptions")
  subscribers     Subscription[] @relation("UserSubscribers")
  playlists       Playlist[]
}

// KEYINROQ QO'SHISH MUMKIN BO'LGAN QISMLAR:
// - channelBanner String?
// - channelDescription String?
// - isBlocked Boolean @default(false)
// - blockedUntil DateTime?
// - loginAttempts Int @default(0)
// - subscribersCount Int @default(0)
// - totalViews BigInt @default(0)
// - watchHistory WatchHistory[]
// - notifications Notification[]

model Video {
  id              String      @id @default(uuid())
  title           String
  description     String?
  thumbnail       String?
  videoUrl        String
  duration        Int         // seconds
  status          VideoStatus @default(PROCESSING)
  visibility      Visibility  @default(PUBLIC)
  viewsCount      BigInt      @default(0)
  likesCount      Int         @default(0)
  dislikesCount   Int         @default(0)
  createdAt       DateTime    @default(now())

  // Relations
  authorId        String
  author          User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments        Comment[]
  likes           Like[]
}

// KEYINROQ QO'SHISH MUMKIN:
// - fileSize BigInt
// - resolution String // 1080p, 720p, etc.
// - category String?
// - tags String[]
// - commentsCount Int @default(0)
// - publishedAt DateTime?
// - watchHistory WatchHistory[]
// - playlistVideos PlaylistVideo[]

model Comment {
  id            String   @id @default(uuid())
  content       String
  likesCount    Int      @default(0)
  createdAt     DateTime @default(now())

  // Relations
  authorId      String
  author        User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  videoId       String
  video         Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)
  likes         Like[]
}

// KEYINROQ QO'SHISH MUMKIN (REPLY SYSTEM):
// - dislikesCount Int @default(0)
// - isPinned Boolean @default(false)
// - updatedAt DateTime @updatedAt
// - parentId String?
// - parent Comment? @relation("CommentReplies", fields: [parentId], references: [id])
// - replies Comment[] @relation("CommentReplies")

model Subscription {
  id            String   @id @default(cuid())
  subscriberId  String
  subscriber    User     @relation("UserSubscriptions", fields: [subscriberId], references: [id], onDelete: Cascade)
  channelId     String
  channel       User     @relation("UserSubscribers", fields: [channelId], references: [id], onDelete: Cascade)
  notificationsEnabled Boolean @default(true)
  createdAt     DateTime @default(now())

  @@unique([subscriberId, channelId])
}

model Playlist {
  id            String   @id @default(uuid())
  title         String
  description   String?
  visibility    Visibility @default(PUBLIC)
  createdAt     DateTime @default(now())

  // Relations
  authorId      String
  author        User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  videos        PlaylistVideo[]
}

model PlaylistVideo {
  id          String   @id @default(cuid())
  position    Int
  addedAt     DateTime @default(now())

  playlistId  String
  playlist    Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  videoId     String
  video       Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@unique([playlistId, videoId])
}

model Like {
  id        String   @id @default(uuid())
  type      LikeType
  createdAt DateTime @default(now())

  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  videoId   String?
  video     Video?   @relation(fields: [videoId], references: [id], onDelete: Cascade)
  commentId String?
  comment   Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@unique([userId, videoId, type])
  @@unique([userId, commentId, type])
}

enum LikeType {
  LIKE
  DISLIKE
}

// KEYINROQ QO'SHISH MUMKIN BO'LGAN MODELLAR:
/*
model WatchHistory {
  id          String   @id @default(cuid())
  watchedAt   DateTime @default(now())
  watchTime   Int      // seconds watched

  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  videoId     String
  video       Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@unique([userId, videoId])
}

model Notification {
  id        String           @id @default(cuid())
  type      NotificationType
  title     String
  message   String
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum NotificationType {
  NEW_VIDEO
  NEW_SUBSCRIBER
  VIDEO_LIKED
  COMMENT_REPLY
  MENTION
}
*/

enum Role {
  SUPERADMIN
  ADMIN
  USER
}

enum VideoStatus {
  UPLOADING
  PROCESSING
  PUBLISHED
  PRIVATE
  UNLISTED
  DELETED
}

enum Visibility {
  PUBLIC
  UNLISTED
  PRIVATE
}
```

## 🎥 Video Management

### Video endpoints

#### 1. Upload Video

```
POST /videos/upload
Content-Type: multipart/form-data
```

**Request Body:**

```typescript
{
  video: File,              // Video file
  thumbnail?: File,         // Optional thumbnail
  title: string,
  description?: string,
  category?: string,
  tags?: string[],
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
}
```

**Response:**

```json
{
  "success": true,
  "message": "Video uploaded successfully, processing started",
  "data": {
    "id": "video_id",
    "title": "My Awesome Video",
    "status": "PROCESSING",
    "uploadProgress": 100,
    "processingProgress": 0,
    "estimatedProcessingTime": "5-10 minutes"
  }
}
```

#### 2. Get Video Processing Status

```
GET /videos/:id/status
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "video_id",
    "status": "PROCESSING",
    "processingProgress": 65,
    "availableQualities": ["720p"],
    "estimatedTimeRemaining": "2 minutes"
  }
}
```

#### 3. Get Video Details

```
GET /videos/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "video_id",
    "title": "My Awesome Video",
    "description": "This is a great video about...",
    "thumbnail": "https://cdn.example.com/thumbnails/video_id.jpg",
    "videoUrl": "https://cdn.example.com/videos/video_id/1080p.mp4",
    "availableQualities": ["1080p", "720p", "480p", "360p"],
    "duration": 1250,
    "viewsCount": 15420,
    "likesCount": 892,
    "dislikesCount": 23,
    "commentsCount": 156,
    "publishedAt": "2024-01-01T10:00:00Z",
    "author": {
      "id": "user_id",
      "username": "creator_username",
      "channelName": "Awesome Channel",
      "avatar": "https://cdn.example.com/avatars/user_id.jpg",
      "subscribersCount": 125000,
      "isVerified": true
    },
    "tags": ["tutorial", "programming", "javascript"],
    "category": "Education"
  }
}
```

#### 4. Stream Video

```
GET /videos/:id/stream?quality=720p
```

**Headers:**

```
Range: bytes=0-1023
```

**Response:**

```
Status: 206 Partial Content
Content-Range: bytes 0-1023/2048000
Content-Type: video/mp4
```

#### 5. Update Video

```
PUT /videos/:id
```

**Request Body:**

```json
{
  "title": "Updated Video Title",
  "description": "Updated description",
  "visibility": "PUBLIC",
  "tags": ["updated", "tags"]
}
```

#### 6. Delete Video

```
DELETE /videos/:id
```

#### 7. Get Videos Feed

```
GET /videos/feed?limit=20&page=1&category=education&duration=medium&sort=popular
```

**Query Parameters:**

- `limit`: Number of videos per page (1-50)
- `page`: Page number
- `category`: Video category filter
- `duration`: short (<4min), medium (4-20min), long (>20min)
- `sort`: popular, newest, oldest, most_viewed

#### 8. Search Videos

```
GET /videos/search?q=javascript+tutorial&limit=20&page=1&sort=relevance&uploaded=week
```

#### 9. Get Trending Videos

```
GET /videos/trending?category=all&region=global&timeframe=24h
```

## 📊 Analytics

#### 1. Record Video View

```
POST /videos/:id/view
```

**Request Body:**

```json
{
  "watchTime": 125, // seconds watched
  "quality": "720p",
  "device": "mobile",
  "location": "UZ"
}
```

#### 2. Get Video Analytics (Creator only)

```
GET /videos/:id/analytics?timeframe=7d
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalViews": 15420,
    "totalWatchTime": 1250000,
    "averageViewDuration": 245,
    "viewsByDay": [
      { "date": "2024-01-01", "views": 1200, "watchTime": 50000 },
      { "date": "2024-01-02", "views": 1350, "watchTime": 55000 }
    ],
    "viewsByCountry": [
      { "country": "UZ", "views": 8500 },
      { "country": "US", "views": 3200 }
    ],
    "deviceBreakdown": {
      "mobile": 65,
      "desktop": 30,
      "tablet": 5
    },
    "retention": [
      { "time": 0, "percentage": 100 },
      { "time": 30, "percentage": 85 },
      { "time": 60, "percentage": 70 }
    ]
  }
}
```

## 👥 Channel Management

#### 1. Get Channel Info

```
GET /channels/:username
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "username": "creator_username",
    "channelName": "Awesome Channel",
    "channelDescription": "Welcome to my channel...",
    "avatar": "https://cdn.example.com/avatars/user_id.jpg",
    "channelBanner": "https://cdn.example.com/banners/user_id.jpg",
    "subscribersCount": 125000,
    "totalViews": 15000000,
    "videosCount": 156,
    "joinedAt": "2020-01-01T10:00:00Z",
    "isVerified": true,
    "isSubscribed": false
  }
}
```

#### 2. Get Channel Videos

```
GET /channels/:username/videos?limit=20&page=1&sort=newest
```

#### 3. Update Channel

```
PUT /channels/me
```

**Request Body:**

```json
{
  "channelName": "Updated Channel Name",
  "channelDescription": "Updated description",
  "channelBanner": "https://cdn.example.com/new-banner.jpg"
}
```

#### 4. Subscribe/Unsubscribe

```
POST /channels/:userId/subscribe
DELETE /channels/:userId/subscribe
```

#### 5. Get Subscriptions

```
GET /subscriptions?limit=20&page=1
```

#### 6. Get Subscription Feed

```
GET /subscriptions/feed?limit=20&page=1
```

## 💬 Comments System

#### 1. Add Comment

```
POST /videos/:videoId/comments
```

**Request Body:**

```json
{
  "content": "Great video! Very helpful.",
  "parentId": null
}
```

#### 2. Get Comments

```
GET /videos/:videoId/comments?limit=20&page=1&sort=top
```

**Response:**

```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment_id",
        "content": "Great video! Very helpful.",
        "likesCount": 25,
        "dislikesCount": 1,
        "isPinned": false,
        "createdAt": "2024-01-01T10:00:00Z",
        "author": {
          "id": "user_id",
          "username": "commenter",
          "avatar": "https://cdn.example.com/avatars/user_id.jpg"
        },
        "repliesCount": 3,
        "replies": [
          {
            "id": "reply_id",
            "content": "I agree!",
            "likesCount": 5,
            "createdAt": "2024-01-01T10:30:00Z",
            "author": {
              "id": "user_id_2",
              "username": "replier",
              "avatar": "https://cdn.example.com/avatars/user_id_2.jpg"
            }
          }
        ]
      }
    ],
    "totalComments": 156,
    "hasMore": true
  }
}
```

#### 3. Like/Dislike Comment

```
POST /comments/:id/like
POST /comments/:id/dislike
DELETE /comments/:id/like
```

#### 4. Pin/Unpin Comment (Video author only)

```
PATCH /comments/:id/pin
```

## 🎵 Playlist Management

#### 1. Create Playlist

```
POST /playlists
```

**Request Body:**

```json
{
  "title": "My Favorite Videos",
  "description": "Collection of my favorite content",
  "visibility": "PUBLIC"
}
```

#### 2. Add Video to Playlist

```
POST /playlists/:id/videos
```

**Request Body:**

```json
{
  "videoId": "video_id",
  "position": 1
}
```

#### 3. Get Playlist

```
GET /playlists/:id
```

#### 4. Get User Playlists

```
GET /users/:userId/playlists?limit=20&page=1
```

#### 5. Update Playlist

```
PUT /playlists/:id
```

#### 6. Remove Video from Playlist

```
DELETE /playlists/:id/videos/:videoId
```

## 👤 User Management & Auth

### Auth endpoints

#### 1. Register

```
POST /auth/register
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "username": "awesome_creator",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePass123!",
  "channelName": "John's Channel"
}
```

#### 2. Login

```
POST /auth/login
```

#### 3. Get Profile

```
GET /users/me
```

#### 4. Update Profile

```
PUT /users/me
```

#### 5. Get Watch History

```
GET /users/me/history?limit=50&page=1
```

#### 6. Clear Watch History

```
DELETE /users/me/history
```

## 🔍 Search & Discovery

#### 1. Search Everything

```
GET /search?q=javascript&type=videos&limit=20&page=1&sort=relevance&duration=any&uploaded=anytime
```

**Query Parameters:**

- `q`: Search query
- `type`: videos, channels, playlists, all
- `sort`: relevance, upload_date, view_count, rating
- `duration`: any, short, medium, long
- `uploaded`: anytime, hour, today, week, month, year

#### 2. Get Search Suggestions

```
GET /search/suggestions?q=javascr
```

**Response:**

```json
{
  "success": true,
  "data": [
    "javascript tutorial",
    "javascript course",
    "javascript projects",
    "javascript interview questions"
  ]
}
```

#### 3. Get Recommended Videos

```
GET /recommendations?limit=20&page=1&videoId=current_video_id
```

## 🛡️ Admin Panel

### Admin endpoints

#### 1. Get Dashboard Stats

```
GET /admin/dashboard
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalUsers": 125000,
    "totalVideos": 250000,
    "totalViews": 50000000,
    "totalWatchTime": 1000000000,
    "newUsersToday": 250,
    "newVideosToday": 1500,
    "viewsToday": 2500000,
    "topCategories": [
      { "category": "Entertainment", "count": 50000 },
      { "category": "Education", "count": 35000 }
    ],
    "storageUsed": "500TB",
    "bandwidthUsed": "50TB"
  }
}
```

#### 2. Moderate Content

```
GET /admin/videos/pending?limit=20&page=1
PATCH /admin/videos/:id/approve
PATCH /admin/videos/:id/reject
```

#### 3. User Management

```
GET /admin/users?limit=50&page=1&search=john&status=active
PATCH /admin/users/:id/block
PATCH /admin/users/:id/verify
```

#### 4. Content Reports

```
GET /admin/reports?type=video&status=pending&limit=20&page=1
PATCH /admin/reports/:id/resolve
```

## 🔒 Security & Rate Limiting

### Rate Limits

```typescript
// Video upload: 10 videos/hour per user
// Comments: 50 comments/hour per user
// Likes: 1000 likes/hour per user
// Search: 100 requests/minute per IP
// API calls: 1000 requests/hour per user
```

### Security Features

- Video file validation (format, size, duration)
- Thumbnail validation
- Content moderation hooks
- CSRF protection
- Input sanitization
- SQL injection prevention

## 🎬 Video Processing Pipeline

### Processing Workflow

1. **Upload** → Temporary storage
2. **Validation** → File format, size, duration checks
3. **Queue** → Add to processing queue (Bull Queue)
4. **Transcode** → Multiple qualities (1080p, 720p, 480p, 360p)
5. **Thumbnail** → Auto-generate thumbnails
6. **Storage** → Upload to S3/LocalStack
7. **Database** → Update video status and URLs
8. **Notification** → Notify user completion

### FFmpeg Commands Example

```bash
# Generate thumbnails
ffmpeg -i input.mp4 -vf "thumbnail,scale=1280:720" -frames:v 1 thumbnail.jpg

# Transcode to multiple qualities
ffmpeg -i input.mp4 -c:v libx264 -preset medium -crf 23 -s 1920x1080 -c:a aac output_1080p.mp4
ffmpeg -i input.mp4 -c:v libx264 -preset medium -crf 25 -s 1280x720 -c:a aac output_720p.mp4
```

## 📊 Queue Jobs (Bull Queue)

```typescript
// Video processing job
interface VideoProcessingJob {
  videoId: string;
  inputPath: string;
  qualities: ["1080p", "720p", "480p", "360p"];
  generateThumbnails: boolean;
}

// Notification job
interface NotificationJob {
  type: "video_published" | "new_subscriber" | "comment_reply";
  userId: string;
  data: any;
}

// Analytics job
interface AnalyticsJob {
  type: "view_recorded" | "engagement_calculated";
  videoId: string;
  userId?: string;
  data: any;
}
```

## 📈 Analytics & Metrics

### Real-time Analytics

- View count updates
- Watch time tracking
- Engagement metrics (likes, comments, shares)
- Audience retention curves
- Geographic data
- Device/platform analytics

### Scheduled Reports

- Daily video performance
- Channel growth metrics
- Revenue analytics (if monetization implemented)
- Content performance insights

## 🔔 Real-time Notifications

### WebSocket Events

```typescript
// New subscriber
{
  type: 'new_subscriber',
  data: {
    subscriberId: 'user_id',
    subscriberName: 'John Doe',
    channelId: 'channel_id'
  }
}

// Video published
{
  type: 'video_published',
  data: {
    videoId: 'video_id',
    title: 'New Video Title',
    authorId: 'user_id',
    authorName: 'Creator Name'
  }
}

// Comment reply
{
  type: 'comment_reply',
  data: {
    commentId: 'comment_id',
    replyId: 'reply_id',
    videoId: 'video_id',
    authorName: 'Commenter'
  }
}
```

## 🌐 CDN & Streaming

### Video Delivery

- Adaptive bitrate streaming
- Progressive download fallback
- Regional CDN distribution
- Bandwidth optimization

### URL Structure

```
https://cdn.example.com/videos/{videoId}/{quality}.mp4
https://cdn.example.com/thumbnails/{videoId}/default.jpg
https://cdn.example.com/thumbnails/{videoId}/hq1.jpg
```

## 🚀 Loyihani Bosqichma-bosqich Rivojlantirish

### 📋 BOSQICH 1: MVP (Minimum Viable Product) - 2 hafta

**Asosiy funksiyalar:**

- ✅ User authentication (register, login, logout)
- ✅ Soddalashtirilgan User va Video modellar
- ✅ Video upload (faqat file upload, processing keyinroq)
- ✅ Video ko'rish va basic streaming
- ✅ Basic video list va search
- ✅ Comments (reply systemsiz)
- ✅ Like/dislike system

**Texnik talablar:**

- NestJS + Prisma + PostgreSQL
- Basic Docker setup
- Simple file upload (local storage)

### 📋 BOSQICH 2: Core Features - 3-4 hafta

**Qo'shiladigan funksiyalar:**

- ✅ Channel system va subscriptions
- ✅ Video processing (FFmpeg integration)
- ✅ Multiple video qualities
- ✅ Playlist management
- ✅ Advanced search va filters
- ✅ Admin panel basics

**Texnik yaxshilanishlar:**

- Redis cache integration
- Bull Queue video processing
- AWS S3 (LocalStack) integration
- Improved Docker setup

### 📋 BOSQICH 3: Advanced Features - 5-6 hafta

**Qo'shiladigan funksiyalar:**

- ✅ Real-time notifications
- ✅ Watch history
- ✅ Analytics va metrics
- ✅ Comment replies system
- ✅ Content moderation
- ✅ Video recommendations

**Texnik yaxshilanishlar:**

- WebSocket integration
- Advanced analytics
- Performance optimization
- Full CI/CD pipeline

### 📋 BOSQICH 4: Production Ready - 7-8 hafta

**Yakuniy yaxshilanishlar:**

- ✅ Full SSL/HTTPS setup
- ✅ Advanced security features
- ✅ Performance monitoring
- ✅ Load testing
- ✅ Documentation
- ✅ Deployment optimization

## ✅ Baholash mezonlari

### MVP Talablari (40 ball)

- [x] Basic auth system (10 ball)
- [x] Video upload va ko'rish (15 ball)
- [x] Comments va likes (10 ball)
- [x] Docker setup (5 ball)

### Core Features (35 ball)

- [x] Channel va subscription system (10 ball)
- [x] Video processing (FFmpeg) (15 ball)
- [x] Search va playlists (10 ball)

### Advanced Features (25 ball)

- [x] Real-time features (10 ball)
- [x] Analytics (8 ball)
- [x] Production deployment (7 ball)

## 🎯 Topshirish talablari

1. **GitHub repository** - private repo yarating
2. **README.md** - setup va API documentation
3. **Postman collection** - barcha endpointlar

## ⏰ Muddatlar (Bosqichma-bosqich)

### 🎯 Bosqich 1: MVP Demo

- **Boshlanish**: Darhol
- **MVP Demo**: 2 hafta ichida
- **Asosiy funksiyalar**: Auth + Video upload/view + Comments

### 🎯 Bosqich 2: Core Features Demo

- **Core Features**: 3-4 hafta ichida
- **Qo'shimcha**: Channels + Processing + Playlists

### 🎯 Bosqich 3: Advanced Demo

- **Advanced Features**: 5-6 hafta ichida
- **Qo'shimcha**: Real-time + Analytics + Moderation

### 🎯 Final Presentation

- **Production Ready**: 7-8 hafta ichida
- **To'liq loyiha**: SSL + CI/CD + Documentation

## 💡 **Maslahatlar:**

### 🚀 **Tez Boshlanish:**

1. Birinchi sodda User/Video modellarni yarating
2. Basic CRUD operationlarni implement qiling
3. Birinchi video upload/view funksiyasini ishlatib ko'ring
4. Keyin bosqichma-bosqich murakkablashtiring

### 📝 **Koding Strategiyasi:**

- Birinchi ishlaydigan versiya yarating (ugly code OK)
- Keyin refactor qiling va yaxshilang
- Test yozishni unutmang
- Documentation yozib boring

### 🔧 **Development Tips:**

- LocalStack ishlamaydigan bo'lsa, birinchi local file storage ishlating
- FFmpeg murakkab bo'lsa, birinchi faqat file upload qiling
- Real-time features oxirida qo'shing, birinchi REST API yarating

### 🎯 **1-kun: Loyihani Setup qiling**

```bash
# 1. NestJS loyiha yarating
npm i -g @nestjs/cli
nest new youtube-clone-backend

# 2. Kerakli package'larni o'rnating
npm install @prisma/client prisma
npm install bcryptjs jsonwebtoken
npm install @nestjs/jwt @nestjs/passport
npm install class-validator class-transformer

# 3. Prisma setup
npx prisma init
```

### 🎯 **2-3 kun: Database va Auth**

- Sodda User modelini yarating (faqat asosiy fieldlar)
- Auth module yarating (register, login, JWT)
- Password hashing (bcrypt)
- Basic validation

### 🎯 **4-7 kun: Video CRUD**

- Video model yarating (sodda versiya)
- Video upload endpoint (multipart/form-data)
- Video list va get by ID
- File system'da storage (AWS keyinroq)

### 🎯 **8-10 kun: Comments va Likes**

- Comment model (reply systemsiz)
- Like/dislike system
- Video statistics (viewsCount, likesCount)

### 🎯 **11-14 kun: MVP Demo**

- Docker setup
- Postman collection
- README documentation
- Birinchi demo video

### 🔍 **Debugging Tips:**

- Prisma studio'dan database'ni tekshiring: `npx prisma studio`
- Network tab'da API requestlarni monitor qiling
- Docker logs'ni tekshiring: `docker-compose logs app`
- Redis'ni tekshiring: `redis-cli ping`
