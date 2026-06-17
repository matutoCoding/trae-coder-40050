import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import PageHeader, { Toolbar } from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { validateForm } from '@/components/FormModal';
import type { ValidationRule } from '@/components/FormModal';
import { formatDateTime, generateId } from '@/utils/format';
import type { Column } from '@/components/DataTable';
import { Link } from 'react-router-dom';
import type { MeltingRecord, MaterialItem, CompositionItem } from '@/types';
import { 
  Eye, Factory, Scale, Thermometer, Clock, FlaskConical, 
  Plus, X, AlertCircle, CheckCircle2, Check, XCircle 
} from 'lucide-react';

interface MaterialFormItem {
  name: string;
  standardRange: string;
  actualWeight: string;
  percentage: string;
}

interface CompositionFormItem {
  element: string;
  standard: string;
  content: string;
  isQualified: boolean;
}

const defaultMaterial: MaterialFormItem = {
  name: '',
  standardRange: '',
  actualWeight: '',
  percentage: '',
};

const defaultComposition: CompositionFormItem = {
  element: '',
  standard: '',
  content: '',
  isQualified: true,
};

export default function AlloyMelting() {
  const { 
    meltingRecords, 
    getWorkOrderById,
    workOrders,
    addMeltingRecord
  } = useStore();
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MeltingRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [materials, setMaterials] = useState<MaterialFormItem[]>([]);
  const [compositions, setCompositions] = useState<CompositionFormItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const filteredRecords = meltingRecords.filter((r) =>
    r.alloyGrade.toLowerCase().includes(searchText.toLowerCase()) ||
    r.furnaceNo.toLowerCase().includes(searchText.toLowerCase())
  );

  const workOrderOptions = workOrders
    .filter(o => o.status === 'melting' || o.status === 'firing' || o.status === 'pending')
    .map(o => ({ value: o.id, label: `${o.orderNo} - ${o.productName}` }));

  const stats = useMemo(() => {
    const totalWeight = meltingRecords.reduce((sum, r) => sum + r.totalWeight, 0);
    const alloyTypes = new Set(meltingRecords.map(r => r.alloyGrade)).size;
    const avgMeltingTemp = meltingRecords.length > 0
      ? (meltingRecords.reduce((sum, r) => sum + r.meltingTemperature, 0) / meltingRecords.length).toFixed(0)
      : 0;
    const qualifiedCount = meltingRecords.filter(r => 
      !r.compositionTest || r.compositionTest.every(c => c.isQualified)
    ).length;
    const passRate = meltingRecords.length > 0
      ? ((qualifiedCount / meltingRecords.length) * 100).toFixed(1)
      : '0';
    
    return [
      { 
        label: '今日熔炼炉次', 
        value: String(meltingRecords.length), 
        unit: '炉', 
        icon: <Factory size={24} className="text-orange-600" />,
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-600',
        valueColor: 'text-slate-800'
      },
      { 
        label: '总熔炼量', 
        value: totalWeight.toLocaleString(), 
        unit: 'kg', 
        icon: <Scale size={24} className="text-emerald-600" />,
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-600',
        valueColor: 'text-emerald-600'
      },
      { 
        label: '合金种类', 
        value: String(alloyTypes), 
        unit: '种', 
        icon: <FlaskConical size={24} className="text-blue-600" />,
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600',
        valueColor: 'text-blue-600'
      },
      { 
        label: '成分合格率', 
        value: passRate, 
        unit: '%', 
        icon: <Thermometer size={24} className="text-amber-600" />,
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-600',
        valueColor: 'text-amber-600'
      },
    ];
  }, [meltingRecords]);

  const columns: Column<MeltingRecord>[] = [
    {
      key: 'workOrderId',
      title: '工单编号',
      render: (record) => {
        const order = getWorkOrderById(record.workOrderId);
        return (
          <Link to={`/work-order/${record.workOrderId}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
            {order?.orderNo || '-'}
          </Link>
        );
      },
    },
    {
      key: 'furnaceNo',
      title: '中频炉编号',
    },
    {
      key: 'alloyGrade',
      title: '合金牌号',
      render: (record) => (
        <span className="text-sm font-medium text-slate-800">{record.alloyGrade}</span>
      ),
    },
    {
      key: 'totalWeight',
      title: '总重量(kg)',
      render: (record) => (
        <span className="text-sm">{record.totalWeight} kg</span>
      ),
    },
    {
      key: 'meltingTemperature',
      title: '熔炼温度(°C)',
      render: (record) => (
        <span className="text-sm font-medium text-orange-600">{record.meltingTemperature}°C</span>
      ),
    },
    {
      key: 'meltingTime',
      title: '熔炼时间(min)',
      render: (record) => (
        <span className="text-sm">{record.meltingTime} min</span>
      ),
    },
    {
      key: 'degassingTime',
      title: '除气时间(min)',
      render: (record) => (
        <span className="text-sm">{record.degassingTime} min</span>
      ),
    },
    {
      key: 'operator',
      title: '操作工',
    },
    {
      key: 'action',
      title: '操作',
      render: (record) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord(record);
            setShowDetail(true);
          }}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          <Eye size={14} />
          详情
        </button>
      ),
    },
  ];

  const validationRules: ValidationRule[] = [
    { field: 'workOrderId', label: '关联工单', required: true },
    { field: 'furnaceNo', label: '中频炉编号', required: true },
    { field: 'alloyGrade', label: '合金牌号', required: true },
    { field: 'operator', label: '操作工', required: true },
    { field: 'totalWeight', label: '总重量', required: true, type: 'number', min: 1, max: 10000 },
    { field: 'meltingTemperature', label: '熔炼温度', required: true, type: 'number', min: 500, max: 3000 },
    { field: 'meltingTime', label: '熔炼时间', required: true, type: 'number', min: 5, max: 600 },
    { field: 'degassingTime', label: '除气时间', required: true, type: 'number', min: 1, max: 120 },
    { field: 'pouringTemperature', label: '浇注温度', required: true, type: 'number', min: 500, max: 3000 },
    { 
      field: 'pouringTemperature', 
      label: '浇注温度', 
      type: 'number',
      custom: (value, allValues) => {
        const pour = Number(value);
        const melt = Number(allValues.meltingTemperature);
        if (!isNaN(pour) && !isNaN(melt) && pour > melt) {
          return '浇注温度不能高于熔炼温度';
        }
        return null;
      }
    },
    { field: 'startTime', label: '开始时间', required: true },
  ];

  const resetForm = () => {
    setFormValues({
      workOrderId: '',
      furnaceNo: '',
      alloyGrade: '',
      totalWeight: '',
      meltingTemperature: 1680,
      meltingTime: 45,
      degassingTime: 10,
      pouringTemperature: 1620,
      operator: '',
      startTime: new Date().toISOString().slice(0, 16),
      remark: '',
    });
    setMaterials([]);
    setCompositions([]);
    setErrors({});
    setShowSuccess(false);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleFormChange = (name: string, value: string | number) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const addMaterialItem = () => {
    setMaterials(prev => [...prev, { ...defaultMaterial }]);
  };

  const removeMaterialItem = (index: number) => {
    setMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const updateMaterialItem = (index: number, field: keyof MaterialFormItem, value: string) => {
    setMaterials(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const addCompositionItem = () => {
    setCompositions(prev => [...prev, { ...defaultComposition }]);
  };

  const removeCompositionItem = (index: number) => {
    setCompositions(prev => prev.filter((_, i) => i !== index));
  };

  const updateCompositionItem = (index: number, field: keyof CompositionFormItem, value: string | boolean) => {
    setCompositions(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validateForm(formValues, validationRules);
    
    let hasMaterialError = false;
    let hasCompositionError = false;
    
    const filteredMaterials = materials.filter(mat => 
      mat.name.trim() || mat.standardRange.trim() || mat.actualWeight.trim() || mat.percentage.trim()
    );

    if (filteredMaterials.length < 2) {
      newErrors['materials'] = '请至少添加2种配料明细';
      hasMaterialError = true;
    } else {
      filteredMaterials.forEach((mat, idx) => {
        if (!mat.name.trim()) {
          newErrors[`material_name_${idx}`] = `第${idx + 1}条配料名称不能为空`;
          hasMaterialError = true;
        }
        if (!mat.actualWeight.trim() || isNaN(Number(mat.actualWeight)) || Number(mat.actualWeight) <= 0) {
          newErrors[`material_weight_${idx}`] = `第${idx + 1}条实际加入量必须为大于0的有效数字`;
          hasMaterialError = true;
        }
        if (!mat.percentage.trim() || isNaN(Number(mat.percentage)) || Number(mat.percentage) <= 0) {
          newErrors[`material_percentage_${idx}`] = `第${idx + 1}条占比必须为大于0的有效数字`;
          hasMaterialError = true;
        }
      });
    }

    const filteredCompositions = compositions.filter(comp => 
      comp.element.trim() || comp.standard.trim() || comp.content.trim()
    );

    if (filteredCompositions.length > 0 && filteredCompositions.length < 3) {
      newErrors['compositions'] = '成分检测至少需要3种元素检测';
      hasCompositionError = true;
    } else if (filteredCompositions.length >= 3) {
      filteredCompositions.forEach((comp, idx) => {
        if (!comp.element.trim()) {
          newErrors[`composition_element_${idx}`] = `第${idx + 1}条元素名称不能为空`;
          hasCompositionError = true;
        }
        if (!comp.content.trim() || isNaN(Number(comp.content))) {
          newErrors[`composition_content_${idx}`] = `第${idx + 1}条含量必须为有效数字`;
          hasCompositionError = true;
        }
        if (!comp.standard.trim()) {
          newErrors[`composition_standard_${idx}`] = `第${idx + 1}条标准值不能为空`;
          hasCompositionError = true;
        }
      });
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const formatDT = (v: unknown) => {
      const s = String(v);
      return s.includes('T') ? s.replace('T', ' ') + ':00' : s;
    };

    const materialItems: MaterialItem[] = filteredMaterials.map(mat => ({
      name: mat.name.trim(),
      weight: Number(mat.actualWeight),
      percentage: Number(mat.percentage),
      standard: mat.standardRange.trim() || undefined,
    }));

    let compositionItems: CompositionItem[] | undefined;
    if (filteredCompositions.length > 0) {
      compositionItems = filteredCompositions.map(comp => ({
        element: comp.element.trim(),
        content: Number(comp.content) || 0,
        standard: comp.standard.trim(),
        isQualified: comp.isQualified,
      }));
    }

    const newRecord: MeltingRecord = {
      id: generateId('ml'),
      workOrderId: String(formValues.workOrderId),
      furnaceNo: String(formValues.furnaceNo),
      alloyGrade: String(formValues.alloyGrade),
      totalWeight: Number(formValues.totalWeight),
      materials: materialItems,
      meltingTemperature: Number(formValues.meltingTemperature),
      meltingTime: Number(formValues.meltingTime),
      degassingTime: Number(formValues.degassingTime),
      operator: String(formValues.operator),
      startTime: formatDT(formValues.startTime),
      compositionTest: compositionItems,
    };
    
    setShowSuccess(true);
    setTimeout(() => {
      addMeltingRecord(newRecord);
      setShowAddModal(false);
    }, 500);
  };

  const renderFieldError = (fieldName: string) => {
    if (!errors[fieldName]) return null;
    return (
      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
        <AlertCircle size={12} />
        {errors[fieldName]}
      </p>
    );
  };

  const hasError = (fieldName: string) => !!errors[fieldName];

  const inputClass = (fieldName: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
      hasError(fieldName) ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
    }`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="合金熔炼"
        description="管理中频炉熔炼配料过程，监控合金成分和熔炼工艺"
        addButtonText="新增熔炼记录"
        onAdd={openAddModal}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.valueColor}`}>
                  {stat.value} <span className="text-sm font-normal text-slate-500">{stat.unit}</span>
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">熔炼工艺参数</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Thermometer size={20} className="text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">TC4钛合金</span>
                </div>
                <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">常用</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xl font-bold text-orange-700">1680°C</p>
                  <p className="text-xs text-orange-600">熔炼温度</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-orange-700">45 min</p>
                  <p className="text-xs text-orange-600">熔炼时间</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-orange-700">10 min</p>
                  <p className="text-xs text-orange-600">除气时间</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Thermometer size={20} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">45号钢</span>
                </div>
                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">常用</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-700">1580°C</p>
                  <p className="text-xs text-blue-600">熔炼温度</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-700">60 min</p>
                  <p className="text-xs text-blue-600">熔炼时间</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-700">8 min</p>
                  <p className="text-xs text-blue-600">除气时间</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">设备运行状态</h3>
          <div className="space-y-3">
            {['中频炉1号', '中频炉2号', '中频炉3号'].map((furnace, index) => (
              <div key={furnace} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-green-500 animate-pulse' : 
                    index === 1 ? 'bg-green-500 animate-pulse' : 'bg-slate-300'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{furnace}</p>
                    <p className="text-xs text-slate-500">
                      {index === 0 ? '熔炼中 - TC4钛合金' : 
                       index === 1 ? '熔炼中 - 45号钢' : '待机中'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">
                    {index === 0 ? '1680°C' : index === 1 ? '1580°C' : '-'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {index === 0 ? '已运行 35min' : 
                     index === 1 ? '已运行 42min' : '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          新增熔炼记录
        </button>
      </div>

      <div>
        <Toolbar
          searchPlaceholder="搜索合金牌号或炉号..."
          searchValue={searchText}
          onSearchChange={setSearchText}
        />
        <DataTable
          columns={columns}
          data={filteredRecords}
          rowKey="id"
          pagination={{
            current: 1,
            pageSize: 10,
            total: filteredRecords.length,
            onChange: () => {},
          }}
        />
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-slate-800">新增熔炼记录</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {showSuccess ? (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-green-600" />
                  </div>
                  <p className="text-lg font-semibold text-slate-800">保存成功！</p>
                  <p className="text-sm text-slate-500 mt-1">记录已添加到列表中</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">
                      基本信息
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          关联工单<span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          value={String(formValues.workOrderId || '')}
                          onChange={(e) => handleFormChange('workOrderId', e.target.value)}
                          className={inputClass('workOrderId')}
                        >
                          <option value="">请选择工单</option>
                          {workOrderOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        {renderFieldError('workOrderId')}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          中频炉编号<span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={String(formValues.furnaceNo || '')}
                          onChange={(e) => handleFormChange('furnaceNo', e.target.value)}
                          placeholder="如：ZP-01"
                          className={inputClass('furnaceNo')}
                        />
                        {renderFieldError('furnaceNo')}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          合金牌号<span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={String(formValues.alloyGrade || '')}
                          onChange={(e) => handleFormChange('alloyGrade', e.target.value)}
                          placeholder="如：TC4、45号钢"
                          className={inputClass('alloyGrade')}
                        />
                        {renderFieldError('alloyGrade')}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          操作工<span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={String(formValues.operator || '')}
                          onChange={(e) => handleFormChange('operator', e.target.value)}
                          placeholder="请输入操作工姓名"
                          className={inputClass('operator')}
                        />
                        {renderFieldError('operator')}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">
                      熔炼工艺参数
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          总重量(kg)<span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="number"
                          value={String(formValues.totalWeight || '')}
                          onChange={(e) => handleFormChange('totalWeight', e.target.value)}
                          placeholder="1-10000"
                          step="0.1"
                          min="1"
                          max="10000"
                          className={inputClass('totalWeight')}
                        />
                        {renderFieldError('totalWeight')}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          熔炼温度(°C)<span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="number"
                          value={String(formValues.meltingTemperature || '')}
                          onChange={(e) => handleFormChange('meltingTemperature', e.target.value)}
                          placeholder="500-3000"
                          step="1"
                          min="500"
                          max="3000"
                          className={inputClass('meltingTemperature')}
                        />
                        {renderFieldError('meltingTemperature')}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          浇注温度(°C)<span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="number"
                          value={String(formValues.pouringTemperature || '')}
                          onChange={(e) => handleFormChange('pouringTemperature', e.target.value)}
                          placeholder="低于熔炼温度"
                          step="1"
                          min="500"
                          max="3000"
                          className={inputClass('pouringTemperature')}
                        />
                        {renderFieldError('pouringTemperature')}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          熔炼时间(min)<span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="number"
                          value={String(formValues.meltingTime || '')}
                          onChange={(e) => handleFormChange('meltingTime', e.target.value)}
                          placeholder="5-600"
                          step="1"
                          min="5"
                          max="600"
                          className={inputClass('meltingTime')}
                        />
                        {renderFieldError('meltingTime')}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          除气时间(min)<span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="number"
                          value={String(formValues.degassingTime || '')}
                          onChange={(e) => handleFormChange('degassingTime', e.target.value)}
                          placeholder="1-120"
                          step="1"
                          min="1"
                          max="120"
                          className={inputClass('degassingTime')}
                        />
                        {renderFieldError('degassingTime')}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          开始时间<span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={String(formValues.startTime || '')}
                          onChange={(e) => handleFormChange('startTime', e.target.value)}
                          className={inputClass('startTime')}
                        />
                        {renderFieldError('startTime')}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                      <h4 className="text-sm font-semibold text-slate-700">配料明细</h4>
                      <button
                        type="button"
                        onClick={addMaterialItem}
                        className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                      >
                        + 添加配料
                      </button>
                    </div>
                    {renderFieldError('materials')}

                    {materials.length === 0 ? (
                      <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-sm">
                        点击上方「添加配料」按钮添加配料明细
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {materials.map((item, index) => (
                          <div key={index} className="p-4 bg-slate-50 rounded-xl relative">
                            <button
                              type="button"
                              onClick={() => removeMaterialItem(index)}
                              className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors p-1"
                            >
                              <X size={16} />
                            </button>
                            <p className="text-xs font-medium text-slate-500 mb-3">配料 #{index + 1}</p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  配料名称<span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => updateMaterialItem(index, 'name', e.target.value)}
                                  placeholder="如：纯钛、铝钒合金"
                                  className={inputClass(`material_name_${index}`)}
                                />
                                {renderFieldError(`material_name_${index}`)}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  标准范围
                                </label>
                                <input
                                  type="text"
                                  value={item.standardRange}
                                  onChange={(e) => updateMaterialItem(index, 'standardRange', e.target.value)}
                                  placeholder="如：90-92%"
                                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  实际加入量(kg)<span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <input
                                  type="number"
                                  value={item.actualWeight}
                                  onChange={(e) => updateMaterialItem(index, 'actualWeight', e.target.value)}
                                  placeholder="0.00"
                                  step="0.01"
                                  min="0"
                                  className={inputClass(`material_weight_${index}`)}
                                />
                                {renderFieldError(`material_weight_${index}`)}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  占比(%)<span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <input
                                  type="number"
                                  value={item.percentage}
                                  onChange={(e) => updateMaterialItem(index, 'percentage', e.target.value)}
                                  placeholder="0.00"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  className={inputClass(`material_percentage_${index}`)}
                                />
                                {renderFieldError(`material_percentage_${index}`)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                      <h4 className="text-sm font-semibold text-slate-700">成分检测结果（选填）</h4>
                      <button
                        type="button"
                        onClick={addCompositionItem}
                        className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                      >
                        + 添加检测项
                      </button>
                    </div>

                    {renderFieldError('compositions')}

                    {compositions.length === 0 ? (
                      <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-sm">
                        点击上方「添加检测项」按钮添加成分检测结果（可选）
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {compositions.map((item, index) => (
                          <div key={index} className="p-4 bg-slate-50 rounded-xl relative">
                            <button
                              type="button"
                              onClick={() => removeCompositionItem(index)}
                              className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors p-1"
                            >
                              <X size={16} />
                            </button>
                            <p className="text-xs font-medium text-slate-500 mb-3">检测项 #{index + 1}</p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  元素符号<span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={item.element}
                                  onChange={(e) => updateCompositionItem(index, 'element', e.target.value)}
                                  placeholder="如：Ti、Al、V"
                                  className={inputClass(`composition_element_${index}`)}
                                />
                                {renderFieldError(`composition_element_${index}`)}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  标准值(%)<span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={item.standard}
                                  onChange={(e) => updateCompositionItem(index, 'standard', e.target.value)}
                                  placeholder="如：6.0-6.5"
                                  className={inputClass(`composition_standard_${index}`)}
                                />
                                {renderFieldError(`composition_standard_${index}`)}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  检测值(%)<span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <input
                                  type="number"
                                  value={item.content}
                                  onChange={(e) => updateCompositionItem(index, 'content', e.target.value)}
                                  placeholder="0.000"
                                  step="0.001"
                                  className={inputClass(`composition_content_${index}`)}
                                />
                                {renderFieldError(`composition_content_${index}`)}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  判定
                                </label>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateCompositionItem(index, 'isQualified', true)}
                                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                      item.isQualified
                                        ? 'bg-green-100 text-green-700 border-2 border-green-400'
                                        : 'bg-slate-100 text-slate-500 border-2 border-transparent'
                                    }`}
                                  >
                                    <Check size={14} />
                                    合格
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateCompositionItem(index, 'isQualified', false)}
                                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                      !item.isQualified
                                        ? 'bg-red-100 text-red-700 border-2 border-red-400'
                                        : 'bg-slate-100 text-slate-500 border-2 border-transparent'
                                    }`}
                                  >
                                    <XCircle size={14} />
                                    不合格
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">
                      备注
                    </h4>
                    <textarea
                      value={String(formValues.remark || '')}
                      onChange={(e) => handleFormChange('remark', e.target.value)}
                      placeholder="选填"
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  {Object.keys(errors).length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-center gap-2 text-red-700 mb-2">
                        <AlertCircle size={16} />
                        <p className="text-sm font-medium">请检查以下问题：</p>
                      </div>
                      <ul className="text-xs text-red-600 space-y-1 ml-6 list-disc">
                        {Object.entries(errors).map(([field, message]) => (
                          <li key={field}>{message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                  >
                    保存记录
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showDetail && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-slate-800">熔炼详情</h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-500">工单编号</p>
                  <Link to={`/work-order/${selectedRecord.workOrderId}`} className="text-base font-medium text-blue-600 hover:text-blue-800 hover:underline">
                    {getWorkOrderById(selectedRecord.workOrderId)?.orderNo || '-'}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-slate-500">中频炉</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.furnaceNo}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">合金牌号</p>
                  <p className="text-base font-medium text-blue-600">{selectedRecord.alloyGrade}</p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl">
                <h4 className="text-sm font-semibold text-amber-800 mb-4">配料明细</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-amber-200">
                        <th className="text-left py-2 px-3 text-xs font-medium text-amber-700">序号</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-amber-700">名称</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-amber-700">标准范围</th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-amber-700">加入量(Kg)</th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-amber-700">占比(%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecord.materials.map((mat, index) => (
                        <tr key={index} className="border-b border-amber-100 last:border-0">
                          <td className="py-2 px-3 text-amber-900">#{index + 1}</td>
                          <td className="py-2 px-3 text-amber-900 font-medium">{mat.name}</td>
                          <td className="py-2 px-3 text-amber-700">{mat.standard || '-'}</td>
                          <td className="py-2 px-3 text-amber-900 text-right font-medium">{mat.weight} kg</td>
                          <td className="py-2 px-3 text-amber-900 text-right">
                            {mat.percentage > 0 ? `${mat.percentage}%` : '-'}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-amber-300 bg-amber-100/50">
                        <td colSpan={3} className="py-3 px-3 text-amber-900 font-semibold">合计</td>
                        <td className="py-3 px-3 text-amber-900 text-right font-bold text-base">
                          {selectedRecord.totalWeight} kg
                        </td>
                        <td className="py-3 px-3 text-amber-900 text-right">
                          {selectedRecord.materials.reduce((s, m) => s + (m.percentage || 0), 0)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-xl font-bold text-orange-600">{selectedRecord.meltingTemperature}°C</p>
                  <p className="text-xs text-orange-600 mt-1">熔炼温度</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xl font-bold text-blue-600">{selectedRecord.meltingTime} min</p>
                  <p className="text-xs text-blue-600 mt-1">熔炼时间</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xl font-bold text-emerald-600">{selectedRecord.degassingTime} min</p>
                  <p className="text-xs text-emerald-600 mt-1">除气时间</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-xl font-bold text-purple-600">{selectedRecord.operator}</p>
                  <p className="text-xs text-purple-600 mt-1">操作工</p>
                </div>
              </div>

              {selectedRecord.compositionTest && selectedRecord.compositionTest.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-slate-700">成分检测结果</h4>
                    {(() => {
                      const allPass = selectedRecord.compositionTest!.every(c => c.isQualified);
                      return (
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          allPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {allPass ? <Check size={12} /> : <XCircle size={12} />}
                          {allPass ? '全部合格' : '存在不合格项'}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">元素</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">标准范围</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-slate-500">检测值(%)</th>
                          <th className="text-center py-2 px-3 text-xs font-medium text-slate-500">判定结果</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecord.compositionTest.map((item, index) => (
                          <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-100/50 transition-colors">
                            <td className="py-3 px-3 text-slate-800 font-semibold">{item.element}</td>
                            <td className="py-3 px-3 text-slate-600">{item.standard || '-'}</td>
                            <td className="py-3 px-3 text-slate-800 text-right font-medium">
                              {item.content}%
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                item.isQualified 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {item.isQualified ? <Check size={12} /> : <XCircle size={12} />}
                                {item.isQualified ? '合格' : '不合格'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-slate-500">开始时间</p>
                <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.startTime)}</p>
              </div>

              {selectedRecord.id.startsWith('test_') && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">备注</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                    这是系统测试记录
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setShowDetail(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
