import { useEffect, useMemo, useState } from 'react';
import { format } from 'sql-formatter';
import { executeSql, fetchSchema } from './api';
import SchemaTree from './components/SchemaTree';
import SqlPanel from './components/SqlPanel';
import Modal from './components/Modal';
import type { ExecuteError, PanelType, SchemaDatabase, StatementResult } from './types';
import { validateDqlStatements } from './sqlUtils';

const INITIAL_SQL: Record<PanelType, string> = {
  DDL: 'CREATE TABLE sample_table (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  name VARCHAR(255) NOT NULL\n);',
  DQL: 'SELECT 1;',
  DML: 'INSERT INTO sample_table (name) VALUES (\'Alice\');',
  DCL: 'GRANT SELECT ON *.* TO \'root\'@\'localhost\';'
};

export default function App() {
  const [schemaDatabases, setSchemaDatabases] = useState<SchemaDatabase[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [schemaLoading, setSchemaLoading] = useState(false);

  const [sqlByPanel, setSqlByPanel] = useState<Record<PanelType, string>>(INITIAL_SQL);
  const [resultsByPanel, setResultsByPanel] = useState<Record<PanelType, StatementResult[]>>({
    DDL: [],
    DQL: [],
    DML: [],
    DCL: []
  });
  const [errorsByPanel, setErrorsByPanel] = useState<Record<PanelType, ExecuteError | undefined>>({
    DDL: undefined,
    DQL: undefined,
    DML: undefined,
    DCL: undefined
  });
  const [loadingByPanel, setLoadingByPanel] = useState<Record<PanelType, boolean>>({
    DDL: false,
    DQL: false,
    DML: false,
    DCL: false
  });

  const [readOnlyDql, setReadOnlyDql] = useState(true);
  const [activeModal, setActiveModal] = useState<PanelType | null>(null);

  const schema = useMemo(
    () => ({
      currentDatabase: selectedDatabase,
      databases: schemaDatabases
    }),
    [schemaDatabases, selectedDatabase]
  );

  const loadSchema = async (database?: string) => {
    setSchemaLoading(true);
    try {
      const response = await fetchSchema(database || selectedDatabase);
      if (response.ok && response.schema) {
        setSchemaDatabases(response.schema.databases);
        if (!selectedDatabase) {
          setSelectedDatabase(response.schema.currentDatabase || response.schema.databases[0]?.name || '');
        }
      }
    } catch (error) {
      // Ignore schema fetch errors; keep last known schema.
    } finally {
      setSchemaLoading(false);
    }
  };

  useEffect(() => {
    loadSchema();
  }, []);

  const updateSql = (panel: PanelType, value: string) => {
    setSqlByPanel((prev) => ({ ...prev, [panel]: value }));
  };

  const clearPanelOutput = (panel: PanelType) => {
    setResultsByPanel((prev) => ({ ...prev, [panel]: [] }));
    setErrorsByPanel((prev) => ({ ...prev, [panel]: undefined }));
  };

  const formatPanelSql = (panel: PanelType) => {
    try {
      const formatted = format(sqlByPanel[panel], { language: 'mysql' });
      updateSql(panel, formatted);
    } catch (error) {
      setErrorsByPanel((prev) => ({
        ...prev,
        [panel]: { message: 'Format failed. Check SQL syntax.' }
      }));
    }
  };

  const runPanel = async (panel: PanelType) => {
    setLoadingByPanel((prev) => ({ ...prev, [panel]: true }));
    setErrorsByPanel((prev) => ({ ...prev, [panel]: undefined }));

    const sql = sqlByPanel[panel];
    if (panel === 'DQL' && readOnlyDql) {
      const validation = validateDqlStatements(sql);
      if (!validation.ok) {
        setErrorsByPanel((prev) => ({
          ...prev,
          DQL: {
            message: 'Read-only mode allows only SELECT/SHOW/DESCRIBE/EXPLAIN statements.',
            index: validation.index,
            statement: validation.statement
          }
        }));
        setLoadingByPanel((prev) => ({ ...prev, [panel]: false }));
        return;
      }
    }

    try {
      const response = await executeSql(panel, sql, selectedDatabase);
      if (response.ok) {
        setResultsByPanel((prev) => ({ ...prev, [panel]: response.results || [] }));
        setErrorsByPanel((prev) => ({ ...prev, [panel]: undefined }));
        if (panel === 'DDL') {
          await loadSchema(selectedDatabase);
        }
      } else {
        setResultsByPanel((prev) => ({ ...prev, [panel]: response.results || [] }));
        setErrorsByPanel((prev) => ({ ...prev, [panel]: response.error }));
      }
    } catch (error) {
      setErrorsByPanel((prev) => ({
        ...prev,
        [panel]: { message: 'Failed to reach the server.' }
      }));
    } finally {
      setLoadingByPanel((prev) => ({ ...prev, [panel]: false }));
    }
  };

  return (
    <div className="app">
      <header className="top-bar">
        <div className="brand">
          <span>SQL Trainer Ground</span>
          <small>Local MySQL sandbox</small>
        </div>
        <div className="top-controls">
          <label className="db-select">
            Database
            <select
              value={selectedDatabase}
              onChange={(event) => setSelectedDatabase(event.target.value)}
            >
              {schemaDatabases.map((db) => (
                <option key={db.name} value={db.name}>
                  {db.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => loadSchema(selectedDatabase)}>
            {schemaLoading ? 'Refreshing...' : 'Refresh Schema'}
          </button>
          <button type="button" onClick={() => setActiveModal('DML')}>
            DML
          </button>
          <button type="button" onClick={() => setActiveModal('DCL')}>
            DCL
          </button>
        </div>
      </header>

      <div className="main">
        <aside className="sidebar">
          <SchemaTree databases={schemaDatabases} currentDatabase={selectedDatabase} />
          <div className="sidebar-footer">
            <a href="https://datenflix007.github.io/" target="_blank" rel="noreferrer">
              (c) 2025 Felix Staacke
            </a>
          </div>
        </aside>
        <section className="split-view">
          <SqlPanel
            panel="DDL"
            title="DDL"
            sql={sqlByPanel.DDL}
            onSqlChange={(value) => updateSql('DDL', value)}
            onRun={() => runPanel('DDL')}
            onClear={() => clearPanelOutput('DDL')}
            onFormat={() => formatPanelSql('DDL')}
            results={resultsByPanel.DDL}
            error={errorsByPanel.DDL}
            loading={loadingByPanel.DDL}
            schema={schema}
          />
          <SqlPanel
            panel="DQL"
            title="DQL"
            sql={sqlByPanel.DQL}
            onSqlChange={(value) => updateSql('DQL', value)}
            onRun={() => runPanel('DQL')}
            onClear={() => clearPanelOutput('DQL')}
            onFormat={() => formatPanelSql('DQL')}
            results={resultsByPanel.DQL}
            error={errorsByPanel.DQL}
            loading={loadingByPanel.DQL}
            schema={schema}
            showReadOnlyToggle
            readOnly={readOnlyDql}
            onToggleReadOnly={setReadOnlyDql}
          />
        </section>
      </div>

      <Modal open={activeModal === 'DML'} title="DML" onClose={() => setActiveModal(null)}>
        <SqlPanel
          panel="DML"
          title="DML"
          sql={sqlByPanel.DML}
          onSqlChange={(value) => updateSql('DML', value)}
          onRun={() => runPanel('DML')}
          onClear={() => clearPanelOutput('DML')}
          onFormat={() => formatPanelSql('DML')}
          results={resultsByPanel.DML}
          error={errorsByPanel.DML}
          loading={loadingByPanel.DML}
          schema={schema}
        />
      </Modal>

      <Modal open={activeModal === 'DCL'} title="DCL" onClose={() => setActiveModal(null)}>
        <SqlPanel
          panel="DCL"
          title="DCL"
          sql={sqlByPanel.DCL}
          onSqlChange={(value) => updateSql('DCL', value)}
          onRun={() => runPanel('DCL')}
          onClear={() => clearPanelOutput('DCL')}
          onFormat={() => formatPanelSql('DCL')}
          results={resultsByPanel.DCL}
          error={errorsByPanel.DCL}
          loading={loadingByPanel.DCL}
          schema={schema}
        />
      </Modal>
    </div>
  );
}
