# 🛍️ ThriftHub KE

![Python](https://img.shields.io/badge/Python-3.13-blue)
![Django](https://img.shields.io/badge/Django-5.x-green)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Vite](https://img.shields.io/badge/Vite-Latest-purple)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![License](https://img.shields.io/badge/License-Educational-orange)

---

## 📖 About the Project

**ThriftHub KE** is a full-stack e-commerce platform designed to modernize the second-hand clothing market in Kenya.

The system enables customers to browse products, add items to their wishlist or shopping cart, purchase clothing using M-Pesa or Cash on Delivery, and track their orders. Administrators can manage products, suppliers, inventory, coupons, analytics, and customer orders through a secure dashboard.

The project was developed as a final year Bachelor of Business Information Technology (BBIT) project and demonstrates the implementation of modern web technologies using Django REST Framework and React.

---

# 🎯 Objectives

The objectives of the project are to:

- Develop an online platform for selling second-hand clothing.
- Improve inventory management.
- Simplify order processing.
- Provide secure customer authentication.
- Integrate modern payment options.
- Provide administrators with business analytics.
- Demonstrate a scalable full-stack architecture.

---

# ✨ Features

## Customer Features

- User Registration
- User Login
- JWT Authentication
- Product Browsing
- Product Search
- Category Filtering
- Product Details
- Shopping Cart
- Wishlist
- Coupon Application
- Secure Checkout
- M-Pesa Payment (Sandbox)
- Cash on Delivery
- Order Tracking
- Order History
- Profile Management
- Product Reviews

---

## Administrator Features

- Secure Admin Dashboard
- Product Management
- Category Management
- Supplier Management
- Bale Inventory Tracking
- Coupon Management
- Customer Order Management
- Stock Monitoring
- Low Stock Alerts
- Analytics Dashboard
- Sales Reports
- Audit Logs

---

# 🏗️ System Architecture

```
                React Frontend
                       │
                REST API Requests
                       │
                       ▼
          Django REST Framework Backend
                       │
                       ▼
                 PostgreSQL Database
```

---

# 🛠️ Technology Stack

## Frontend

- React
- Vite
- Tailwind CSS
- React Router
- React Hook Form
- Axios

---

## Backend

- Python
- Django
- Django REST Framework
- JWT Authentication

---

## Database

- PostgreSQL

---

## Development Tools

- Git
- GitHub
- Docker
- Postman
- VS Code

---

# 📂 Project Structure

```
ThriftHub/
│
├── backend/
│   ├── apps/
│   ├── config/
│   ├── payments/
│   ├── requirements/
│   └── manage.py
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│
└── README.md
```

---

# ⚙️ Installation Guide

## 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/thrifthub.git
```

---

## 2. Navigate into the project

```bash
cd thrifthub
```

---

## 3. Backend Setup

Navigate to the backend

```bash
cd backend
```

Activate the virtual environment

Windows

```powershell
.\.venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements/dev.txt
```

Run migrations

```bash
python manage.py migrate
```

Create an administrator account

```bash
python manage.py createsuperuser
```

Start the backend

```bash
python manage.py runserver
```

The backend will be available at

```
http://127.0.0.1:8000
```

---

## 4. Frontend Setup

Open another terminal

Navigate to frontend

```bash
cd frontend
```

Install packages

```bash
npm install
```

Run the frontend

```bash
npm run dev
```

Open

```
http://localhost:5173
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend directory.

Example:

```
SECRET_KEY=

DEBUG=True

DB_NAME=

DB_USER=

DB_PASSWORD=

DB_HOST=localhost

DB_PORT=5432

MPESA_CONSUMER_KEY=

MPESA_CONSUMER_SECRET=

MPESA_PASSKEY=
```

---

# 🌐 API Endpoints

## Authentication

```
POST /api/auth/login/
POST /api/auth/register/
POST /api/auth/logout/
```

---

## Products

```
GET /api/catalog/products/
GET /api/catalog/categories/
```

---

## Orders

```
POST /api/orders/
GET /api/orders/history/
```

---

## Inventory

```
GET /api/inventory/
```

---

## Analytics

```
GET /api/analytics/
```

---

# 📸 Screenshots

Add screenshots in the following section.

```
Home Page

Login Page

Products Page

Shopping Cart

Checkout

Admin Dashboard

Analytics Dashboard
```

---

# 🧪 Running Tests

Backend

```bash
pytest
```

or

```bash
python manage.py test
```

---


# 🔮 Future Improvements

- Live M-Pesa Integration
- Email Notifications
- SMS Notifications
- AI Product Recommendations
- Mobile Application
- Vendor Marketplace
- Real-time Chat Support
- ElasticSearch Integration
- Product Recommendation Engine

---

# 📚 Documentation

Additional documentation is available in the `docs` folder.

- Installation Guide
- API Documentation
- Database Documentation
- Deployment Guide
- Testing Guide
- Future Improvements

---

# 👨‍💻 Author

**Shekinah Vugutsa**

Bachelor of Business Information Technology (BBIT)

Riara University

GitHub:
https://github.com/YOUR_USERNAME

LinkedIn:
(Add your LinkedIn profile)

---

# 📄 License

This project was developed for educational purposes as part of a Bachelor of Business Information Technology final year project.

© 2026 Shekinah Vugutsa. All Rights Reserved.
