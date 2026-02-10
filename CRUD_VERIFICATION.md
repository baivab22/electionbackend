# ✅ CRUD Operations Verification Checklist

## 🔧 System Configuration Status

### ✅ Cloudinary Configuration
- [x] Cloud name configured: `dpipulbgm`
- [x] Upload preset configured: `tu_reports`
- [x] Cloudinary SDK integrated
- [x] Multer-storage-cloudinary configured
- [ ] **ACTION REQUIRED**: Add API credentials to .env file

### ✅ Controllers Updated
- [x] **candidateController.js**: Full CRUD with Cloudinary cleanup
- [x] **postController.js**: Full CRUD with Cloudinary cleanup
- [x] **memberController.js**: Full CRUD with Cloudinary cleanup

---

## 📝 CRUD Operations Summary

### 1️⃣ CANDIDATES (with Images)

#### ✅ CREATE (C)
**Endpoints:**
- `POST /api/candidates` (Admin) - Create candidate
- `POST /api/candidates/register` (Public) - Register candidate

**Features:**
- ✅ Uploads images to Cloudinary (profilePhoto, electionSymbolImage, manifestoBrochure)
- ✅ Stores Cloudinary URLs in MongoDB
- ✅ Supports multipart/form-data
- ✅ Validates data with express-validator

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/candidates/register \
  -F "personalInfo[fullName]=Test Candidate" \
  -F "personalInfo[email]=test@example.com" \
  -F "personalInfo[phone]=9800000000" \
  -F "politicalInfo[partyName]=Test Party" \
  -F "politicalInfo[candidacyLevel]=federal" \
  -F "profilePhoto=@/path/to/photo.jpg" \
  -F "electionSymbolImage=@/path/to/symbol.png"
```

#### ✅ READ (R)
**Endpoints:**
- `GET /api/candidates` - Get all candidates
- `GET /api/candidates/:id` - Get single candidate
- `GET /api/candidates/search` - Search candidates
- `GET /api/candidates/stats` (Admin) - Get statistics

**Features:**
- ✅ Returns Cloudinary URLs for images
- ✅ Filtering by position, party, constituency
- ✅ Pagination support
- ✅ Search functionality

**Test Command:**
```bash
# Get all candidates
curl http://localhost:3000/api/candidates

# Get specific candidate
curl http://localhost:3000/api/candidates/{candidate_id}

# Search
curl "http://localhost:3000/api/candidates/search?q=TestCandidate"
```

#### ✅ UPDATE (U)
**Endpoint:**
- `PUT /api/candidates/:id` (Admin)

**Features:**
- ✅ Updates candidate data
- ✅ Handles new image uploads
- ✅ **Deletes old Cloudinary images** when new ones are uploaded
- ✅ Prevents orphaned images in Cloudinary

**Test Command:**
```bash
curl -X PUT http://localhost:3000/api/candidates/{candidate_id} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "personalInfo[fullName]=Updated Name" \
  -F "profilePhoto=@/path/to/new_photo.jpg"
```

#### ✅ DELETE (D)
**Endpoint:**
- `DELETE /api/candidates/:id` (Admin)

**Features:**
- ✅ Deletes candidate from MongoDB
- ✅ **Automatically deletes all Cloudinary images** (profilePhoto, electionSymbolImage, manifestoBrochure)
- ✅ Prevents orphaned files in cloud storage

**Test Command:**
```bash
curl -X DELETE http://localhost:3000/api/candidates/{candidate_id} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### 2️⃣ POSTS (with Images)

#### ✅ CREATE (C)
**Endpoint:**
- `POST /api/posts` (Authenticated)

**Features:**
- ✅ Uploads image to Cloudinary
- ✅ Stores Cloudinary URL and public_id
- ✅ Automatic rollback if DB save fails
- ✅ Bilingual support (en/np)

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title_en=Test Post" \
  -F "content_en=This is test content" \
  -F "category=technology" \
  -F "image=@/path/to/image.jpg"
