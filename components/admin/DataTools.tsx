'use client';

import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { adminApi, type ImportSummaryLike } from '@/lib/api/admin-client';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

type BackupShape = { categories: unknown[]; items: unknown[] };

type DataToolsProps = {
  onImported: () => void;
  onNotice: (notice: { kind: 'info' | 'error'; text: string }) => void;
};

/**
 * Backup / restore panel.
 *  - Export downloads every category + item as JSON
 *  - Import validates the file first, never overwrites silently, and demands
 *    an explicit confirmation before replacing existing data.
 */
export function DataTools({ onImported, onNotice }: DataToolsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileData, setFileData] = useState<BackupShape | null>(null);
  const [fileName, setFileName] = useState('');
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);
    setFileData(null);
    setFileName('');
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result ?? ''));
        const candidate = parsed as Partial<BackupShape> | null;
        if (
          !candidate ||
          !Array.isArray(candidate.categories) ||
          !Array.isArray(candidate.items)
        ) {
          setError(
            'Fichier de sauvegarde invalide : il doit contenir les listes « categories » et « items ».',
          );
          return;
        }
        setFileData({ categories: candidate.categories, items: candidate.items });
        setFileName(file.name);
      } catch {
        setError('Fichier illisible : ce n’est pas un JSON valide.');
      }
    };
    reader.onerror = () => setError('Impossible de lire ce fichier.');
    reader.readAsText(file);
  }

  function describeSummary(summary: ImportSummaryLike): string {
    const parts = [
      `${summary.categories.created} catégorie(s) importée(s)`,
      `${summary.items.created} ressource(s) importée(s)`,
    ];
    if (summary.categories.skipped > 0) parts.push(`${summary.categories.skipped} ignorée(s)`);
    if (summary.items.skipped > 0) parts.push(`${summary.items.skipped} ignorée(s)`);
    if (summary.items.unclassified > 0) {
      parts.push(`${summary.items.unclassified} ressource(s) sans catégorie`);
    }
    return `Import terminé (${summary.mode === 'replace' ? 'remplacement' : 'fusion'}) : ${parts.join(', ')}.`;
  }

  async function runImport() {
    if (!fileData) return;
    setBusy(true);
    const result = await adminApi.importData({
      mode,
      confirm: mode === 'replace',
      data: fileData,
    });
    setBusy(false);
    setConfirmOpen(false);
    if (!result.ok) {
      setError(result.issues?.length ? result.issues.join(' ') : result.message);
      return;
    }
    setError(null);
    setFileData(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onNotice({ kind: 'info', text: describeSummary(result.data.summary) });
    onImported();
  }

  function handleImportClick() {
    if (!fileData) return;
    if (mode === 'replace') {
      setConfirmOpen(true);
      return;
    }
    void runImport();
  }

  return (
    <section aria-labelledby="data-title" className="mt-14">
      <h2 id="data-title" className="section-title">
        Données &amp; sauvegarde
      </h2>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="panel p-4 sm:p-5">
          <h3 className="text-base font-medium tracking-tight text-paper">Exporter</h3>
          <p className="field-hint">
            Télécharge toutes les catégories et ressources dans un fichier JSON (à conserver en
            lieu sûr, et à importer pour restaurer).
          </p>
          <a href="/api/export" download className="btn mt-4">
            <Download className="h-4 w-4" aria-hidden="true" />
            Exporter les données (JSON)
          </a>
        </div>

        <div className="panel p-4 sm:p-5">
          <h3 className="text-base font-medium tracking-tight text-paper">Importer</h3>
          <p className="field-hint">
            Restaure une sauvegarde JSON. Les données existantes ne sont jamais écrasées sans
            confirmation explicite.
          </p>

          <div className="mt-4">
            <label className="field-label" htmlFor="import-file">
              Fichier de sauvegarde (JSON)
            </label>
            <input
              ref={fileInputRef}
              id="import-file"
              type="file"
              accept="application/json,.json"
              className="field-input cursor-pointer file:mr-3 file:rounded-sm file:border-0 file:bg-paper/10 file:px-2.5 file:py-1.5 file:text-xs file:text-paper/80"
              onChange={handleFileChange}
            />
            {fileName ? (
              <p className="field-hint">
                Fichier sélectionné&nbsp;: <span className="text-paper/70">{fileName}</span> (
                {fileData ? `${fileData.categories.length} catégorie(s), ${fileData.items.length} ressource(s)` : '—'}
                )
              </p>
            ) : null}
          </div>

          <fieldset className="mt-4">
            <legend className="field-label">Mode d’importation</legend>
            <label className="flex items-start gap-2.5 text-sm text-paper/75">
              <input
                type="radio"
                name="import-mode"
                className="mt-1 accent-paper/70"
                checked={mode === 'merge'}
                onChange={() => setMode('merge')}
              />
              <span>
                Fusionner&nbsp;— ajoute les éléments du fichier, ignore ceux qui existent déjà.
              </span>
            </label>
            <label className="mt-2.5 flex items-start gap-2.5 text-sm text-paper/75">
              <input
                type="radio"
                name="import-mode"
                className="mt-1 accent-paper/70"
                checked={mode === 'replace'}
                onChange={() => setMode('replace')}
              />
              <span>
                Remplacer tout&nbsp;— <strong>efface</strong> les données actuelles puis importe le
                fichier.
              </span>
            </label>
          </fieldset>

          {error ? (
            <p role="alert" className="field-error">
              ⚠ {error}
            </p>
          ) : null}

          <button
            type="button"
            className="btn mt-4"
            onClick={handleImportClick}
            disabled={!fileData || busy}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {busy ? 'Importation…' : 'Importer'}
          </button>
        </div>
      </div>

      {confirmOpen ? (
        <ConfirmDialog
          busy={busy}
          options={{
            title: 'Remplacer toutes les données ?',
            confirmLabel: 'Tout remplacer',
            message: (
              <>
                <p>
                  Toutes les catégories et ressources actuelles seront <strong>définitivement
                  supprimées</strong>, puis le fichier « {fileName} » sera importé.
                </p>
                <p className="mt-2 text-paper/50">
                  Cette action ne peut pas être annulée. Pensez à exporter vos données actuelles
                  avant de continuer.
                </p>
              </>
            ),
          }}
          onConfirm={() => void runImport()}
          onCancel={() => setConfirmOpen(false)}
        />
      ) : null}
    </section>
  );
}
