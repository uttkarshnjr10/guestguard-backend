# ApnaManager - Hotel Management Backend API

ApnaManager is a secure and scalable backend service for a guest data management system designed for the hospitality industry and law enforcement. It features a robust, role-based RESTful API that serves **Regional Admins**, **Hotel Staff**, and **Police Officials** with segregated permissions and capabilities.

The entire application is containerized with Docker, allowing for a seamless, one-command setup of the backend, database, and cache.

-----

## Core Features

  * **Secure Authentication:** Implements stateless authentication using **JSON Web Tokens (JWT)** and securely hashes user passwords with **bcrypt**.
  * **Role-Based Access Control (RBAC):** Middleware protects all sensitive endpoints, ensuring users (Admin, Hotel, Police) can only access resources appropriate for their role.
  * **Containerized Environment:** Fully containerized with **Docker** and **Docker Compose**, allowing developers to spin up the entire application stack (Node.js, MongoDB, Redis) with a single command (`docker-compose up`).
  * **Cloud Media Management:** Integrates **Multer** and **Cloudinary** for efficient handling of image uploads, ensuring guest photos and ID documents are stored securely in the cloud.
  * **High-Performance Caching:** Uses **Redis** to manage a JWT blacklist for instant user logout and can be extended for high-performance caching of frequent database queries.
  * **Automated Services:** Features modules for on-the-fly PDF receipt generation with **PDFKit** and automated email delivery for user credentials and notifications via **SendGrid**.
  * **External API Integration:** Connects with the **Google Cloud Vision API** to perform Optical Character Recognition (OCR) on guest ID cards, enabling automated data extraction.

-----

## Technology Stack

\<div align="center"\>

**Core Backend**<br>
\<img src="[https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge\&logo=node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js)" alt="Node.js" /\>
\<img src="[https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge\&logo=express](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express)" alt="Express.js" /\>

**Database & Caching**<br>
\<img src="[https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge\&logo=mongodb](https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb)" alt="MongoDB" /\>
\<img src="[https://img.shields.io/badge/Mongoose-8.x-47A248?style=for-the-badge\&logo=mongodb](https://img.shields.io/badge/Mongoose-8.x-47A248?style=for-the-badge&logo=mongodb)" alt="Mongoose" /\>
\<img src="[https://img.shields.io/badge/Redis-7.x-DC382D?style=for-the-badge\&logo=redis](https://img.shields.io/badge/Redis-7.x-DC382D?style=for-the-badge&logo=redis)" alt="Redis" /\>

**Authentication & File Handling**<br>
\<img src="[https://img.shields.io/badge/JWT-JSON\_Web\_Tokens-000000?style=for-the-badge\&logo=jsonwebtokens](https://img.shields.io/badge/JWT-JSON_Web_Tokens-000000?style=for-the-badge&logo=jsonwebtokens)" alt="JWT" /\>
\<img src="[https://img.shields.io/badge/Bcrypt-Hashing-6242F5?style=for-the-badge\&logo=springsecurity](https://img.shields.io/badge/Bcrypt-Hashing-6242F5?style=for-the-badge&logo=springsecurity)" alt="Bcrypt" /\>
\<img src="[https://img.shields.io/badge/Multer-File\_Uploads-orange?style=for-the-badge](https://img.shields.io/badge/Multer-File_Uploads-orange?style=for-the-badge)" alt="Multer" /\>

**External Services & APIs**<br>
\<img src="[https://img.shields.io/badge/Cloudinary-Media\_Storage-3448C5?style=for-the-badge\&logo=cloudinary](https://img.shields.io/badge/Cloudinary-Media_Storage-3448C5?style=for-the-badge&logo=cloudinary)" alt="Cloudinary" /\>
\<img src="[https://img.shields.io/badge/SendGrid-Email\_Delivery-1A82E2?style=for-the-badge\&logo=sendgrid](https://img.shields.io/badge/SendGrid-Email_Delivery-1A82E2?style=for-the-badge&logo=sendgrid)" alt="SendGrid" /\>
\<img src="[https://img.shields.io/badge/Google\_Cloud\_Vision-OCR-4285F4?style=for-the-badge\&logo=googlecloud](https://img.shields.io/badge/Google_Cloud_Vision-OCR-4285F4?style=for-the-badge&logo=googlecloud)" alt="Google Cloud Vision" /\>

