import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { GameRecord } from '../types/game-types.js';

const DATA_DIR = join(process.cwd(), 'data', 'games');

/** Ensure data directory exists */
async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

export async function saveGame(record: GameRecord): Promise<void> {
  await ensureDir();
  const filePath = join(DATA_DIR, `${record.id}.json`);
  await writeFile(filePath, JSON.stringify(record, null, 2));
}

/** Validate ID is a safe UUID format to prevent path traversal */
function isValidId(id: string): boolean {
  return /^[a-f0-9-]{36}$/.test(id);
}

export async function loadGame(id: string): Promise<GameRecord | null> {
  if (!isValidId(id)) return null;
  try {
    const filePath = join(DATA_DIR, `${id}.json`);
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data) as GameRecord;
  } catch {
    return null;
  }
}

export async function listGameRecords(): Promise<GameRecord[]> {
  await ensureDir();
  const files = await readdir(DATA_DIR);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));

  const records: GameRecord[] = [];
  for (const file of jsonFiles) {
    const data = await readFile(join(DATA_DIR, file), 'utf-8');
    records.push(JSON.parse(data) as GameRecord);
  }

  // Sort by start time descending (newest first)
  return records.sort((a, b) => b.startTime - a.startTime);
}
