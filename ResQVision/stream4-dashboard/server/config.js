import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep runtime secret server-side only; never expose to frontend
const EPHEMERAL_DEV_SECRET = crypto.randomBytes(32).toString('hex');

export const CONFIG = {
  port: Number(process.env.PORT || process.env.RESQVISION_API_PORT || 8004),
  sessionSecret: process.env.RESQVISION_SESSION_SECRET || EPHEMERAL_DEV_SECRET,
  tokenTtlMs: 8 * 60 * 60 * 1000,
  dataDir: process.env.RESQVISION_DATA_DIR || path.join(__dirname, 'data'),
  uploadDir: process.env.RESQVISION_UPLOAD_DIR || path.join(__dirname, 'uploads'),
  stream3BaseUrl: process.env.STREAM3_BASE_URL || process.env.VITE_STREAM3_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://resqvision-1.onrender.com' : 'http://localhost:8003'),
  imageAssessmentUrl: process.env.IMAGE_ASSESSMENT_PROVIDER_URL || (process.env.NODE_ENV === 'production' ? 'https://resqvision-ml.onrender.com/verify-image' : 'http://localhost:8002/verify-image'),
  geospatialFeedUrl: process.env.GEOSPATIAL_RESOURCE_FEED_URL || '',
  supabaseUrl: process.env.SUPABASE_URL || 'https://avjqlpllihhqtydwcuya.supabase.co',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2anFscGxsaWhocXR5ZHdjdXlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDg0NjI2OSwiZXhwIjoyMTEwNDIyMjY5fQ.ue2Y65biRI2gMThjGSn-FWIKBCEEieSynNch82-MG6E',
  maxUploadBytes: 5 * 1024 * 1024,
  maxUploadCount: 4
};
