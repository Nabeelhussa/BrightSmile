import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Delete',
  message,
  confirmLabel = 'Delete',
  isSubmitting = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Deleting...' : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="row-inline" style={{ alignItems: 'flex-start', gap: 14 }}>
        <div className="state-icon error" style={{ width: 42, height: 42, flexShrink: 0 }}>
          <AlertTriangle size={20} />
        </div>
        <p className="text-secondary" style={{ lineHeight: 1.6 }}>
          {message}
        </p>
      </div>
    </Modal>
  );
}
