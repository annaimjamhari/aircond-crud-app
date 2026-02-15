# AirCond CRUD Platform

A basic web‑app CRUD platform for an air‑conditioning company. Manage customers, service bookings, inventory, and track service history.

## Features

- **Customer Management** – Add, view, update, delete customer records
- **Service Bookings** – Schedule cleaning, repair, installation, gas top‑up
- **Inventory Tracking** – Parts, units, stock levels, pricing
- **Dashboard** – Overview stats, recent activity
- **Authentication** – Session‑based login/logout
- **Responsive UI** – Mobile‑friendly Tailwind design

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (file‑based, no external DB needed)
- **Frontend:** Vanilla HTML/CSS/JS + Tailwind CSS
- **Session:** express‑session
- **Security:** bcryptjs for password hashing

## Installation

1. Clone the repository
   ```bash
   cd /data/.openclaw/workspace/aircond-crud
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Initialize the database
   ```bash
   node -e "const fs = require('fs'); const sql = fs.readFileSync('./db/schema.sql', 'utf8'); const sqlite3 = require('sqlite3').verbose(); const db = new sqlite3.Database('./db/aircond.db'); db.exec(sql, (err) => { if (err) console.error(err); else console.log('Database ready.'); db.close(); });"
   ```

4. Start the server
   ```bash
   npm start
   ```

5. Open in browser
   ```
   http://localhost:3000
   ```

## Default Credentials

- **Username:** `admin`
- **Password:** `admin123`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List all customers |
| POST | `/api/customers` | Add new customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |
| GET | `/api/services` | List all services |
| POST | `/api/services` | Add new service |
| GET | `/api/inventory` | List inventory |
| POST | `/api/inventory` | Add inventory item |
| GET | `/api/stats` | Dashboard stats |

## Project Structure

```
aircond-crud/
├── index.js                 # Main server
├── package.json
├── db/
│   ├── schema.sql          # Database schema
│   └── aircond.db          # SQLite database (auto‑created)
├── public/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── views/
│   ├── login.html
│   └── dashboard.html
└── README.md
```

## Deployment

### Local
```bash
npm start
```

### Vercel
1. Push to GitHub
2. Import in Vercel dashboard
3. Set environment variables:
   - `SESSION_SECRET` (random string)

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## License

MIT. Use freely for your air‑conditioning business.