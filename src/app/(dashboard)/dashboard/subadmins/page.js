'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { FiPlus, FiTrash2, FiUser, FiMail, FiCalendar } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';

export default function SubAdminsPage() {
  const { admin } = useAuth();
  const [subadmins, setSubadmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubadmins();
  }, []);

  const fetchSubadmins = async () => {
    try {
      const res = await api.get('/subadmins');
      setSubadmins(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/subadmins', formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '' });
      fetchSubadmins();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this shop owner? All their schools will remain but they will lose access.')) return;
    try {
      await api.delete(`/subadmins/${id}`);
      fetchSubadmins();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting');
    }
  };

  if (admin?.role !== 'SUPER_ADMIN') {
    return <div className="p-8">Access Denied</div>;
  }

  return (
    <div className="p-6">
      <div className="page-header">
        <div>
          <h1>ID Card Shop Owners</h1>
          <p>Manage companies and shops that use your platform to create ID cards.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <FiPlus /> Add Shop Owner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subadmins.map((sa) => (
            <div key={sa.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="avatar">
                    <FiUser />
                  </div>
                  <div>
                    <h3 className="font-bold">{sa.name}</h3>
                    <p className="text-sm text-muted flex items-center gap-1">
                      <FiMail size={12} /> {sa.email}
                    </p>
                  </div>
                </div>
                <button className="text-red-500 hover:text-red-700" onClick={() => handleDelete(sa.id)}>
                  <FiTrash2 />
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                <span className="text-muted flex items-center gap-1">
                  <FiCalendar size={12} /> Joined {new Date(sa.createdAt).toLocaleDateString()}
                </span>
                <span className="badge badge-blue">{sa._count?.schools || 0} Schools</span>
              </div>
            </div>
          ))}
          {subadmins.length === 0 && (
            <div className="col-span-full p-12 text-center text-muted card">
              No shop owners found. Create your first partner account.
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <h2 className="mb-4">Add New Shop Owner</h2>
            {error && <div className="alert alert-error mb-4">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Company/Owner Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Initial Password</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
