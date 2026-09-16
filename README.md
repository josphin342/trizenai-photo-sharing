# TrizenAI Photo Sharing Platform

A full-stack photo-sharing platform developed for the TrizenAI Full-Stack Internship Challenge.

The application allows an event photography team to collaboratively upload photos for an event. An Admin/Lead reviews and selects photos, creates and publishes a customer gallery, and protects the gallery using a PIN. Customers can access the published gallery through a shareable link without creating an account.

---

## Project Overview

The platform supports three user roles:

- Admin / Lead
- Team Member
- Customer

### Admin / Lead

The Admin can:

- Register and log in
- Create events
- Add and assign team members
- View all photos uploaded for an event
- Select photos for customer sharing
- Create a gallery
- Update an unpublished gallery
- Publish a gallery
- Generate a shareable gallery link
- Set a 6-digit gallery PIN

### Team Member

A Team Member can:

- Log in
- View assigned events
- Upload event photos
- View their own uploaded photos

Team Members cannot:

- Publish galleries
- Manage other Team Members' photos
- Access events that are not assigned to them

### Customer

A Customer does not need an account.

Customers can:

- Open a shared gallery link
- Enter the gallery PIN
- Access the published gallery
- Browse the published photos

---

## Main Workflow

```text
Admin
  |
  | Create Event
  v
Event
  |
  | Assign Team Members
  v
Team Members
  |
  | Upload Photos
  v
Photo Storage (AWS S3)
  |
  | Admin reviews photos
  v
Admin selects photos
  |
  | Create Gallery
  v
Gallery Draft
  |
  | Update selected photos
  v
Admin Publishes Gallery
  |
  | Shareable Link + PIN
  v
Customer
  |
  | Enter PIN
  v
Published Photo Gallery


Technology Stack
Frontend

React
Vite
Tailwind CSS
React Router
Axios

Backend
Node.js
Express.js
JWT authentication
bcryptjs
Multer
Jest
Supertest

Database
MongoDB
MongoDB Atlas
Mongoose

Object Storage
Amazon S3

Photos are stored in AWS S3 rather than directly inside MongoDB.

Deployment
Frontend: Vercel
Backend: Render
Database: MongoDB Atlas
Object Storage: AWS S3

                    ┌─────────────────────┐
                    │      Customer       │
                    │  Gallery Link + PIN │
                    └──────────┬──────────┘
                               │
                               v
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │       Vercel        │
                    └──────────┬──────────┘
                               │
                         REST API / JWT
                               │
                               v
                    ┌─────────────────────┐
                    │ Node.js + Express   │
                    │       Render        │
                    └──────┬──────┬───────┘
                           │      │
                           │      │
                           v      v
                ┌──────────────┐  ┌──────────────┐
                │ MongoDB Atlas│  │    AWS S3    │
                │              │  │              │
                │ Users        │  │ Event Photos │
                │ Events       │  │              │
                │ Photos       │  │ Private      │
                │ Galleries    │  │ Bucket       │
                └──────────────┘  └──────────────┘

Database Design

The main database entities are:

User

Stores Admin and Team Member accounts.

Important fields:

_id
name
email
password
role
assignedEvents
createdAt
updatedAt

Roles:

ADMIN
TEAM_MEMBER
Event

Stores event information and assigned team members.

Important fields:

_id
name
description
createdBy
teamMembers
createdAt
updatedAt
Photo

Stores photo metadata.

Important fields:

_id
event
uploadedBy
filename
storageLocation
fileSize
mimeType
selected
createdAt
updatedAt

The actual image file is stored in AWS S3.

Gallery

Stores the customer-facing gallery information.

Important fields:

_id
event
createdBy
selectedPhotos
shareToken
pinHash
isPublished
publishedAt
createdAt
updatedAt

The gallery PIN is stored as a bcrypt hash rather than plain text.

Project Structure
trizenai-photo-sharing/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── features/
│       ├── pages/
│       ├── services/
│       └── ...
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   ├── scripts/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
├── .gitignore
└── README.md
Authentication and Authorization

JWT-based authentication is used for Admin and Team Member access.

Authentication flow:

Login
  |
  v
Backend validates credentials
  |
  v
JWT generated
  |
  v
Frontend stores authentication token
  |
  v
Token sent with protected API requests

Role-based authorization prevents users from accessing functionality outside their role.

Access Control

Admin:

Own events
All photos within owned events
Gallery management
Gallery publishing

Team Member:

Assigned events only
Own uploaded photos only
No gallery publishing

Customer:

Published gallery only
Valid gallery PIN required
No account required
Photo Upload and Storage

Photos are uploaded using multipart/form-data.

Supported image formats:

JPEG
PNG
WebP

Maximum file size:

10 MB per image

Maximum files per upload:

20

Uploaded files are stored in AWS S3 using event-specific object keys.

Example:

photos/<eventId>/<unique-file-id>.jpg

MongoDB stores only the photo metadata and S3 storage location.

AWS S3 Security

The S3 bucket is private.

Public access to the bucket is disabled.

Photo access is provided through temporary signed URLs generated by the backend.

This keeps the original S3 objects private while allowing authorized users to view photos.

Gallery Security

Customer galleries are protected using:

A unique share token
A 6-digit PIN
A separate gallery access token after successful PIN verification

The customer does not need to create an account.

Gallery access flow:

Shareable Gallery URL
        |
        v
Enter 6-digit PIN
        |
        v
PIN verification
        |
        v
Gallery access token
        |
        v
Published photos

Unpublished galleries cannot be accessed by customers.

Validation and Error Handling

The application validates:

Required fields
Name length
Email format
Password length
Image type
Image extension
Image size
File count
Event access
User role
Gallery ownership
Gallery PIN
Selected photo ownership/event association

Unauthorized requests return appropriate HTTP errors instead of exposing protected data.

API Overview
Authentication
POST /api/auth/register
POST /api/auth/login
Events
POST /api/events
POST /api/events/:eventId/members
GET  /api/events/my-events
GET  /api/events/:eventId
Photos
POST /api/photos/:eventId
GET  /api/photos/:eventId
PATCH /api/photos/:eventId/:photoId/select
GET  /api/photos/:eventId/:photoId
Galleries
GET   /api/galleries/:eventId
POST  /api/galleries/:eventId
PATCH /api/galleries/:eventId/:galleryId/photos
PATCH /api/galleries/:eventId/:galleryId/publish

POST /api/galleries/public/:shareToken/verify
GET  /api/galleries/public/:shareToken/photos
GET  /api/galleries/public/:shareToken/photos/:photoId
Local Development Setup
Prerequisites

Install:

Node.js
npm
MongoDB Atlas account
AWS account with an S3 bucket
Clone the Repository
git clone https://github.com/josphin342/trizenai-photo-sharing.git
cd trizenai-photo-sharing
Backend Setup
cd backend
npm install

Create:

backend/.env

Example:

PORT=5000
FRONTEND_URL=http://localhost:5173

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your_s3_bucket_name

Start the backend:

npm start

The backend runs on:

http://localhost:5000
Frontend Setup

Open another terminal:

cd frontend
npm install

Create:

frontend/.env

Example:

VITE_API_URL=http://localhost:5000/api

Start the frontend:

npm run dev

The frontend runs on the Vite development server.

Environment Variables
Backend
PORT
FRONTEND_URL
MONGODB_URI
JWT_SECRET
JWT_EXPIRES_IN
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET
Frontend
VITE_API_URL

Never commit actual .env files or secret credentials to GitHub.

Testing

Backend automated tests are implemented using:

Jest
Supertest
mongodb-memory-server

Run:

cd backend
npm test

The test suite covers:

Authentication
Event access
Team Member authorization
Photo access controls
Gallery creation
Gallery selection validation
Gallery publishing
Gallery PIN verification
Customer gallery access
Draft gallery updates
Production Deployment
Frontend

The React frontend is deployed on Vercel.

Production frontend:

https://trizenai-photo-sharing-three.vercel.app
Backend

The Node.js/Express backend is deployed on Render.

Production backend:

https://trizenai-photo-sharing-1.onrender.com
Database

MongoDB Atlas is used for production database storage.

Photo Storage

AWS S3 is used for private object storage of uploaded photos.

Production Architecture
Vercel
  │
  │ HTTPS
  v
React Frontend
  │
  │ REST API
  v
Render
Node.js + Express
  │
  ├───────────────┐
  │               │
  v               v
MongoDB Atlas    AWS S3
Database         Photo Storage
Security Considerations
Passwords are hashed using bcryptjs.
JWT is used for authenticated API access.
Role-based authorization protects Admin and Team Member endpoints.
Team Members can access only assigned events.
Team Members can view only their own uploaded photos.
S3 bucket remains private.
Signed URLs are used for image access.
Gallery PINs are stored as hashes.
Secrets are stored in environment variables.
.env files are excluded from Git.
Known Limitations

The current implementation focuses on the core requirements of the internship challenge.

Optional bonus features such as:

Image thumbnails/resizing
Pagination/infinite scrolling
Search/filtering
Bulk upload improvements
Download functionality
Gallery expiration
CDN integration
CI/CD pipeline

are not the primary focus of the current implementation.

Demo Flow
Admin
Login
  ↓
Create Event
  ↓
Assign Team Members
  ↓
View Team Photos
  ↓
Select Photos
  ↓
Create Gallery
  ↓
Publish Gallery
  ↓
Copy Gallery Link
Team Member
Login
  ↓
View Assigned Events
  ↓
Open Event
  ↓
Upload Photos
  ↓
View Own Uploaded Photos
Customer
Open Gallery Link
  ↓
Enter PIN
  ↓
Access Gallery
  ↓
Browse Published Photos
Demo Credentials
Admin
Email: <ADD_DEMO_ADMIN_EMAIL>
Password: <ADD_DEMO_ADMIN_PASSWORD>
Team Member
Email: <ADD_DEMO_TEAM_MEMBER_EMAIL>
Password: <ADD_DEMO_TEAM_MEMBER_PASSWORD>
Demo Gallery
Gallery URL: <ADD_DEMO_GALLERY_URL>
PIN: <ADD_DEMO_GALLERY_PIN>

Do not commit private production credentials or AWS/MongoDB secrets to the repository.

Submission Checklist
[ ] Source code pushed to GitHub
[ ] Frontend deployed
[ ] Backend deployed
[ ] MongoDB Atlas connected
[ ] AWS S3 configured
[ ] Admin workflow tested
[ ] Team Member workflow tested
[ ] Customer workflow tested
[ ] Authentication tested
[ ] Authorization tested
[ ] Gallery PIN tested
[ ] Automated tests passing
[ ] Production build successful
[ ] README completed
[ ] Secrets excluded from repository
[ ] Demo credentials prepared
[ ] Demo gallery URL and PIN prepared
Project Repository

GitHub:

https://github.com/josphin342/trizenai-photo-sharing


### Important

I intentionally left these as placeholders:

```text
<ADD_DEMO_ADMIN_EMAIL>
<ADD_DEMO_ADMIN_PASSWORD>
<ADD_DEMO_TEAM_MEMBER_EMAIL>
<ADD_DEMO_TEAM_MEMBER_PASSWORD>
<ADD_DEMO_GALLERY_URL>
<ADD_DEMO_GALLERY_PIN>


---

## Demo Credentials

### Admin

Email: `admin@trizenai.com`  
Password: `Admin@12345`

### Team Member

Email: `john@trizenai.com`  
Password: `John@12345`

### Demo Gallery

Gallery URL:

https://trizenai-photo-sharing-three.vercel.app/gallery/ff7c60a8914357d4334fa91b718f9fbad1191b1b6feea51e84bfc6e7ad7f5762

Gallery PIN: `123456`

---

## Production Deployment

### Frontend

https://trizenai-photo-sharing-three.vercel.app

### Backend API

https://trizenai-photo-sharing-1.onrender.com
