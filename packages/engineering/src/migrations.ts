/** The schema of the ledger (docs/reference/engineering.md section 5). A new migration goes at the end. */
export const MIGRATIONS: string[] = [
  `
  CREATE TABLE item (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'feature', size TEXT NOT NULL DEFAULT 'M',
    mode TEXT NOT NULL DEFAULT 'normal', mode_by TEXT, state TEXT NOT NULL, blocked_from TEXT, reason TEXT,
    areas TEXT NOT NULL DEFAULT '[]', source TEXT, rank INTEGER NOT NULL DEFAULT 0, quick INTEGER NOT NULL DEFAULT 0,
    evidence_from INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL DEFAULT 1, created TEXT NOT NULL, updated TEXT NOT NULL
  );
  CREATE TABLE event (
    id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT NOT NULL REFERENCES item(id), type TEXT NOT NULL,
    from_state TEXT, to_state TEXT, actor TEXT NOT NULL, role TEXT NOT NULL, reason TEXT, at TEXT NOT NULL
  );
  CREATE INDEX event_item ON event(item, id);
  CREATE TABLE approval (
    item TEXT NOT NULL REFERENCES item(id), document TEXT NOT NULL, hash TEXT NOT NULL, at TEXT NOT NULL,
    PRIMARY KEY (item, document)
  );
  CREATE TABLE criterion (
    item TEXT NOT NULL REFERENCES item(id), n INTEGER NOT NULL, text TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0,
    evidence TEXT, grade TEXT, by TEXT, at TEXT, PRIMARY KEY (item, n)
  );
  CREATE TABLE slice (
    item TEXT NOT NULL REFERENCES item(id), id TEXT NOT NULL, title TEXT NOT NULL, area TEXT NOT NULL,
    depends TEXT NOT NULL DEFAULT '[]', acs TEXT NOT NULL DEFAULT '[]', size TEXT, state TEXT NOT NULL DEFAULT 'todo',
    assignee TEXT, reason TEXT, files TEXT NOT NULL DEFAULT '[]', proof TEXT NOT NULL DEFAULT 'none', proof_note TEXT,
    version INTEGER NOT NULL DEFAULT 1, PRIMARY KEY (item, id)
  );
  CREATE TABLE question (
    id TEXT NOT NULL, item TEXT NOT NULL REFERENCES item(id), text TEXT NOT NULL, blocking INTEGER NOT NULL DEFAULT 0,
    recommended TEXT, answer TEXT, status TEXT NOT NULL DEFAULT 'open', asked_by TEXT NOT NULL, answered_by TEXT,
    asked_at TEXT NOT NULL, answered_at TEXT, PRIMARY KEY (item, id)
  );
  CREATE TABLE guess (
    id TEXT NOT NULL, item TEXT NOT NULL REFERENCES item(id), question TEXT NOT NULL, took TEXT NOT NULL, other TEXT NOT NULL,
    impact TEXT NOT NULL, slices TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'open', answer TEXT,
    by TEXT NOT NULL, at TEXT NOT NULL, PRIMARY KEY (item, id)
  );
  CREATE TABLE check_run (
    id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT NOT NULL REFERENCES item(id), area TEXT NOT NULL, "check" TEXT NOT NULL,
    result TEXT NOT NULL, output TEXT NOT NULL DEFAULT '', at TEXT NOT NULL
  );
  CREATE TABLE session (
    id TEXT PRIMARY KEY, item TEXT NOT NULL REFERENCES item(id), role TEXT NOT NULL, holds INTEGER NOT NULL DEFAULT 0,
    seen_at TEXT NOT NULL
  );
  CREATE TABLE note (
    id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT NOT NULL REFERENCES item(id), text TEXT NOT NULL, by TEXT NOT NULL, at TEXT NOT NULL
  );
  `,
  `
  UPDATE item SET state = 'review' WHERE state = 'checking';
  UPDATE item SET blocked_from = 'review' WHERE blocked_from = 'checking';
  UPDATE event SET from_state = 'review' WHERE from_state = 'checking';
  UPDATE event SET to_state = 'review' WHERE to_state = 'checking';
  `,
  `
  UPDATE item SET mode = 'yolo' WHERE mode = 'auto';
  UPDATE event SET from_state = 'yolo' WHERE type = 'mode' AND from_state = 'auto';
  UPDATE event SET to_state = 'yolo' WHERE type = 'mode' AND to_state = 'auto';
  `,
  `
  CREATE TABLE area_install (area TEXT PRIMARY KEY, lock TEXT NOT NULL, at TEXT NOT NULL);
  `,
  `
  ALTER TABLE item ADD COLUMN root_cause TEXT;
  `,
  `
  ALTER TABLE item ADD COLUMN parent TEXT;
  `,
  `
  CREATE TABLE type_kind (type TEXT PRIMARY KEY, kind TEXT NOT NULL, by TEXT NOT NULL, at TEXT NOT NULL);
  `,
  `
  ALTER TABLE item ADD COLUMN points REAL;
  `,
]
