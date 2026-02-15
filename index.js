const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'aircond-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));
app.use(express.static(path.join(__dirname, 'public')));

// Database setup - use /tmp directory on Vercel for write access
const dbPath = process.env.VERCEL ? '/tmp/aircond.db' : './db/aircond.db';
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('DB error:', err);
    else console.log(`Connected to SQLite database at ${dbPath}`);
});

// Initialize schema
const schema = `
-- AirCond CRUD Platform Database Schema

-- Users (staff/admins)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'staff', -- admin, staff
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services/Bookings
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    service_type TEXT NOT NULL, -- cleaning, repair, installation, gas_top_up
    description TEXT,
    scheduled_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    technician_id INTEGER,
    total_amount REAL DEFAULT 0.0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (technician_id) REFERENCES users(id)
);

-- Inventory (parts/units)
CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    part_number TEXT,
    category TEXT, -- filter, coil, capacitor, gas, other
    stock INTEGER DEFAULT 0,
    unit_price REAL DEFAULT 0.0,
    supplier TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service History (linked to services)
CREATE TABLE IF NOT EXISTS service_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    action TEXT NOT NULL, -- assigned, started, completed, cancelled
    performed_by INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- Insert default admin user (password: admin123)
INSERT OR IGNORE INTO users (username, password_hash, full_name, role)
VALUES ('admin', '$2a$10$3K0D/4v8a2yVQ6d6Kv6b/eX0qLZ8N8Q5h9V5g9V8v5j8kLmN0bV9cX8zLmN0bV9cX8zLmN0bV9cX8z', 'System Administrator', 'admin');

-- Insert sample inventory
INSERT OR IGNORE INTO inventory (name, part_number, category, stock, unit_price, supplier)
VALUES 
    ('Air Filter', 'AF-500', 'filter', 50, 25.0, 'FilterCo'),
    ('Compressor Capacitor', 'CC-220', 'capacitor', 30, 120.0, 'ElectroParts'),
    ('R410A Gas (1kg)', 'R410A-1', 'gas', 100, 80.0, 'GasSupply'),
    ('Coil Cleaner', 'CC-500', 'other', 200, 15.0, 'Chemicals Inc.');

-- Insert sample customer
INSERT OR IGNORE INTO customers (name, phone, email, address, notes)
VALUES ('Ahmad Zaki', '012-3456789', 'ahmad@example.com', 'Subang Jaya, Selangor', 'Regular client, prefers weekend slots.');
`;

db.exec(schema, (err) => {
    if (err) console.error('Schema error:', err);
    else console.log('Database schema ready.');
});

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// ========== ROUTES ==========

// ----- AUTH -----
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT id, password_hash FROM users WHERE username = ?', [username], (err, row) => {
        if (err || !row) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        bcrypt.compare(password, row.password_hash, (err, match) => {
            if (match) {
                req.session.userId = row.id;
                res.json({ success: true, redirect: '/dashboard' });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// ----- DASHBOARD -----
app.get('/dashboard', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// ----- CUSTOMERS -----
app.get('/api/customers', requireAuth, (req, res) => {
    db.all('SELECT * FROM customers ORDER BY created_at DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/customers', requireAuth, (req, res) => {
    const { name, phone, email, address, notes } = req.body;
    db.run(
        'INSERT INTO customers (name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?)',
        [name, phone, email, address, notes],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Customer added' });
    });
});

app.put('/api/customers/:id', requireAuth, (req, res) => {
    const { name, phone, email, address, notes } = req.body;
    db.run(
        'UPDATE customers SET name=?, phone=?, email=?, address=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
        [name, phone, email, address, notes, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Customer updated' });
    });
});

app.delete('/api/customers/:id', requireAuth, (req, res) => {
    db.run('DELETE FROM customers WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Customer deleted' });
    });
});

// ----- SERVICES -----
app.get('/api/services', requireAuth, (req, res) => {
    db.all(`
        SELECT s.*, c.name AS customer_name, c.phone AS customer_phone,
               u.full_name AS technician_name
        FROM services s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN users u ON s.technician_id = u.id
        ORDER BY s.scheduled_date DESC
    `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/services', requireAuth, (req, res) => {
    const { customer_id, service_type, description, scheduled_date, status, technician_id, total_amount, notes } = req.body;
    db.run(
        `INSERT INTO services 
        (customer_id, service_type, description, scheduled_date, status, technician_id, total_amount, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [customer_id, service_type, description, scheduled_date, status, technician_id, total_amount, notes],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Service added' });
    });
});

// ----- INVENTORY -----
app.get('/api/inventory', requireAuth, (req, res) => {
    db.all('SELECT * FROM inventory ORDER BY name', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/inventory', requireAuth, (req, res) => {
    const { name, part_number, category, stock, unit_price, supplier, notes } = req.body;
    db.run(
        `INSERT INTO inventory 
        (name, part_number, category, stock, unit_price, supplier, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, part_number, category, stock, unit_price, supplier, notes],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Inventory item added' });
    });
});

// ----- STATS -----
app.get('/api/stats', requireAuth, (req, res) => {
    const stats = {};
    db.get('SELECT COUNT(*) as total FROM customers', (err, row) => {
        stats.customers = row.total;
        db.get('SELECT COUNT(*) as total FROM services', (err, row) => {
            stats.services = row.total;
            db.get('SELECT COUNT(*) as total FROM services WHERE status = "pending"', (err, row) => {
                stats.pending = row.total;
                db.get('SELECT SUM(total_amount) as revenue FROM services WHERE status = "completed"', (err, row) => {
                    stats.revenue = row.revenue || 0;
                    res.json(stats);
                });
            });
        });
    });
});

// ----- START -----
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

app.listen(PORT, () => {
    console.log(`AirCond CRUD platform running at http://localhost:${PORT}`);
});