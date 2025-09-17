<div align="center">
  <img src="https://placehold.co/600x250/3498db/ffffff?text=GuestGuard&font=sans" alt="GuestGuard Banner" />
  <h1>GuestGuard Backend API</h1>
  <p><b>Secure & centralized guest data management system for hotels, designed to streamline hospitality operations and assist law enforcement.</b></p>
  
  <p>
    <img src="https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js" alt="Node.js version" />
    <img src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express" alt="Express.js version" />
    <img src="https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB version" />
    <img src="https://img.shields.io/badge/Redis-7.x-DC382D?style=for-the-badge&logo=redis" alt="Redis version" />
  </p>
</div>

---

## 📜 About the Project
**GuestGuard** is a backend service built with **Node.js** and **Express** that powers a guest management platform for the hospitality sector.  
It provides **role-based APIs** for **Regional Admins, Hotel Staff, and Police Officials**, handling everything from user onboarding to **real-time guest registration, OCR-powered ID scanning, and inter-jurisdictional police alerts**.

---

## ✨ Core Features
- 🔑 **Role-Based Access Control (RBAC):** Separate, secure endpoints for Admins, Hotels, and Police.  
- 🏨 **User & Hotel Management:** Admins can create and manage hotel and police accounts.  
- 📝 **Guest Registration:** Hotels register guests with detailed info + document uploads.  
- 🖼 **Secure Image Handling:** Guest photos & ID docs stored on **Cloudinary**.  
- 🤖 **AI-Powered OCR:** Auto-fills guest forms by scanning ID cards with **Google Cloud Vision**.  
- 🔎 **Advanced Police Search:** Search by name, phone, or ID with full audit trails.  
- 📖 **Guest History & Alerts:** View complete stay history and add police alerts.  
- 📩 **Automated Emails & PDFs:** Beautiful PDF receipts emailed at checkout.  
- 🛡 **Security First:** JWT auth, bcrypt password hashing, rate limiting, Redis token blacklisting.  

---

## 🛠 Tech Stack
| Category         | Technology / Library |
|------------------|----------------------|
| Core Backend     | Node.js, Express |
| Database         | MongoDB, Mongoose |
| Caching & Tokens | Redis |
| Authentication   | JWT, bcrypt.js |
| File Uploads     | Multer, Cloudinary |
| Security         | Helmet, CORS, Rate Limit |
| Emails & PDFs    | SendGrid, PDFKit |
| OCR & AI         | Google Cloud Vision |
| Dev Tools        | Nodemon, Morgan, Dotenv |

---

## 🚀 Getting Started

### ✅ Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/)
- [Redis](https://redis.io/)

### 🔧 Installation
```bash
# Clone the repository
git clone https://github.com/uttkarshnjr10/guestguard-backend.git
cd guestguard-backend

# Install dependencies
npm install

---

⚙️ Environment Setup

Create a .env file (see .env.example) and configure:
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
SENDGRID_API_KEY=xxx
FROM_EMAIL=your_verified_email@example.com
FRONTEND_URL=http://localhost:5173
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=supersecret

▶️ Run the Server

# Seed initial Admin user
npm run seed

# Start development server
npm run dev

# Start production server
npm start
