import type { ExecuteResponse, PanelType, SchemaResponse } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function fetchSchema(database?: string): Promise<SchemaResponse> {
  const url = new URL(`${API_BASE}/api/schema`);
  if (database) {
    url.searchParams.set('database', database);
  }
  const response = await fetch(url.toString());
  return response.json();
}

export async function executeSql(panel: PanelType, sql: string, database?: string): Promise<ExecuteResponse> {
  const response = await fetch(`${API_BASE}/api/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ panel, sql, database })
  });
  return response.json();
}
