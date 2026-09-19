import { query } from '../db/index.js';

const map = (row) => row && ({
  id: row.id,
  agentProfileId: row.agent_profile_id,
  title: row.title,
  issuer: row.issuer,
  credentialType: row.credential_type,
  issuedAt: row.issued_at,
  expiresAt: row.expires_at,
  fileUrl: row.file_path,
  isVerified: Boolean(row.is_verified),
  createdAt: row.created_at,
});

export const findById = (id) => map(query.get('SELECT * FROM credentials WHERE id = ?', [id]));

export const listForAgent = (agentProfileId) =>
  query.all('SELECT * FROM credentials WHERE agent_profile_id = ? ORDER BY COALESCE(issued_at, created_at) DESC', [agentProfileId]).map(map);

export function create(agentProfileId, input) {
  const id = query.insert(
    `INSERT INTO credentials (agent_profile_id, title, issuer, credential_type, issued_at, expires_at, file_path)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      agentProfileId,
      input.title,
      input.issuer ?? null,
      input.credentialType ?? 'certificate',
      input.issuedAt ?? null,
      input.expiresAt ?? null,
      input.fileUrl ?? null,
    ],
  );
  return findById(id);
}

export const remove = (id) => query.run('DELETE FROM credentials WHERE id = ?', [id]).changes > 0;
