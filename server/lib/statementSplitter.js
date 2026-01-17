function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      current += char;
      if (char === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      current += char;
      if (char === '*' && next === '/') {
        current += next;
        i += 1;
        inBlockComment = false;
      }
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
      if (char === '-' && next === '-' && isLineCommentStart(sql, i)) {
        current += char + next;
        i += 1;
        inLineComment = true;
        continue;
      }
      if (char === '#') {
        current += char;
        inLineComment = true;
        continue;
      }
      if (char === '/' && next === '*') {
        current += char + next;
        i += 1;
        inBlockComment = true;
        continue;
      }
    }

    if (char === '\\' && (inSingleQuote || inDoubleQuote)) {
      current += char;
      if (next) {
        current += next;
        i += 1;
      }
      continue;
    }

    if (!inDoubleQuote && !inBacktick && char === '\'') {
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }

    if (!inSingleQuote && !inBacktick && char === '"') {
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && char === '`') {
      inBacktick = !inBacktick;
      current += char;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !inBacktick && char === ';') {
      const trimmed = current.trim();
      if (trimmed) {
        statements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const trimmed = current.trim();
  if (trimmed) {
    statements.push(trimmed);
  }

  return statements;
}

function isLineCommentStart(sql, index) {
  const next = sql[index + 1];
  if (next !== '-') {
    return false;
  }
  const after = sql[index + 2];
  return !after || /\s/.test(after);
}

function getLeadingKeywords(statement, limit = 2) {
  const keywords = [];
  let i = 0;
  const len = statement.length;

  while (i < len && keywords.length < limit) {
    const char = statement[i];
    const next = statement[i + 1];

    if (/\s/.test(char)) {
      i += 1;
      continue;
    }

    if (char === '-' && next === '-' && isLineCommentStart(statement, i)) {
      i += 2;
      while (i < len && statement[i] !== '\n') {
        i += 1;
      }
      continue;
    }

    if (char === '#') {
      i += 1;
      while (i < len && statement[i] !== '\n') {
        i += 1;
      }
      continue;
    }

    if (char === '/' && next === '*') {
      i += 2;
      while (i < len && !(statement[i] === '*' && statement[i + 1] === '/')) {
        i += 1;
      }
      i += 2;
      continue;
    }

    if (/[A-Za-z]/.test(char)) {
      let start = i;
      i += 1;
      while (i < len && /[A-Za-z]/.test(statement[i])) {
        i += 1;
      }
      keywords.push(statement.slice(start, i).toUpperCase());
      continue;
    }

    i += 1;
  }

  return keywords;
}

module.exports = {
  splitSqlStatements,
  getLeadingKeywords
};
