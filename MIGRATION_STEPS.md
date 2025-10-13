# PDF Chatbot Migration Steps

## 1. Install Python Dependencies

```bash
cd python-backend
pip install slowapi
```

## 2. Update Database Schema

```bash
cd server
npx prisma generate
npx prisma db push
```

## 3. Update Environment Variables

### Python Backend (.env already updated)

- Added `ALLOWED_ORIGINS` for CORS security

### Node Backend (if needed)

- Ensure `PYTHON_API_URL` is set correctly

## 4. Restart Services

### Python Backend

```bash
cd python-backend
uvicorn main:app --reload --port 8000
```

### Node Backend

```bash
cd server
npm run dev
```

### Frontend

```bash
cd client
npm run dev
```

## Changes Summary

### Python Backend

- ✅ Added rate limiting (5 uploads/min, 20 queries/min)
- ✅ Added file validation (10MB limit, PDF only)
- ✅ Added comprehensive error handling
- ✅ Added logging throughout
- ✅ Fixed duplicate function
- ✅ Added session expiration (24 hours)
- ✅ Added message limit per session (100 messages)
- ✅ Added Cloudinary cleanup on session end
- ✅ Made session_id required
- ✅ Added CORS security with ALLOWED_ORIGINS

### Node Backend

- ✅ Added cloudinaryPublicId field to database
- ✅ Updated session creation to store cloudinaryPublicId
- ✅ Updated cleanup endpoint to pass cloudinaryPublicId to Python
- ✅ Added better error handling

### Frontend

- ✅ Updated to handle cloudinaryPublicId
- ✅ Added message limit tracking and display
- ✅ Added character counter for queries (1000 char limit)
- ✅ Added better error messages for:
  - File size limits
  - Rate limiting
  - Session message limits
  - Query validation
- ✅ Added warning when approaching message limit

## Testing Checklist

- [ ] Upload a PDF (should work with session_id required)
- [ ] Try uploading file > 10MB (should fail with clear error)
- [ ] Try uploading non-PDF file (should fail)
- [ ] Send multiple queries (should work)
- [ ] Try sending empty query (should fail)
- [ ] Try sending query > 1000 chars (should fail)
- [ ] End session (should cleanup Pinecone + Cloudinary)
- [ ] Try uploading 6 PDFs in 1 minute (should hit rate limit)
- [ ] Try sending 21 queries in 1 minute (should hit rate limit)
- [ ] Send 100+ messages in one session (should hit message limit)

## Rollback Plan

If issues occur:

1. Revert database migration: `npx prisma migrate reset`
2. Restore old Python backend files from git
3. Restore old frontend files from git
4. Remove `slowapi` from requirements.txt
