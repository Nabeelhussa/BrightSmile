import { useCallback, useEffect, useState } from 'react';
import {
  Eye,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Stethoscope,
  Trash2,
} from 'lucide-react';
import { doctorsApi } from '../api/client.js';
import { DoctorDetailModal } from '../components/doctors/DoctorDetailModal.jsx';
import { DoctorFormModal } from '../components/doctors/DoctorFormModal.jsx';
import { ActiveBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { DataTable } from '../components/ui/DataTable.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { SelectInput, TextInput } from '../components/ui/FormControls.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { getInitials, SPECIALIZATIONS } from '../utils/formatters.js';

export function DoctorsPage() {
  const { showToast } = useToast();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [detailDoctorId, setDetailDoctorId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await doctorsApi.list({
        search: search.trim(),
        specialization,
        active: activeFilter,
      });
      setDoctors(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  }, [search, specialization, activeFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDoctors();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [loadDoctors]);

  const hasFilters =
    Boolean(search.trim()) || specialization !== 'all' || activeFilter !== 'all';

  const resetFilters = () => {
    setSearch('');
    setSpecialization('all');
    setActiveFilter('all');
  };

  const handleSaveDoctor = async (payload) => {
    if (editingDoctor) {
      await doctorsApi.update(editingDoctor.id, payload);
      showToast(`${payload.name} updated successfully.`);
    } else {
      await doctorsApi.create(payload);
      showToast(`${payload.name} added to the clinic.`);
    }
    await loadDoctors();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await doctorsApi.remove(deleteTarget.id);
      showToast(`${deleteTarget.name} was deleted.`);
      setDeleteTarget(null);
      await loadDoctors();
    } catch (err) {
      showToast(err.message || 'Failed to delete doctor.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Doctor',
      render: (doc) => (
        <div className="row-inline" style={{ gap: 12 }}>
          <div className="avatar">{getInitials(doc.name)}</div>
          <div>
            <button
              type="button"
              onClick={() => setDetailDoctorId(doc.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontWeight: 700,
                color: 'var(--color-primary-700)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {doc.name}
            </button>
            <div className="text-muted">{doc.specialization}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (doc) => (
        <div className="stack-sm" style={{ gap: 3 }}>
          <div className="row-inline" style={{ gap: 6, fontSize: '0.86rem' }}>
            <Phone size={13} color="#64748b" />
            <span>{doc.phone}</span>
          </div>
          <div className="row-inline text-muted" style={{ gap: 6 }}>
            <Mail size={13} />
            <span>{doc.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'availability',
      header: 'Availability',
      render: (doc) => (
        <div>
          <div style={{ fontSize: '0.88rem' }}>{doc.availability}</div>
          <div className="text-muted">
            {doc.appointment_count ?? 0} appointment{doc.appointment_count === 1 ? '' : 's'}
          </div>
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (doc) => <ActiveBadge isActive={doc.is_active} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (doc) => (
        <div className="table-actions">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDetailDoctorId(doc.id)}
            aria-label={`View ${doc.name}`}
            title="View details"
          >
            <Eye size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingDoctor(doc);
              setFormOpen(true);
            }}
            aria-label={`Edit ${doc.name}`}
            title="Edit doctor"
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant="danger-ghost"
            size="icon"
            onClick={() => setDeleteTarget(doc)}
            aria-label={`Delete ${doc.name}`}
            title="Delete doctor"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Doctors Directory</h1>
          <p className="page-description">
            Manage dental specialists, weekly schedules, contact information, and active roster status.
          </p>
        </div>
        <div className="page-actions">
          <Button
            onClick={() => {
              setEditingDoctor(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} />
            Add Doctor
          </Button>
        </div>
      </header>

      <Card noBodyPadding>
        <div className="filter-toolbar">
          <div className="filter-group">
            <div className="search-input-wrap">
              <Search size={16} className="search-input-icon" aria-hidden="true" />
              <TextInput
                className="search-input"
                placeholder="Search by name, specialty, or email..."
                aria-label="Search doctors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <SelectInput
              aria-label="Filter by specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              style={{ width: 'auto', minWidth: 185 }}
            >
              <option value="all">All Specializations</option>
              {SPECIALIZATIONS.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </SelectInput>

            <SelectInput
              aria-label="Filter by status"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              style={{ width: 'auto', minWidth: 140 }}
            >
              <option value="all">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </SelectInput>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            )}
          </div>
          <span className="text-muted">
            {doctors.length} doctor{doctors.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading && <LoadingState message="Loading doctors directory..." />}

        {!loading && error && (
          <ErrorState
            title="Unable to load doctors"
            message={error}
            onRetry={loadDoctors}
          />
        )}

        {!loading && !error && doctors.length === 0 && (
          <EmptyState
            icon={Stethoscope}
            title={hasFilters ? 'No matching doctors' : 'No doctors registered yet'}
            description={
              hasFilters
                ? 'Try adjusting your search query or filters to find a doctor.'
                : 'Add your first dental specialist to begin scheduling appointments.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={resetFilters}>
                  Reset Filters
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setEditingDoctor(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus size={15} />
                  Add Doctor
                </Button>
              )
            }
          />
        )}

        {!loading && !error && doctors.length > 0 && (
          <DataTable
            ariaLabel="Doctors directory"
            columns={columns}
            rows={doctors}
            renderMobileCard={(doc) => (
              <>
                <div className="row-between">
                  <div className="row-inline" style={{ gap: 10 }}>
                    <div className="avatar">{getInitials(doc.name)}</div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{doc.name}</div>
                      <div className="text-muted">{doc.specialization}</div>
                    </div>
                  </div>
                  <ActiveBadge isActive={doc.is_active} />
                </div>
                <div className="stack-sm text-secondary" style={{ fontSize: '0.85rem' }}>
                  <span>{doc.phone} • {doc.email}</span>
                  <span>Schedule: {doc.availability}</span>
                </div>
                <div className="row-between" style={{ paddingTop: 4 }}>
                  <span className="text-muted">
                    {doc.appointment_count ?? 0} appointment{doc.appointment_count === 1 ? '' : 's'}
                  </span>
                  <div className="table-actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setDetailDoctorId(doc.id)}
                    >
                      View
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingDoctor(doc);
                        setFormOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger-ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(doc)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </>
            )}
          />
        )}
      </Card>

      <DoctorFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingDoctor(null);
        }}
        doctor={editingDoctor}
        onSubmit={handleSaveDoctor}
      />

      <DoctorDetailModal
        doctorId={detailDoctorId}
        isOpen={Boolean(detailDoctorId)}
        onClose={() => setDetailDoctorId(null)}
        onEdit={(doc) => {
          setEditingDoctor(doc);
          setFormOpen(true);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isSubmitting={deleting}
        title="Delete Doctor"
        confirmLabel="Delete Doctor"
        message={
          deleteTarget
            ? deleteTarget.appointment_count > 0
              ? `Are you sure you want to delete ${deleteTarget.name}? This will also permanently remove ${deleteTarget.appointment_count} associated appointment${deleteTarget.appointment_count === 1 ? '' : 's'}.`
              : `Are you sure you want to delete ${deleteTarget.name} from the clinic directory? This action cannot be undone.`
            : ''
        }
      />
    </div>
  );
}
