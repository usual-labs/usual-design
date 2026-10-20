import { useState } from 'react';
import { Button } from './Button';

export function CodeBlock({ code, label = 'Terminal' }: { code: string; label?: string }) {
  const [message, setMessage] = useState('');
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setMessage('Copied');
    } catch {
      setMessage('Select the code to copy it.');
    }
  }
  return (
    <div className="overflow-hidden rounded-panel border border-line">
      <div className="flex items-center justify-between gap-4 bg-soft px-4 py-2">
        <span className="font-mono text-xs text-muted">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted" role="status">
            {message}
          </span>
          <Button onClick={copy} aria-label={`Copy ${label.toLowerCase()}`}>
            Copy
          </Button>
        </div>
      </div>
      <pre className="overflow-x-auto bg-code p-5 font-mono text-sm leading-relaxed text-code-ink">
        <code>{code}</code>
      </pre>
    </div>
  );
}
