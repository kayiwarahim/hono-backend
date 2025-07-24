CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference VARCHAR(255) UNIQUE NOT NULL,
  device_id VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  formatted_phone VARCHAR(20) NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'UGX',
  description TEXT DEFAULT 'WiFi Internet Package',
  relworx_reference VARCHAR(255),
  relworx_status VARCHAR(50) DEFAULT 'pending',
  relworx_message TEXT,
  relworx_response JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'mobile_money',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  ip_address INET,
  package_info JSONB,
  

  CONSTRAINT transactions_reference_unique UNIQUE (reference)
);

CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_transactions_device_id ON transactions(device_id);
CREATE INDEX idx_transactions_phone ON transactions(phone);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_relworx_status ON transactions(relworx_status);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();