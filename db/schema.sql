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