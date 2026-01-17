import { useEffect, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { ExecuteError, PanelType, SchemaResponse, StatementResult } from '../types';
import ResultsPanel from './ResultsPanel';
import { buildCompletionItems } from '../sqlSuggestions';

interface SqlPanelProps {
  panel: PanelType;
  title: string;
  sql: string;
  onSqlChange: (value: string) => void;
  onRun: () => void;
  onClear: () => void;
  onFormat?: () => void;
  results?: StatementResult[];
  error?: ExecuteError;
  loading?: boolean;
  schema?: SchemaResponse['schema'];
  showReadOnlyToggle?: boolean;
  readOnly?: boolean;
  onToggleReadOnly?: (value: boolean) => void;
}

export default function SqlPanel({
  panel,
  title,
  sql,
  onSqlChange,
  onRun,
  onClear,
  onFormat,
  results,
  error,
  loading,
  schema,
  showReadOnlyToggle,
  readOnly,
  onToggleReadOnly
}: SqlPanelProps) {
  const providerRegistered = useRef(false);
  const completionItemsRef = useRef<any[]>([]);
  const monacoRef = useRef<any>(null);

  useEffect(() => {
    if (monacoRef.current) {
      completionItemsRef.current = buildCompletionItems(monacoRef.current, schema);
    }
  }, [schema]);

  const handleMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco;
    completionItemsRef.current = buildCompletionItems(monaco, schema);
    if (!providerRegistered.current) {
      monaco.languages.registerCompletionItemProvider('sql', {
        triggerCharacters: [' ', '.'],
        provideCompletionItems: () => ({
          suggestions: completionItemsRef.current
        })
      });
      providerRegistered.current = true;
    }

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun();
    });
  };

  return (
    <div className={`panel panel-${panel.toLowerCase()}`}>
      <div className="panel-header">
        <div className="panel-title">
          <span>{title}</span>
          <span className="panel-shortcut">Ctrl+Enter</span>
        </div>
        <div className="panel-actions">
          {showReadOnlyToggle && onToggleReadOnly && (
            <label className="toggle">
              <input
                type="checkbox"
                checked={Boolean(readOnly)}
                onChange={(event) => onToggleReadOnly(event.target.checked)}
              />
              Read-only
            </label>
          )}
          {onFormat && (
            <button type="button" onClick={onFormat}>
              Format
            </button>
          )}
          <button type="button" onClick={onClear}>
            Clear Output
          </button>
          <button type="button" className="primary" onClick={onRun}>
            Run {panel}
          </button>
        </div>
      </div>
      <div className="editor-wrapper">
        <Editor
          height="100%"
          language="sql"
          theme="vs"
          value={sql}
          onChange={(value) => onSqlChange(value || '')}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 13,
            wordWrap: 'on',
            automaticLayout: true
          }}
        />
      </div>
      <ResultsPanel results={results} error={error} loading={loading} />
    </div>
  );
}