```

#### ✅ READ (R)
**Endpoints:**
- `GET /api/posts` - Get all published posts
- `GET /api/posts/admin` (Admin) - Get all posts
- `GET /api/posts/:id` - Get single post

**Features:**
- ✅ Returns Cloudinary URLs
- ✅ Pagination and filtering
- ✅ Language-specific content
- ✅ Auto-increment view count

**Test Command:**
```bash
# Get all posts
curl "http://localhost:3000/api/posts?page=1&limit=10"

# Get specific post
curl http://localhost:3000/api/posts/{post_id}
```

#### ✅ UPDATE (U)
**Endpoint:**
- `PUT /api/posts/:id` (Authenticated)

**Features:**
- ✅ Updates post data
- ✅ Handles new image upload
- ✅ **Deletes old Cloudinary image** when new one is uploaded
- ✅ Rollback on failure

**Test Command:**
```bash
curl -X PUT http://localhost:3000/api/posts/{post_id} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title_en=Updated Title" \
  -F "image=@/path/to/new_image.jpg"
```

#### ✅ DELETE (D)
**Endpoint:**
- `DELETE /api/posts/:id` (Admin)

**Features:**
- ✅ Deletes post from MongoDB
- ✅ **Automatically deletes Cloudinary image**
- ✅ Handles multiple URL formats

**Test Command:**
```bash
curl -X DELETE http://localhost:3000/api/posts/{post_id} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### 3️⃣ MEMBERS (with Documents)

#### ✅ CREATE (C)
**Endpoint:**
- `POST /api/members` (Public)

**Features:**
- ✅ Uploads documents to Cloudinary (citizenshipCopy, photo, recommendationLetter, resume)
- ✅ Stores Cloudinary URLs
- ✅ Validates unique email and citizenship ID
- ✅ Supports PDF and image formats

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/members \
  -F "generalInfo={\"fullName\":\"Test Member\",\"email\":\"member@test.com\",\"citizenshipId\":\"12345\"}" \
  -F "citizenshipCopy=@/path/to/citizenship.pdf" \
  -F "photo=@/path/to/photo.jpg"
```

#### ✅ READ (R)
**Endpoints:**
- `GET /api/members` - Get all members
- `GET /api/members/:id` - Get single member
- `GET /api/members/stats` (Admin) - Get statistics

**Features:**
- ✅ Returns Cloudinary URLs for documents
- ✅ Filtering and pagination
- ✅ Search functionality

**Test Command:**
```bash
# Get all members
curl "http://localhost:3000/api/members?page=1&limit=10"

# Get specific member
curl http://localhost:3000/api/members/{member_id}
```

#### ✅ UPDATE (U)
**Endpoint:**
- `PUT /api/members/:id` (Admin)

**Features:**
- ✅ Updates member data
- ✅ Status management (pending/approved/rejected)
- ✅ Supports partial updates

**Test Command:**
```bash
curl -X PUT http://localhost:3000/api/members/{member_id}/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'
```

#### ✅ DELETE (D)
**Endpoint:**
- `DELETE /api/members/:id` (Admin)

**Features:**
- ✅ Deletes member from MongoDB
- ✅ **Automatically deletes all Cloudinary documents**
- ✅ Handles both image and raw file types

**Test Command:**
```bash
curl -X DELETE http://localhost:3000/api/members/{member_id} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🔑 Key Features Implemented

### ✅ Cloudinary Integration
- [x] Images uploaded directly to Cloudinary (not stored locally)
- [x] URLs stored in MongoDB (not binary data)
- [x] Organized folder structure in Cloudinary
- [x] Automatic file type detection
- [x] 10MB file size limit

### ✅ Resource Cleanup
- [x] **Delete operations clean up Cloudinary resources**
- [x] **Update operations delete old images when uploading new ones**
- [x] **Failed uploads are rolled back**
- [x] No orphaned files in cloud storage

