CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,  -- this is what your API uses
    fullname VARCHAR(255) NOT NULL
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DOCUMENTS TABLE
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    file_url TEXT,
    original_filename TEXT,
    file_size BIGINT,
    file_type VARCHAR(100),
    s3_key TEXT
    is_encrypted BOOLEAN DEFAULT false,
    encryption_iv VARCHAR(64),
    expiry_date DATE,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- REMINDERS TABLE
CREATE TABLE reminders (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    document_id BIGINT NOT NULL,
    remind_at TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_reminder
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_document_reminder
        FOREIGN KEY(document_id)
        REFERENCES documents(id)
        ON DELETE CASCADE
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_uuid ON documents(uuid);
CREATE INDEX idx_documents_is_archived ON documents(is_archived);
CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_uuid ON reminders(uuid);
CREATE INDEX idx_reminders_status ON reminders(status);
CREATE INDEX idx_reminders_pending_due ON reminders(status, remind_at)
  WHERE status = 'pending';
