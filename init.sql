-- VendorConnect Database Initialization Script
-- This script creates all necessary tables and initial data for the VendorConnect application

-- Drop tables if they exist (for clean installation)
DROP TABLE IF EXISTS vendor_contracts CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS session CASCADE;

-- Create Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('vendor', 'wholesaler')),
    business_name VARCHAR(255),
    address TEXT,
    free_attempts_used INTEGER DEFAULT 0,
    cancellations_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Contracts table
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    wholesaler_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    daily_quantity INTEGER NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
    delivery_date DATE NOT NULL,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Vendor Contracts table (for tracking accepted contracts)
CREATE TABLE vendor_contracts (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor_id, contract_id)
);

-- Create Sessions table (for express-session)
CREATE TABLE session (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_contracts_wholesaler ON contracts(wholesaler_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);
CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_contract ON orders(contract_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX idx_vendor_contracts_vendor ON vendor_contracts(vendor_id);
CREATE INDEX idx_vendor_contracts_contract ON vendor_contracts(contract_id);
CREATE INDEX idx_session_expire ON session(expire);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development/testing (optional)
-- This section creates realistic sample data for the application

-- Sample Wholesalers
INSERT INTO users (name, email, password, phone, role, business_name, address) VALUES
('Rajesh Kumar', 'rajesh@freshproduce.com', '$2b$10$rQ7GXmBc.bxV6F4zJZKYAObJYGKsqNEFHJFZF8ks8Q2Q2qzKJ4F5C', '+91-9876543210', 'wholesaler', 'Fresh Produce Co.', 'Wholesale Market, Sector 26, Mumbai, Maharashtra'),
('Priya Sharma', 'priya@grainexports.com', '$2b$10$rQ7GXmBc.bxV6F4zJZKYAObJYGKsqNEFHJFZF8ks8Q2Q2qzKJ4F5C', '+91-9876543211', 'wholesaler', 'Golden Grain Exports', 'Agricultural Market, Block A, Delhi'),
('Mohammad Ali', 'ali@dairyworld.com', '$2b$10$rQ7GXmBc.bxV6F4zJZKYAObJYGKsqNEFHJFZF8ks8Q2Q2qzKJ4F5C', '+91-9876543212', 'wholesaler', 'Dairy World Suppliers', 'Milk Colony, Pune, Maharashtra');

-- Sample Vendors
INSERT INTO users (name, email, password, phone, role, address) VALUES
('Sunita Devi', 'sunita@vendor.com', '$2b$10$rQ7GXmBc.bxV6F4zJZKYAObJYGKsqNEFHJFZF8ks8Q2Q2qzKJ4F5C', '+91-9876543213', 'vendor', 'Street Market, Karol Bagh, Delhi'),
('Ravi Patel', 'ravi@vendor.com', '$2b$10$rQ7GXmBc.bxV6F4zJZKYAObJYGKsqNEFHJFZF8ks8Q2Q2qzKJ4F5C', '+91-9876543214', 'vendor', 'Vegetable Market, Andheri, Mumbai'),
('Lakshmi Nair', 'lakshmi@vendor.com', '$2b$10$rQ7GXmBc.bxV6F4zJZKYAObJYGKsqNEFHJFZF8ks8Q2Q2qzKJ4F5C', '+91-9876543215', 'vendor', 'Morning Market, MG Road, Bangalore');

-- Sample Contracts
INSERT INTO contracts (wholesaler_id, product_name, daily_quantity, price_per_unit, duration_days, description, end_date) VALUES
(1, 'Fresh Tomatoes', 50, 25.00, 30, 'Premium quality tomatoes, delivered fresh daily. Grade A quality guaranteed.', CURRENT_DATE + INTERVAL '30 days'),
(1, 'Onions', 100, 18.00, 45, 'Farm fresh onions, properly sorted and cleaned. Bulk pricing available.', CURRENT_DATE + INTERVAL '45 days'),
(2, 'Basmati Rice', 25, 85.00, 60, 'Premium Basmati rice, 1121 variety. Long grain, aromatic quality.', CURRENT_DATE + INTERVAL '60 days'),
(2, 'Wheat Flour', 40, 32.00, 30, 'Fresh ground wheat flour, fine quality. Suitable for chapati and bread.', CURRENT_DATE + INTERVAL '30 days'),
(3, 'Fresh Milk', 20, 45.00, 15, 'Pure cow milk, delivered fresh twice daily. Fat content 4.5%.', CURRENT_DATE + INTERVAL '15 days'),
(3, 'Paneer', 10, 280.00, 20, 'Fresh homemade paneer, soft texture. Made from pure cow milk.', CURRENT_DATE + INTERVAL '20 days');

-- Sample Vendor Contract Acceptances
INSERT INTO vendor_contracts (vendor_id, contract_id) VALUES
(4, 1), -- Sunita accepts Fresh Tomatoes contract
(4, 5), -- Sunita accepts Fresh Milk contract
(5, 1), -- Ravi accepts Fresh Tomatoes contract
(5, 2), -- Ravi accepts Onions contract
(6, 3), -- Lakshmi accepts Basmati Rice contract
(6, 6); -- Lakshmi accepts Paneer contract

-- Sample Orders
INSERT INTO orders (vendor_id, contract_id, quantity, total_amount, status, delivery_date) VALUES
-- Recent orders (last 7 days)
(4, 1, 15, 375.00, 'delivered', CURRENT_DATE - INTERVAL '2 days'),
(4, 5, 5, 225.00, 'delivered', CURRENT_DATE - INTERVAL '2 days'),
(5, 1, 20, 500.00, 'delivered', CURRENT_DATE - INTERVAL '1 day'),
(5, 2, 30, 540.00, 'confirmed', CURRENT_DATE),
(6, 3, 8, 680.00, 'pending', CURRENT_DATE),
(6, 6, 3, 840.00, 'pending', CURRENT_DATE + INTERVAL '1 day'),

-- Older orders for historical data
(4, 1, 12, 300.00, 'delivered', CURRENT_DATE - INTERVAL '5 days'),
(5, 1, 18, 450.00, 'delivered', CURRENT_DATE - INTERVAL '4 days'),
(6, 3, 10, 850.00, 'delivered', CURRENT_DATE - INTERVAL '3 days'),
(4, 5, 8, 360.00, 'cancelled', CURRENT_DATE - INTERVAL '6 days');

-- Update delivered orders with delivery timestamps
UPDATE orders SET delivered_at = CURRENT_TIMESTAMP - INTERVAL '2 days' WHERE id = 1;
UPDATE orders SET delivered_at = CURRENT_TIMESTAMP - INTERVAL '2 days' WHERE id = 2;
UPDATE orders SET delivered_at = CURRENT_TIMESTAMP - INTERVAL '1 day' WHERE id = 3;
UPDATE orders SET delivered_at = CURRENT_TIMESTAMP - INTERVAL '5 days' WHERE id = 7;
UPDATE orders SET delivered_at = CURRENT_TIMESTAMP - INTERVAL '4 days' WHERE id = 8;
UPDATE orders SET delivered_at = CURRENT_TIMESTAMP - INTERVAL '3 days' WHERE id = 9;

-- Create a function to automatically set contract end dates
CREATE OR REPLACE FUNCTION set_contract_end_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_date IS NULL THEN
        NEW.end_date := CURRENT_DATE + INTERVAL '1 day' * NEW.duration_days;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic end date calculation
CREATE TRIGGER calculate_contract_end_date
    BEFORE INSERT OR UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION set_contract_end_date();

-- Create a function to track order statistics
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update free attempts used when order is placed without contract
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        -- Check if vendor has accepted this contract
        IF NOT EXISTS (
            SELECT 1 FROM vendor_contracts 
            WHERE vendor_id = NEW.vendor_id AND contract_id = NEW.contract_id
        ) THEN
            -- Increment free attempts used
            UPDATE users 
            SET free_attempts_used = COALESCE(free_attempts_used, 0) + 1
            WHERE id = NEW.vendor_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tracking user statistics
CREATE TRIGGER track_user_stats
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- Grant necessary permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vendorconnect_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vendorconnect_user;

-- Create views for common queries
CREATE VIEW active_contracts_with_stats AS
SELECT 
    c.*,
    u.name as wholesaler_name,
    u.business_name,
    u.phone as wholesaler_phone,
    COUNT(DISTINCT vc.vendor_id) as accepted_vendors,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total_amount ELSE 0 END), 0) as total_revenue
