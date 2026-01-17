import ResultTable from './ResultTable';
import type { ExecuteError, StatementResult } from '../types';

interface ResultsPanelProps {
  results?: StatementResult[];
  error?: ExecuteError;
  loading?: boolean;
}

export default function ResultsPanel({ results, error, loading }: ResultsPanelProps) {
  if (loading) {
    return <div className="results-panel">Running...</div>;
  }

  if (!results || results.length === 0) {
    if (error) {
      return (
        <div className="results-panel error">
          <div className="error-title">Error</div>
          <div className="error-message">{error.message}</div>
          {typeof error.index === 'number' && (
            <div className="error-meta">Statement #{error.index + 1}</div>
          )}
          {error.code && <div className="error-meta">Code: {error.code}</div>}
        </div>
      );
    }

    return <div className="results-panel empty">No output yet.</div>;
  }

  return (
    <div className="results-panel">
      {error && (
        <div className="error-block">
          <div className="error-title">Error</div>
          <div className="error-message">{error.message}</div>
          {typeof error.index === 'number' && (
            <div className="error-meta">Statement #{error.index + 1}</div>
          )}
          {error.code && <div className="error-meta">Code: {error.code}</div>}
        </div>
      )}

      {results.map((result) => (
        <div key={`${result.index}-${result.type}`} className="result-block">
          <div className="result-header">
            <span>Statement {result.index + 1}</span>
            <code>{result.statement}</code>
          </div>

          {result.type === 'resultset' ? (
            <div className="result-body">
              <div className="result-meta">Rows: {result.rowCount ?? 0}</div>
              <ResultTable fields={result.fields || []} rows={result.rows || []} />
            </div>
          ) : (
            <div className="result-body">
              <div className="result-meta">{result.message || 'OK'}</div>
              <div className="result-meta">Affected rows: {result.affectedRows ?? 0}</div>
              {typeof result.insertId === 'number' && (
                <div className="result-meta">Insert ID: {result.insertId}</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
