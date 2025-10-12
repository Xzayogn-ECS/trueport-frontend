import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute';
import SidebarLayout from '../components/SidebarLayout';
import api from '../utils/api';

export default function InstitutionClaim() {
  const router = useRouter();
  const { instId } = router.query;
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!instId) return;
    const fetchInstitution = async () => {
      try {
        const res = await api.get(`/institution-create/${instId}`);
        setInstitution(res.data.institution || res.data);
      } catch (err) {
        console.error('Failed to load institution details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInstitution();
  }, [instId]);

  // Student vs Admin Claim
  const studentFormUrl = 'https://docs.google.com/forms/d/e/YOUR_GOOGLE_FORM_ID/viewform';
  const [adminForm, setAdminForm] = useState({ name: '', email: '', phone: '', designation: '' });

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdminForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!instId) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/institution-create/${instId}/claim`, adminForm);
      alert(res.data.message || 'Claim request submitted!');
      router.push('/profile');
    } catch (err) {
      console.error('Claim request failed:', err);
      alert(err.response?.data?.message || 'Failed to submit claim request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Loading institution details...</p>
    </div>
  );

  return (
    <ProtectedRoute>
      <SidebarLayout title="Claim Institution">
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Claim Institution</h1>
          {institution ? (
            <div className="space-y-6">
              {/* Option 1: Student Suggestion Form */}
              <div className="border border-gray-200 p-4 rounded bg-gray-50">
                <h2 className="text-lg font-semibold mb-2">Are you a student?</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Fill out our student claim form so we can verify your association.
                </p>
                <a
                  href={studentFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >Open Student Claim Form</a>
              </div>

              {/* Option 2: Admin Claim Form */}
              <div className="border border-gray-200 p-4 rounded bg-white">
                <h2 className="text-lg font-semibold mb-2">Are you an Admin?</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Fill in your details below to claim this institution.
                </p>
                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text" name="name" required value={adminForm.name} onChange={handleAdminChange}
                      className="input-primary mt-1 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email" name="email" required value={adminForm.email} onChange={handleAdminChange}
                      className="input-primary mt-1 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone *</label>
                    <input
                      type="text" name="phone" required value={adminForm.phone} onChange={handleAdminChange}
                      className="input-primary mt-1 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Designation *</label>
                    <input
                      type="text" name="designation" required value={adminForm.designation} onChange={handleAdminChange}
                      className="input-primary mt-1 w-full"
                    />
                  </div>
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Submitting...' : 'Submit Claim'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <p className="mb-6">Institution not found.</p>
          )}
         </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

InstitutionClaim.getLayout = function getLayout(page) {
  return page;
};
