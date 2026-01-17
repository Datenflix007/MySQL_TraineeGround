function buildSchemaTree(databases, tables, columns, currentDatabase) {
  const dbMap = new Map();

  databases.forEach((db) => {
    dbMap.set(db.name, { name: db.name, tables: [] });
  });

  const tableMap = new Map();

  tables.forEach((table) => {
    if (!dbMap.has(table.schema)) {
      dbMap.set(table.schema, { name: table.schema, tables: [] });
    }
    const dbEntry = dbMap.get(table.schema);
    const tableEntry = { name: table.name, columns: [] };
    dbEntry.tables.push(tableEntry);
    tableMap.set(`${table.schema}.${table.name}`, tableEntry);
  });

  columns.forEach((column) => {
    const tableEntry = tableMap.get(`${column.schema}.${column.table}`);
    if (tableEntry) {
      tableEntry.columns.push({ name: column.name, type: column.type });
    }
  });

  return {
    currentDatabase,
    databases: Array.from(dbMap.values())
  };
}

module.exports = {
  buildSchemaTree
};
