import type { SchemaDatabase } from '../types';

interface SchemaTreeProps {
  databases: SchemaDatabase[];
  currentDatabase?: string;
}

export default function SchemaTree({ databases, currentDatabase }: SchemaTreeProps) {
  return (
    <div className="schema-tree">
      <div className="schema-title">Schema</div>
      <div className="schema-subtitle">{currentDatabase || 'No database selected'}</div>
      <div className="schema-list">
        {databases.map((database) => (
          <details key={database.name} open={database.name === currentDatabase}>
            <summary>{database.name}</summary>
            {database.tables.map((table) => (
              <details key={`${database.name}.${table.name}`}>
                <summary>{table.name}</summary>
                <ul>
                  {table.columns.map((column) => (
                    <li key={`${database.name}.${table.name}.${column.name}`}>
                      <span>{column.name}</span>
                      <span className="schema-type">{column.type}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </details>
        ))}
      </div>
    </div>
  );
}
