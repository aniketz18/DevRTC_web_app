# Deployment Guide

This application is ready for deployment. It is built as a MERN stack application where the Node.js server serves the React frontend in production.

## Prerequisites
- Node.js (v18+)
- MongoDB (Atlas or local)

## Environment Variables

### Server (`server/.env`)
Ensure you have the following variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=production
CLIENT_URL=https://your-domain.com
```

### Client (`client/.env`)
For local development:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```
*Note: In production, if serving from the same domain, these can be omitted as the code defaults to relative paths.*

## Deployment Steps (e.g., Render, Railway, VPS)

1.  **Build the Frontend**:
    Navigate to the `client` folder and run:
    ```bash
    cd client
    npm install
    npm run build
    ```
    This will create a `dist` folder with the production build.

2.  **Setup the Server**:
    Navigate to the `server` folder:
    ```bash
    cd server
    npm install
    ```

3.  **Start the Application**:
    From the `server` folder:
    ```bash
    npm start
    ```
    The server will start on port 5000 (or `PORT` env var) and serve the frontend at the root URL `/`.

## Verify Deployment
- Open your browser and visit `http://localhost:5000` (or your production URL).
- You should see the DevRTC app.
- Login/Register should work via `/api/auth`.
- Video calls should work via Socket.IO/WebRTC.
