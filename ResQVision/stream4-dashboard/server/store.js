import fs from 'node:fs/promises';
import path from 'node:path';
import { hashPassword } from './auth.js';
import { CONFIG } from './config.js';

function createInitialDb() {
  return {
    users: [
      {
        id: 'USR-CIT-SEED-1',
        role: 'citizen',
        name: 'Ananya Verma',
        email: 'citizen@resqvision.local',
        passwordHash: hashPassword('CitizenDemo!2026'),
        agency: null,
        isSeededTestAccount: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'USR-GOV-SEED-1',
        role: 'government',
        name: 'Commander Vikram Rao',
        email: 'officer@ndrf.resqvision.local',
        passwordHash: hashPassword('OfficerDemo!2026'),
        agency: 'NDRF / SDRF',
        isSeededTestAccount: true,
        createdAt: new Date().toISOString()
      }
    ],
    sosReports: [],
    attachments: [],
    notifications: [],
    rescueOperations: [],
    casualtyRecord: {
      recorded_casualties_or_deaths: null,
      verification_status: 'not_reported',
      source: 'No verified civil/medical casualty figures submitted yet.',
      updated_at: null
    }
  };
}

export class DataStore {
  constructor(dataDir = CONFIG.dataDir) {
    this.dataDir = dataDir;
    this.dbFile = path.join(dataDir, 'db.json');
    this.writeQueue = Promise.resolve();
  }

  async ensureInitialized() {
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.mkdir(CONFIG.uploadDir, { recursive: true });
    try {
      await fs.access(this.dbFile);
    } catch {
      const initial = createInitialDb();
      await fs.writeFile(this.dbFile, JSON.stringify(initial, null, 2), 'utf8');
    }
  }

  async read() {
    await this.ensureInitialized();
    const raw = await fs.readFile(this.dbFile, 'utf8');
    return JSON.parse(raw);
  }

  async mutate(fn) {
    const task = this.writeQueue.then(async () => {
      const db = await this.read();
      const result = await fn(db);
      const tmpFile = `${this.dbFile}.tmp`;
      await fs.writeFile(tmpFile, JSON.stringify(db, null, 2), 'utf8');
      await fs.rename(tmpFile, this.dbFile);
      return result;
    });
    this.writeQueue = task.catch(() => {});
    return task;
  }
}
