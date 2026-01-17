const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const { splitSqlStatements } = require('./lib/statementSplitter');
const { isDqlStatement } = require('./lib/dqlWhitelist');
const { buildSchemaTree } = require('./lib/schema');

dotenv.config();

const app = express();

app.use(express.json({ limit: '2mb' }));

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    }
  })
);

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function normalizePanel(panel) {
  const upper = String(panel || '').toUpperCase();
  if (['DDL', 'DQL', 'DML', 'DCL'].includes(upper)) {
    return upper;
  }
  return null;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/schema', async (req, res) => {
  const database = String(req.query.database || process.env.MYSQL_DATABASE || '');
  let connection;
  try {
    connection = await pool.getConnection();
    if (database) {
      await connection.changeUser({ database });
    }

    const [dbRows] = await connection.query(
      'SELECT schema_name AS name FROM information_schema.schemata ORDER BY schema_name'
    );
    const [tableRows] = await connection.query(
      "SELECT table_schema AS schema, table_name AS name FROM information_schema.tables WHERE table_type = 'BASE TABLE' ORDER BY table_schema, table_name"
    );
    const [columnRows] = await connection.query(
      'SELECT table_schema AS schema, table_name AS table, column_name AS name, data_type AS type FROM information_schema.columns ORDER BY table_schema, table_name, ordinal_position'
    );

    const schema = buildSchemaTree(dbRows, tableRows, columnRows, database);

    res.json({ ok: true, schema });
  } catch (error) {
    res.status(500).json({ ok: false, error: { message: error.message } });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

app.post('/api/execute', async (req, res) => {
  const panel = normalizePanel(req.body.panel);
  const sql = String(req.body.sql || '');
  const database = String(req.body.database || process.env.MYSQL_DATABASE || '');

  if (!panel) {
    res.status(400).json({ ok: false, error: { message: 'Invalid panel.' } });
    return;
  }

  const statements = splitSqlStatements(sql);
  if (statements.length === 0) {
    res.status(400).json({ ok: false, error: { message: 'SQL is empty.' } });
    return;
  }

  if (panel === 'DQL') {
    const invalidIndex = statements.findIndex((statement) => !isDqlStatement(statement));
    if (invalidIndex !== -1) {
      res.status(400).json({
        ok: false,
        error: {
          message: 'DQL panel allows only SELECT/SHOW/DESCRIBE/EXPLAIN statements.',
          code: 'DQL_ONLY',
          index: invalidIndex,
          statement: statements[invalidIndex]
        }
      });
      return;
    }
  }

  let connection;
  const results = [];
  try {
    connection = await pool.getConnection();
    if (database) {
      await connection.changeUser({ database });
    }

    if (panel === 'DML') {
      await connection.beginTransaction();
    }

    for (let i = 0; i < statements.length; i += 1) {
      const statement = statements[i];
      try {
        const [rows, fields] = await connection.query(statement);
        if (Array.isArray(rows)) {
          results.push({
            index: i,
            statement,
            type: 'resultset',
            rows,
            fields: (fields || []).map((field) => field.name),
            rowCount: rows.length
          });
        } else {
          results.push({
            index: i,
            statement,
            type: 'ok',
            affectedRows: rows.affectedRows,
            message: rows.message || 'OK',
            insertId: rows.insertId
          });
        }
      } catch (error) {
        error.statementIndex = i;
        error.statement = statement;
        throw error;
      }
    }

    if (panel === 'DML') {
      await connection.commit();
    }

    res.json({ ok: true, results });
  } catch (error) {
    if (panel === 'DML' && connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        // Ignore rollback errors.
      }
    }

    res.status(400).json({
      ok: false,
      results,
      error: {
        message: error.message,
        code: error.code,
        index: error.statementIndex,
        statement: error.statement
      }
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`SQL Trainer Ground server listening on ${port}`);
});
