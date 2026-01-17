export type PanelType = 'DDL' | 'DQL' | 'DML' | 'DCL';

export type ResultType = 'resultset' | 'ok';

export interface StatementResult {
  index: number;
  statement: string;
  type: ResultType;
  rows?: Array<Record<string, unknown>>;
  fields?: string[];
  rowCount?: number;
  affectedRows?: number;
  message?: string;
  insertId?: number;
}

export interface ExecuteError {
  message: string;
  code?: string;
  index?: number;
  statement?: string;
}

export interface ExecuteResponse {
  ok: boolean;
  results?: StatementResult[];
  error?: ExecuteError;
}

export interface SchemaColumn {
  name: string;
  type: string;
}

export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
}

export interface SchemaDatabase {
  name: string;
  tables: SchemaTable[];
}

export interface SchemaResponse {
  ok: boolean;
  schema?: {
    currentDatabase?: string;
    databases: SchemaDatabase[];
  };
  error?: ExecuteError;
}
