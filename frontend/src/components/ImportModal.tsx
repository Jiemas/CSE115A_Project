import React, { useState } from 'react';
import Modal from './Modal';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (text: string) => Promise<void>;
}

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [importText, setImportText] = useState('');
  const handleImport = async () => {
    const lines = importText.trim().split('\n');
    const validLines = lines.filter(line => line.includes('\t'));

    if (validLines.length === 0) {
      alert(
        'Please provide valid card data. Each line should contain a term and definition separated by a tab.'
      );
      return;
    }

    try {
      await onImport(importText);
      setImportText('');
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please try again.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>Import Cards</h2>
      <textarea
        placeholder="Paste your cards here (one card per line, term and definition separated by tab)"
        value={importText}
        onChange={e => setImportText(e.target.value)}
        rows={10}
        cols={50}
      />
      <div>
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleImport}>Import</button>
      </div>
    </Modal>
  );
};

export default ImportModal;