\</div\>

-----

## Getting Started

Follow these instructions to get a local copy of the project up and running.

### Prerequisites

  * **Docker** and **Docker Compose**
  * **Node.js** (v18.x or later) for local development (optional)

### 🚀 Run with Docker (Recommended)

This is the fastest and most reliable way to run the application.

1.  **Clone the repository:**

    ```sh
    git clone [https://github.com/uttkarshnjr10/guestguard-backend.git](https://github.com/uttkarshnjr10/guestguard-backend.git)
    cd guestguard-backend
    ```

2.  **Configure Environment:**
    Create a `.env` file in the root directory and add the necessary environment variables (see `.env` Configuration section below). **Important:** For Docker, the database and Redis hosts must be the service names.

    ```ini
    MONGO_URI=mongodb://mongo:27017/ApnaManager
    REDIS_URL=redis://redis:6379
    ```

3.  **Build and Run:**

    ```sh
    docker-compose up
    ```

    To run in the background, use `docker-compose up -d`. The API will be available at `http://localhost:5003`.

### 💻 Run Locally (Manual Setup)

1.  **Install Dependencies:**

    ```sh
    npm install
    ```

2.  **Configure Environment:**
    Create a `.env` file and fill in the variables. Ensure your local MongoDB and Redis services are running.

    ```ini
    MONGO_URI=mongodb://localhost:27017/ApnaManager
    REDIS_URL=redis://localhost:6379
    ```

3.  **Run the Application:**

    ```sh
    npm run dev
    ```

-----

## `.env` Configuration

Create a `.env` file in the project root and add the following variables:

```ini
# --- Application Configuration ---
PORT=5003
NODE_ENV=development

# --- Database & Cache ---
# For Docker:
MONGO_URI=mongodb://mongo:27017/ApnaManager
REDIS_URL=redis://redis:6379
# For Local:
# MONGO_URI=mongodb://localhost:27017/ApnaManager
# REDIS_URL=redis://localhost:6379

# --- Authentication & Security ---
JWT_SECRET=your_strong_jwt_secret_key

# --- Initial Admin User (for seeding) ---
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=a_strong_and_secure_password

# --- Third-Party Service Keys ---
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=your_verified_sendgrid_email@example.com
```

-----

## API Endpoints Overview

A summary of the main API routes available in the application.

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | | | |
| `POST` | `/api/auth/login` | Public | Authenticate a user and receive a JWT. |
| `POST` | `/api/auth/logout`| Private | Log out a user and invalidate their token. |
| **Admin** | | | |
| `POST` | `/api/users/register` | Admin | Create a new Hotel or Police user. |
| `GET` | `/api/users/hotels` | Admin | Get a list of all hotel users. |
| `PUT` | `/api/users/:id/status`| Admin | Suspend or activate a user account. |
| `POST` | `/api/stations` | Admin | Create a new police station. |
| **Hotel** | | | |
| `POST` | `/api/guests/register`| Hotel | Register a new guest with ID and photos. |
| `GET` | `/api/guests/all` | Hotel | Get a list of all guests for the hotel. |
| `PUT` | `/api/guests/:id/checkout`| Hotel | Check a guest out and email a receipt. |
| **Police** | | | |
| `POST` | `/api/police/search`| Police | Search for guests across all hotels. |
| `POST` | `/api/police/alerts`| Police | Create a security alert for a guest. |
| `GET`| `/api/police/guests/:id/history` | Police | Get a guest's complete stay history. |