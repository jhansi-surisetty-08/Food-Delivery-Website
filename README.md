# 🍽️ Food Delivery App — MERN Food Ordering Platform

An end-to-end food ordering platform built with the MERN stack, featuring a modern purple-themed UI, strict authentication flow, cart + order lifecycle, and an admin dashboard for operations.

![MERN](https://img.shields.io/badge/Stack-MERN-6c47ff?style=for-the-badge)
![React](https://img.shields.io/badge/Frontend-React-8b5cf6?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Backend-Node.js-a78bfa?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-6d28d9?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-5b21b6?style=for-the-badge)

---

## ✨ Why this project stands out

- 🔐 **Strict login experience**: users must authenticate before accessing the app.
- 🧾 **Real order flow**: browse → add to cart → checkout → track orders.
- 💳 **Payment-ready architecture** with Stripe integration hooks.
- 🛠️ **Operational admin panel** for food and order management.
- 🎨 **Consistent purple design system** with polished UI interactions.
- ⚡ **Clean full-stack structure** for easy extension and collaboration.

---

## 🧩 Tech Stack

### Frontend (`frontend`)
- React + Vite
- React Router
- Context API (state management)
- Axios

### Admin (`admin`)
- React + Vite
- CRUD workflows for menu and orders

### Backend (`backend`)
- Node.js + Express
- MongoDB + Mongoose
- JWT auth
- Bcrypt password hashing
- Stripe support

---

## 🗂️ Project Structure

```text
FDA/
├── frontend/   # Customer app
├── admin/      # Admin dashboard
└── backend/    # REST API + business logic
```

---

## 🚀 Quick Start

### 1) Clone

```bash
git clone <your-repo-url>
cd FDA
```

### 2) Install dependencies

```bash
npm --prefix backend install
npm --prefix frontend install
npm --prefix admin install
```

### 3) Configure environment

Create `backend/.env` (or update existing) with at least:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret
PORT=4000
```

### 4) Run apps

Backend:

```bash
npm --prefix backend run server
```

Frontend:

```bash
npm --prefix frontend run dev
```

Admin:

```bash
npm --prefix admin run dev
```

---

## 🌐 Local URLs

- Customer app: http://localhost:5173
- Admin app: http://localhost:5174
- API server: http://localhost:4000

---

## 🔑 Core Features

- Account creation and sign-in with server-side validation
- Invalid credential / invalid email / invalid password handling
- JWT-protected routes
- Dynamic food listing and filtering
- Cart persistence in database per user
- Place order and view order history
- Admin controls for menu and order management

---

## 🔌 API Highlights

Base URL: `http://localhost:4000/api`

- `POST /user/register` → create account
- `POST /user/login` → sign in
- `GET /food/list` → fetch foods
- `POST /cart/add` → add item to cart
- `POST /cart/remove` → remove item
- `POST /cart/get` → retrieve user cart
- `POST /order/place` → place order
- `POST /order/userorders` → fetch user orders

## 🤝 Contributing

Contributions are welcome and appreciated.

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/amazing-feature`
3. Commit your changes: `git commit -m "feat: add amazing feature"`
4. Push to the branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

If you find this project useful, consider giving it a ⭐ — it really help 




