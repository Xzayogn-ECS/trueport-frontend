import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute';
import SidebarLayout from '../components/SidebarLayout';
import api from '../utils/api';

export default function InstitutionCreate() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    displayName: '',
    institutionType: '',
    description: '',
    website: '',
    logo: '',
    address: '',
    state: '',
    district: '',
    contactEmail: '',
    contactPhone: ''
  });
  const [stateDistrictData, setStateDistrictData] = useState({});
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [loading, setLoading] = useState(false);

const normalizeStateDistrict = (raw) => {
  if (raw?.states && Array.isArray(raw.states)) {
    const map = {};
    raw.states.forEach(s => { map[s.state] = s.districts || []; });
    return map;
  }
  return raw || {};
};



useEffect(() => {
  fetch('https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json')
    .then(res => res.json())
    .then(raw => {
      const data = normalizeStateDistrict(raw);
      setStateDistrictData(data);
      setStatesList(Object.keys(data).sort((a, b) => a.localeCompare(b)));
    })
    .catch(err => console.error('Failed to load state/district data', err));
}, []);

  // Update districts when state changes
useEffect(() => {
  const list = stateDistrictData[form.state] || [];
  setDistrictsList([...list].sort((a, b) => a.localeCompare(b)));
  setForm(prev => ({ ...prev, district: '' }));
}, [form.state, stateDistrictData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        displayName: form.displayName,
        institutionType: form.institutionType,
        description: form.description,
        website: form.website,
        logo: form.logo,
        address: form.address,
        state: form.state,
        district: form.district,
        contactInfo: {
          email: form.contactEmail,
          phone: form.contactPhone
        }
      };
      console.log(payload);
      const res = await api.post('/institution-create', payload);
      alert(res.data.message);
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Create Institution - TruePortMe</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Create Institution</h1>
          <p className="mb-6 text-gray-600">
            If your institution is not listed, you can either fill out our quick suggestion form or submit full details here.
          </p>
          <div className="mb-6 border border-gray-200 p-4 rounded-lg bg-white">
            <h2 className="font-semibold mb-2">Option 1: Fill your Institution's Detail Here</h2>
            <p className="text-sm text-gray-700 mb-4">
              Fill a short form and we'll take it from here.
            </p>
            <a
              href="https://docs.google.com/forms/d/e/YOUR_GOOGLE_FORM_ID/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Open Suggestion Form
            </a>
          </div>
          <div className="mb-6 border border-gray-200 p-4 rounded-lg bg-white">
            <h2 className="font-semibold mb-2">Option 2: Are you an Admin?</h2>
            <p className="text-sm text-gray-700 mb-4">
             Fill the details below and we will contact you.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Institution Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="input-primary mt-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Name *</label>
                <input
                  type="text"
                  name="displayName"
                  required
                  value={form.displayName}
                  onChange={handleChange}
                  className="input-primary mt-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Institution Type *</label>
                <select
                  name="institutionType"
                  required
                  value={form.institutionType}
                  onChange={handleChange}
                  className="input-primary mt-1 w-full"
                >
                  <option value="">Select type</option>
                  <option value="SCHOOL">School</option>
                  <option value="COLLEGE_UNIVERSITY">College/University</option>
                  <option value="NGO">NGO</option>
                  <option value="COMPANY">Company</option>
                  <option value="GOVT_BODY">Government Body</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Email *</label>
                <input
                  type="email"
                  name="contactEmail"
                  required
                  value={form.contactEmail}
                  onChange={handleChange}
                  className="input-primary mt-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                <input
                  type="text"
                  name="contactPhone"
                  value={form.contactPhone}
                  onChange={handleChange}
                  className="input-primary mt-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input
                  type="url"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  className="input-primary mt-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="input-primary mt-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="input-primary mt-1 w-full"
                >
                  <option value="">Select state</option>
                  {statesList.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
<div>
  <label className="block text-sm font-medium text-gray-700">District</label>
  <select
    name="district"
    value={form.district}
    onChange={handleChange}
    className="input-primary mt-1 w-full"
    disabled={!form.state}
  >
    <option value="">{form.state ? 'Select district' : 'Select state first'}</option>
    {districtsList.map(d => (
      <option key={d} value={d}>{d}</option>
    ))}
  </select>
</div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleChange}
                  className="input-primary mt-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                <input
                  type="url"
                  name="logo"
                  value={form.logo}
                  onChange={handleChange}
                  className="input-primary mt-1 w-full"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Submitting...' : 'Submit Institution'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

InstitutionCreate.getLayout = function getLayout(page) {
  return <SidebarLayout title="Suggest Institution">{page}</SidebarLayout>;
};
