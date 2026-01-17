const { getLeadingKeywords } = require('./statementSplitter');

const ALLOWED_DQL = new Set(['SELECT', 'SHOW', 'DESCRIBE', 'DESC', 'EXPLAIN']);

function isDqlStatement(statement) {
  const keywords = getLeadingKeywords(statement, 1);
  if (keywords.length === 0) {
    return false;
  }
  return ALLOWED_DQL.has(keywords[0]);
}

module.exports = {
  isDqlStatement
};
