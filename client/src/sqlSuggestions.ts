import type { SchemaResponse } from './types';

export const SQL_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'JOIN',
  'LEFT',
  'RIGHT',
  'INNER',
  'OUTER',
  'ON',
  'GROUP',
  'BY',
  'ORDER',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'CREATE',
  'ALTER',
  'DROP',
  'TABLE',
  'DATABASE',
  'INDEX',
  'VIEW',
  'PRIMARY',
  'KEY',
  'FOREIGN',
  'REFERENCES',
  'NOT',
  'NULL',
  'DEFAULT',
  'AUTO_INCREMENT',
  'UNIQUE',
  'GRANT',
  'REVOKE',
  'SHOW',
  'DESCRIBE',
  'EXPLAIN',
  'WITH',
  'AS',
  'AND',
  'OR',
  'IN',
  'EXISTS',
  'LIKE',
  'BETWEEN'
];

export function buildCompletionItems(monaco: any, schema?: SchemaResponse['schema']) {
  const suggestions = SQL_KEYWORDS.map((keyword) => ({
    label: keyword,
    kind: monaco.languages.CompletionItemKind.Keyword,
    insertText: keyword,
    detail: 'SQL keyword'
  }));

  if (!schema) {
    return suggestions;
  }

  schema.databases.forEach((database) => {
    suggestions.push({
      label: database.name,
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: database.name,
      detail: 'Database'
    });

    database.tables.forEach((table) => {
      suggestions.push({
        label: table.name,
        kind: monaco.languages.CompletionItemKind.Struct,
        insertText: table.name,
        detail: `Table (${database.name})`
      });

      table.columns.forEach((column) => {
        suggestions.push({
          label: column.name,
          kind: monaco.languages.CompletionItemKind.Field,
          insertText: column.name,
          detail: `Column (${table.name})`
        });
      });
    });
  });

  return suggestions;
}
