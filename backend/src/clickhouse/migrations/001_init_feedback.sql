-- DO NOT EDIT

CREATE TABLE IF NOT EXISTS feedback (
  id String,
  name String,
  email String,
  text String,
  status String,
  createdAt DateTime
) ENGINE = MergeTree()
ORDER BY id;