### ✅ Error Handling
- [x] Validation errors returned with details
- [x] Rollback on failed operations
- [x] Clear error messages
- [x] Console logging for debugging

### ✅ Security
- [x] Authentication required for protected routes
- [x] Admin-only operations enforced
- [x] File type validation
- [x] File size limits

---

## 🚀 Quick Start Testing

### 1. Add Cloudinary Credentials
Edit `/Users/baivab/Projects/nekapa/election-app/server/.env`:

```env
CLOUDINARY_CLOUD_NAME=dpipulbgm
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
CLOUDINARY_UPLOAD_PRESET=tu_reports
```

Get credentials from: https://console.cloudinary.com/settings/security

### 2. Start the Server
```bash
cd /Users/baivab/Projects/nekapa/election-app/server
npm install
npm start
```

### 3. Test Basic Operations

**Create a Candidate:**
```bash
curl -X POST http://localhost:3000/api/candidates/register \
  -F "personalInfo[fullName]=John Doe" \
  -F "personalInfo[email]=john@example.com" \
  -F "personalInfo[phone]=9800000000" \
  -F "politicalInfo[partyName]=Test Party" \
  -F "politicalInfo[candidacyLevel]=federal" \
  -F "politicalInfo[constituency]=Kathmandu-1"
```

**Get All Candidates:**
```bash
curl http://localhost:3000/api/candidates
```

**Delete a Candidate (Admin):**
```bash
# First login to get admin token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}'

# Then delete (replace TOKEN and ID)
curl -X DELETE http://localhost:3000/api/candidates/{candidate_id} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📊 Database Storage

### MongoDB Collections

**Candidates:**
```javascript
{
  personalInfo: {
    fullName: "John Doe",
    profilePhoto: "https://res.cloudinary.com/dpipulbgm/image/upload/v1234/ictforum/candidates/photos/profilePhoto-john-1234.jpg"
  },
  politicalInfo: {
    partyName: "Test Party",
    electionSymbolImage: "https://res.cloudinary.com/dpipulbgm/image/upload/v1234/ictforum/candidates/symbols/symbol-1234.png"
  }
}
```

**Posts:**
```javascript
{
  title_en: "Test Post",
  content_en: "Content here",
  image: "https://res.cloudinary.com/dpipulbgm/image/upload/v1234/ictforum/posts/post-image-1234.jpg",
  imagePublicId: "ictforum/posts/post-image-1234"
}
```

**Members:**
```javascript
{
  generalInfo: {
    fullName: "Test Member",
    email: "member@test.com"
  },
  documents: {
    photo: {
      filename: "photo.jpg",
      path: "https://res.cloudinary.com/dpipulbgm/image/upload/v1234/ictforum/members/photos/member-photo-1234.jpg"
    }
  }
}
```

---

## ⚠️ Important Notes

1. **API Credentials Required**: System won't upload images until you add `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` to .env

2. **Images in Cloud**: All images are stored in Cloudinary, not on your server

3. **URLs in Database**: Only Cloudinary URLs are stored in MongoDB, not files

4. **Auto Cleanup**: When you delete a candidate/post/member, all associated Cloudinary images are automatically deleted

5. **Update Cleanup**: When you update with a new image, the old Cloudinary image is automatically deleted

6. **No Orphans**: Failed operations roll back Cloudinary uploads to prevent orphaned files

---

## 🎯 Next Steps

1. ✅ **Add API Credentials** to .env file
2. ✅ **Test Create Operations** - Upload some test images
3. ✅ **Verify Cloudinary Dashboard** - Check if images appear
4. ✅ **Test Update Operations** - Upload new images, verify old ones are deleted
5. ✅ **Test Delete Operations** - Verify Cloudinary images are removed
6. ✅ **Check MongoDB** - Verify only URLs are stored, not binary data

---

**Status**: ✅ All CRUD operations implemented with proper Cloudinary integration
**Action Required**: Add CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to .env file
