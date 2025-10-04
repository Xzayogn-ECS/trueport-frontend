import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Uploader from '../../../components/Uploader';
import api from '../../../utils/api';

export default function EditEducation({ showToast }) {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState({
    courseType: 'BACHELORS',
    courseName: '',
    boardOrUniversity: '',
    schoolOrCollege: '',
    passingYear: new Date().getFullYear(),
    isExpected: false,
    grade: '',
    percentage: '',
    cgpa: '',
    description: '',
    attachments: [],
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchEducation();
    }
  }, [id]);

  const fetchEducation = async () => {
    try {
      const response = await api.get(`/education/${id}`);
      console.log(response.data);
      const education = response.data.education;
      setFormData({
        courseType: education.courseType,
        courseName: education.courseName,
        boardOrUniversity: education.boardOrUniversity,
        schoolOrCollege: education.schoolOrCollege,
        passingYear: education.passingYear,
        isExpected: education.isExpected || false,
        grade: education.grade || '',
        percentage: education.percentage || '',
        cgpa: education.cgpa || '',
        description: education.description || '',
        attachments: education.attachments || [],
      });
    } catch (error) {
      console.error('Failed to fetch education:', error);
      showToast('Failed to load education details', 'error');
      router.push('/education');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleFileUpload = (urls) => {
    const attachmentUrls = Array.isArray(urls) ? urls : [urls];
    setFormData({
      ...formData,
      attachments: [...formData.attachments, ...attachmentUrls],
    });
  };

  const removeAttachment = (index) => {
    const newAttachments = formData.attachments.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      attachments: newAttachments,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        passingYear: parseInt(formData.passingYear),
        percentage: formData.percentage ? parseFloat(formData.percentage) : undefined,
        cgpa: formData.cgpa ? parseFloat(formData.cgpa) : undefined,
      };

      await api.put(`/education/${id}`, payload);
      showToast('Education entry updated successfully!', 'success');
      router.push('/education');
    } catch (error) {
      console.error('Failed to update education entry:', error);
      showToast(error.response?.data?.message || 'Failed to update education entry', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading education details...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear + 10 - i);

  return (
    <ProtectedRoute>
      <Head>
        <title>Edit Education - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Edit Education Entry</h1>
            <p className="text-gray-600">Update your educational background details</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="courseType" className="block text-sm font-medium text-gray-700">
                    Course Type *
                  </label>
                  <select
                    id="courseType"
                    name="courseType"
                    required
                    className="form-input mt-1"
                    value={formData.courseType}
                    onChange={handleChange}
                  >
                    <option value="10TH">10th Grade</option>
                    <option value="12TH">12th Grade</option>
                    <option value="DIPLOMA">Diploma</option>
                    <option value="BACHELORS">Bachelor's Degree</option>
                    <option value="MASTERS">Master's Degree</option>
                    <option value="PHD">PhD</option>
                    <option value="CERTIFICATE">Certificate Course</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="passingYear" className="block text-sm font-medium text-gray-700">
                    Passing Year *
                  </label>
                  <select
                    id="passingYear"
                    name="passingYear"
                    required
                    className="form-input mt-1"
                    value={formData.passingYear}
                    onChange={handleChange}
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="courseName" className="block text-sm font-medium text-gray-700">
                  Course Name *
                </label>
                <input
                  type="text"
                  id="courseName"
                  name="courseName"
                  required
                  className="form-input mt-1"
                  placeholder="e.g., Bachelor of Technology in Computer Science"
                  value={formData.courseName}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="boardOrUniversity" className="block text-sm font-medium text-gray-700">
                    Board/University *
                  </label>
                  <input
                    type="text"
                    id="boardOrUniversity"
                    name="boardOrUniversity"
                    required
                    className="form-input mt-1"
                    placeholder="e.g., Mumbai University, CBSE"
                    value={formData.boardOrUniversity}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="schoolOrCollege" className="block text-sm font-medium text-gray-700">
                    School/College *
                  </label>
                  <input
                    type="text"
                    id="schoolOrCollege"
                    name="schoolOrCollege"
                    required
                    className="form-input mt-1"
                    placeholder="e.g., ABC College of Engineering"
                    value={formData.schoolOrCollege}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="isExpected"
                  name="isExpected"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  checked={formData.isExpected}
                  onChange={handleChange}
                />
                <label htmlFor="isExpected" className="ml-2 block text-sm text-gray-700">
                  This is an expected completion date
                </label>
              </div>

              {/* Grades Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Performance (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                      Grade
                    </label>
                    <input
                      type="text"
                      id="grade"
                      name="grade"
                      className="form-input mt-1"
                      placeholder="e.g., A+, First Class"
                      value={formData.grade}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="percentage" className="block text-sm font-medium text-gray-700">
                      Percentage
                    </label>
                    <input
                      type="number"
                      id="percentage"
                      name="percentage"
                      step="0.01"
                      min="0"
                      max="100"
                      className="form-input mt-1"
                      placeholder="85.5"
                      value={formData.percentage}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="cgpa" className="block text-sm font-medium text-gray-700">
                      CGPA
                    </label>
                    <input
                      type="number"
                      id="cgpa"
                      name="cgpa"
                      step="0.01"
                      min="0"
                      max="10"
                      className="form-input mt-1"
                      placeholder="8.5"
                      value={formData.cgpa}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="form-textarea mt-1"
                  placeholder="Describe your specialization, achievements, or notable coursework..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificates/Documents
                </label>
                <Uploader
                  onUpload={handleFileUpload}
                  multiple={true}
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                
                {formData.attachments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h4>
                    <div className="space-y-2">
                      {formData.attachments.map((url, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 text-sm truncate"
                          >
                            Certificate {index + 1}
                          </a>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Education Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}