# ☁️ Cloudinary Image Upload Setup

## Overview
Your application is configured to upload images to Cloudinary and store the image URLs in MongoDB (not the actual image files).

## Current Configuration

### Cloud Name: `dpipulbgm`
### Upload Preset: `tu_reports`

## ✅ How It Works

1. **User uploads an image** (candidate photo, election symbol, post image, etc.)
2. **Multer intercepts** the upload request
3. **CloudinaryStorage uploads** the image directly to Cloudinary cloud storage
4. **Cloudinary returns** a secure URL (e.g., `https://res.cloudinary.com/dpipulbgm/image/upload/v1234567890/ictforum/candidates/photos/profilePhoto-john_doe-1234567890.jpg`)
5. **This URL is saved** in MongoDB in the document (NOT the image file itself)
6. **When displaying**, the frontend fetches the URL from the database and loads the image from Cloudinary

## 🔐 Required: Get Your API Credentials

To complete the setup, you need to add your Cloudinary API credentials to the `.env` file:

### Steps:
1. Go to [Cloudinary Console](https://console.cloudinary.com/settings/security)
2. Log in with your account
3. Copy your **API Key** and **API Secret**
4. Update the `.env` file:

```env
CLOUDINARY_CLOUD_NAME=dpipulbgm
CLOUDINARY_API_KEY=your_actual_api_key_here
CLOUDINARY_API_SECRET=your_actual_api_secret_here
CLOUDINARY_UPLOAD_PRESET=tu_reports
```

## 📁 Image Storage Locations

Images are organized in Cloudinary folders:

- **Candidate Photos**: `ictforum/candidates/photos/`
- **Election Symbols**: `ictforum/candidates/symbols/`
- **Manifesto Brochures**: `ictforum/candidates/manifestos/`
- **Post Images**: `ictforum/posts/`
- **Member Documents**: `ictforum/members/[citizenship|photos|recommendations|resumes]/`

## 🗄️ Database Storage

In MongoDB, only the Cloudinary URL is stored:

```javascript
// Example Candidate Document
{
  personalInfo: {
    name: "John Doe",
    profilePhoto: "https://res.cloudinary.com/dpipulbgm/image/upload/v1234567890/ictforum/candidates/photos/profilePhoto-john_doe-1234567890.jpg"
  },
  politicalInfo: {
    partyName: "Example Party",
    electionSymbolImage: "https://res.cloudinary.com/dpipulbgm/image/upload/v1234567890/ictforum/candidates/symbols/electionSymbolImage-symbol-1234567890.png"
  }
}
```

## 🚀 Upload Endpoints

### Candidate Registration (Public)
```http
POST /api/candidates/register
Content-Type: multipart/form-data

Fields:
- profilePhoto (image file)
- electionSymbolImage (image file)
- manifestoBrochure (PDF or image)
- ...other candidate data
```

### Create Candidate (Admin)
```http
POST /api/candidates
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Fields:
- profilePhoto (image file)
- electionSymbolImage (image file)
- manifestoBrochure (PDF or image)
- ...other candidate data
```

### Create Post
```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: multipart/form-data

Fields:
- image (image file)
- title
- content
- ...other post data
```

## 🔍 Features

✅ **Automatic Upload**: Files are automatically uploaded to Cloudinary
✅ **URL Storage**: Only secure URLs are stored in MongoDB (saves database space)
✅ **Cloud CDN**: Images are served via Cloudinary's fast global CDN
✅ **Image Optimization**: Automatic format optimization and transformations
✅ **10MB Limit**: Each file upload is limited to 10MB
✅ **Multiple Formats**: Supports JPG, JPEG, PNG, WEBP, GIF, PDF
✅ **Organized Folders**: Images are automatically organized in logical folders
✅ **Unique Filenames**: Each upload gets a unique identifier to prevent conflicts
✅ **Cleanup on Delete**: When a candidate/post is deleted, the Cloudinary image is also removed

## ⚙️ Configuration Files

### `/config/cloudinary.config.js`
- Initializes Cloudinary SDK
- Exports cloudinary instance and constants
- Validates configuration

### `/config/multer.config.js`
- Configures multer with CloudinaryStorage
- Defines upload middleware for different entity types
- Sets file size limits and allowed formats

### `/controllers/candidateController.js`
- Handles candidate creation/update
- Stores Cloudinary URLs in MongoDB
- Extracts file paths from `req.files`

### `/controllers/postController.js`
- Handles post creation/update/delete
- Stores Cloudinary URLs in MongoDB
- Cleans up Cloudinary images when posts are deleted

## ⚠️ Important Notes

1. **Never store images directly in MongoDB** - Only URLs are stored
2. **Images are in the cloud** - Not on your server's filesystem
3. **API credentials required** - Without them, uploads will fail
4. **Free tier limits** - Cloudinary free tier has storage and bandwidth limits
5. **HTTPS URLs** - All Cloudinary URLs use HTTPS for security

## 🧪 Testing

After adding your API credentials, test the upload:

```bash
# Start the server
cd /Users/baivab/Projects/nekapa/election-app/server
npm start

# Test with curl or Postman
curl -X POST http://localhost:3000/api/candidates/register \
  -F "personalInfo[fullName]=Test Candidate" \
  -F "personalInfo[email]=test@example.com" \
  -F "profilePhoto=@/path/to/photo.jpg"
```

## 📚 Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Multer Storage Cloudinary](https://github.com/affanshahid/multer-storage-cloudinary)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)

---

**Status**: ✅ Configuration complete - Add API credentials to start uploading
