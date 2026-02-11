CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    external_id TEXT UNIQUE NOT NULL,
    name TEXT,
    color TEXT,
    cost INT,
    power INT,
    image_url TEXT
);

