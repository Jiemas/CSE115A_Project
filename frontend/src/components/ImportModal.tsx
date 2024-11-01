// ImportModal.tsx
import React, { useState } from 'react';
import Modal from './Modal';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (text: string) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [importText, setImportText] = useState('');

  const handleImport = () => {
    onImport(importText);
    setImportText('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>Import Cards</h2>
      <textarea
        placeholder="Paste your cards here (one card per line, term and definition separated by tab)"
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
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