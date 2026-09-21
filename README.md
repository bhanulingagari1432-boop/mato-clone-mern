# Mato Clone - MERN College Project

A college-level Mato/Myntra-style fashion e-commerce clone.

## Important
This project intentionally does NOT implement real authentication or authorization.
Login checks email/password from MongoDB and stores the returned user in localStorage.
There are no JWTs, sessions, auth middleware, password hashing, or protected APIs.
Do not use this authentication approach in production.

## Backend
```bash
cd backend
npm install
npm start
```
Default MongoDB:
`mongodb://127.0.0.1:27017/mato_clone`

For MongoDB Atlas:
```bash
MONGO_URI=your_mongodb_connection_string npm start
```

## Frontend
```bash
cd frontend
npm install
npm run dev
```

For deployed backend, create `frontend/.env`:
```env
VITE_API_URL=https://your-render-backend.onrender.com
```

Restart Vite after changing `.env`.

## Main pages
- `/` Home
- `/products` Products/search/filter/sort
- `/login` Login
- `/register` Registration
- `/cart` Cart
- `/wishlist` Wishlist
- `/checkout` Checkout
- `/orders` Orders
- `/admin` Admin product management

## Notes
The backend keeps CRUD directly in `server.js` as requested.
