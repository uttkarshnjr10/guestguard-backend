# ApnaManager - Backend API

ApnaManager is the backend service for a comprehensive guest data management system built for the hospitality industry. It provides a secure, centralized platform for hotels to manage guest information and for law enforcement officials to access data securely, in compliance with regional regulations.

The application features a robust, role-based API designed to serve **Regional Admins**, **Hotel Staff**, and **Police Officials**, with distinct permissions and capabilities for each role.

---

## Core Backend Features

* **Secure API Architecture:** Implements a robust security layer using JWT for stateless authentication, bcrypt for password hashing, and security headers via Helmet.
* **Role-Based Access Control (RBAC):** Secure, segregated endpoints for Admins, Hotels, and Police, ensuring users only access data they are authorized to see.
* **Data Management API:** Provides a complete set of RESTful endpoints for creating, reading, updating, and deleting data related to users, hotels, and guests.
* **File Upload Handling:** Uses **Multer** for efficient handling of `multipart/form-data` and seamless integration with **Cloudinary** for secure cloud storage of guest photos and ID documents.
* **Session & Cache Management:** Leverages **Redis** for high-performance caching and for managing a token blacklist to instantly invalidate JWTs upon user logout.
* **OCR Integration:** Contains server-side logic that integrates with the Google Cloud Vision API to perform OCR on uploaded ID cards, automating data extraction.
* **Automated Services:** Includes modules for automated PDF receipt generation using **PDFKit** and reliable email delivery for user notifications and checkouts via **SendGrid**.
* **Advanced Search & Auditing:** Features optimized search endpoints with database indexing for fast queries and maintains a comprehensive audit trail for all sensitive data access.

---

## Technology Stack

<div align="center">

**Core Backend**<br>
<img src="https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js" alt="Node.js" />
<img src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express" alt="Express.js" />

**Database & Caching**<br>
<img src="https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
<img src="https://img.shields.io/badge/Mongoose-8.x-47A248?style=for-the-badge&logo=mongodb" alt="Mongoose" />
<img src="https://img.shields.io/badge/Redis-7.x-DC382D?style=for-the-badge&logo=redis" alt="Redis" />

**Authentication & File Handling**<br>
<img src="https://img.shields.io/badge/JWT-JSON_Web_Tokens-000000?style=for-the-badge&logo=jsonwebtokens" alt="JWT" />
<img src="https://img.shields.io/badge/Bcrypt-Hashing-6242F5?style=for-the-badge&logo=springsecurity" alt="Bcrypt" />
<img src="https://img.shields.io/badge/Multer-File_Uploads-orange?style=for-the-badge" alt="Multer" />

**External Services & APIs**<br>
<img src="https://img.shields.io/badge/Cloudinary-Media_Storage-3448C5?style=for-the-badge&logo=cloudinary" alt="Cloudinary" />
<img src="https://img.shields.io/badge/SendGrid-Email_Delivery-1A82E2?style=for-the-badge&logo=sendgrid" alt="SendGrid" />
<img src="https://img.shields.io/badge/Google_Cloud_Vision-OCR-4285F4?style=for-the-badge&logo=googlecloud" alt="Google Cloud Vision" />

</div>

---

## Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing purposes.

### Prerequisites

You will need the following software installed on your machine:

* **Node.js** (v18.x or later)
* **MongoDB** (v6.x or later)
* **Redis** (v7.x or later)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/uttkarshnjr10/guestguard-backend.git](https://github.com/uttkarshnjr10/guestguard-backend.git)
    cd guestguard-backend
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

### Environment Configuration

1.  Create a `.env` file in the root of the project by making a copy of the example file:
    ```sh
    cp .env.example .env
    ```

2.  Open the `.env` file and update the variables with your specific configuration:

    ```ini
    # --- Application Configuration ---
    PORT=5000
    NODE_ENV=development
    FRONTEND_URL=http://localhost:5173

    # --- Database & Cache ---
    MONGO_URI=your_mongodb_connection_string
    REDIS_URL=redis://localhost:6379

    # --- Authentication & Security ---
    JWT_SECRET=your_strong_jwt_secret_key

    # --- Initial Admin User (for seeding) ---
    ADMIN_USERNAME=admin
    ADMIN_EMAIL=admin@example.com
    ADMIN_PASSWORD=a_strong_and_secure_password

    # --- Third-Party Service Keys ---
    # Cloudinary for file storage
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret

    # SendGrid for sending emails
    SENDGRID_API_KEY=your_sendgrid_api_key
    FROM_EMAIL=your_verified_sendgrid_email@example.com
    ```

### Running the Application

1.  **Seed the database:**
    This command will create the initial Regional Admin user based on the credentials in your `.env` file.
    ```sh
    npm run seed
    ```

2.  **Start the development server:**
    This will run the application with `nodemon`, which automatically restarts the server on file changes.
    ```sh
    npm run dev
    ```

3.  **Start the production server:**
    For production, use the `start` command.
    ```sh
    npm start
    ```

The API will now be running on the port you specified in your `.env` file (e.g., `http://localhost:5000`).