FROM contracts c
LEFT JOIN users u ON c.wholesaler_id = u.id
LEFT JOIN vendor_contracts vc ON c.id = vc.contract_id
LEFT JOIN orders o ON c.id = o.contract_id
WHERE c.status = 'active' AND c.end_date > CURRENT_DATE
GROUP BY c.id, u.name, u.business_name, u.phone;

CREATE VIEW vendor_order_summary AS
SELECT 
    u.id as vendor_id,
    u.name as vendor_name,
    u.phone,
    COUNT(o.id) as total_orders,
    COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN o.status IN ('pending', 'confirmed') THEN 1 END) as active_orders,
    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancelled_orders,
    COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total_amount ELSE 0 END), 0) as total_spent,
    u.free_attempts_used,
    u.cancellations_used
FROM users u
LEFT JOIN orders o ON u.id = o.vendor_id
WHERE u.role = 'vendor'
GROUP BY u.id, u.name, u.phone, u.free_attempts_used, u.cancellations_used;

-- Insert completion message
INSERT INTO users (name, email, password, role) VALUES 
('System', 'system@vendorconnect.com', 'no-login', 'vendor')
ON CONFLICT (email) DO NOTHING;

-- Database initialization completed
COMMENT ON DATABASE current_database() IS 'VendorConnect - Marketplace connecting street vendors with wholesale suppliers';
