'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Layers, 
  Plus, 
  Edit, 
  Trash2, 
  Building,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Phase {
  id: number;
  project_id: number;
  name: string;
  amount_required: number;
  amount_paid: number;
  status: string;
  start_date?: string;
  end_date?: string;
  project_name?: string;
  suppliers?: any[];
}

interface Project {
  id: number;
  name: string;
}

export default function PhasesPage() {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [formData, setFormData] = useState({
    project_id: '',
    name: '',
    amount_required: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchAllPhases();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('فشل في جلب المشاريع');
    }
  };

  const fetchAllPhases = async () => {
    try {
      setLoading(true);
      // جلب المراحل لجميع المشاريع
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const projectsData = await response.json();
      
      const allPhases: Phase[] = [];
      
      for (const project of projectsData) {
        const phasesResponse = await fetch(`/api/phases?project_id=${project.id}`);
        if (phasesResponse.ok) {
          const phasesData = await phasesResponse.json();
          const phasesWithProject = phasesData.map((phase: Phase) => ({
            ...phase,
            project_name: project.name
          }));
          allPhases.push(...phasesWithProject);
        }
      }
      
      setPhases(allPhases);
    } catch (error) {
      console.error('Error fetching phases:', error);
      toast.error('فشل في جلب المراحل');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhasesByProject = async (projectId: string) => {
    if (!projectId) {
      fetchAllPhases();
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/phases?project_id=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch phases');
      const data = await response.json();
      
      const project = projects.find(p => p.id === parseInt(projectId));
      const phasesWithProject = data.map((phase: Phase) => ({
        ...phase,
        project_name: project?.name
      }));
      
      setPhases(phasesWithProject);
    } catch (error) {
      console.error('Error fetching phases:', error);
      toast.error('فشل في جلب المراحل');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project_id || !formData.name || !formData.amount_required) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const response = await fetch('/api/phases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount_required: parseFloat(formData.amount_required)
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create phase');
      }

      toast.success('تم إضافة المرحلة بنجاح');
      setShowAddModal(false);
      setFormData({
        project_id: '',
        name: '',
        amount_required: '',
        start_date: '',
        end_date: ''
      });
      
      if (selectedProject) {
        fetchPhasesByProject(selectedProject);
      } else {
        fetchAllPhases();
      }
    } catch (error: any) {
      console.error('Error creating phase:', error);
      toast.error(error.message || 'فشل في إضافة المرحلة');
    }
  };

  const deletePhase = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه المرحلة؟')) return;

    try {
      const response = await fetch(`/api/phases/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete phase');
      
      toast.success('تم حذف المرحلة بنجاح');
      
      if (selectedProject) {
        fetchPhasesByProject(selectedProject);
      } else {
        fetchAllPhases();
      }
    } catch (error) {
      console.error('Error deleting phase:', error);
      toast.error('فشل في حذف المرحلة');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'معلقة', color: 'bg-gray-100 text-gray-800', icon: Clock },
      in_progress: { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      completed: { label: 'مكتملة', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="ml-1 h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const getProgress = (phase: Phase) => {
    if (phase.amount_required === 0) return 0;
    return Math.round((phase.amount_paid / phase.amount_required) * 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Layers className="ml-2 h-6 w-6" />
              إدارة المراحل
            </h1>
            <p className="text-gray-600 mt-1">
              عدد المراحل: {phases.length}
            </p>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                fetchPhasesByProject(e.target.value);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع المشاريع</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="ml-2 h-5 w-5" />
              إضافة مرحلة
            </button>
          </div>
        </div>
      </div>

      {/* Phases Grid */}
      {phases.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Layers className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-gray-500">لا توجد مراحل مضافة بعد</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="mt-4 text-blue-600 hover:underline"
          >
            إضافة أول مرحلة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {phases.map((phase) => (
            <div key={phase.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Link href={`/projects/${phase.project_id}/phases/${phase.id}`}>
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                        {phase.name}
                      </h3>
                    </Link>
                    <Link href={`/projects/${phase.project_id}`}>
                      <p className="text-sm text-gray-500 flex items-center mt-1 hover:text-gray-700">
                        <Building className="ml-1 h-4 w-4" />
                        {phase.project_name}
                      </p>
                    </Link>
                  </div>
                  {getStatusBadge(phase.status)}
                </div>

                {/* Financial Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">المبلغ المطلوب</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(phase.amount_required)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">المبلغ المدفوع</p>
                    <p className="text-sm font-semibold text-green-600">
                      {formatCurrency(phase.amount_paid)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>التقدم</span>
                    <span>{getProgress(phase)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgress(phase)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center text-xs text-gray-500 mb-4">
                  <Calendar className="ml-1 h-3 w-3" />
                  <span>
                    {phase.start_date ? formatDate(phase.start_date) : 'لم يبدأ'} - 
                    {phase.end_date ? formatDate(phase.end_date) : 'غير محدد'}
                  </span>
                </div>

                {/* Suppliers Count */}
                {phase.suppliers && phase.suppliers.length > 0 && (
                  <div className="text-xs text-gray-500 mb-4">
                    عدد الموردين: {phase.suppliers.length}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between pt-3 border-t">
                  <Link href={`/projects/${phase.project_id}/phases/${phase.id}`}>
                    <button className="text-sm text-blue-600 hover:underline">
                      عرض التفاصيل ←
                    </button>
                  </Link>
                  <div className="flex space-x-2 space-x-reverse">
                    <button 
                      className="text-yellow-600 hover:text-yellow-900"
                      title="تعديل"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => deletePhase(phase.id)}
                      className="text-red-600 hover:text-red-900"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Phase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">إضافة مرحلة جديدة</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 mb-1">
                  المشروع *
                </label>
                <select
                  id="project_id"
                  value={formData.project_id}
                  onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر المشروع</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المرحلة *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: الأساسات"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="amount_required" className="block text-sm font-medium text-gray-700 mb-1">
                  المبلغ المطلوب *
                </label>
                <input
                  type="number"
                  id="amount_required"
                  value={formData.amount_required}
                  onChange={(e) => setFormData({...formData, amount_required: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100000"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  تاريخ البدء
                </label>
                <input
                  type="date"
                  id="start_date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                  تاريخ الانتهاء المتوقع
                </label>
                <input
                  type="date"
                  id="end_date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      project_id: '',
                      name: '',
                      amount_required: '',
                      start_date: '',
                      end_date: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}