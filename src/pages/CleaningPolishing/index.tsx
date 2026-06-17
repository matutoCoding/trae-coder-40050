import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import PageHeader, { Toolbar } from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormModal, { type ValidationRule, type FormSection } from '@/components/FormModal';
import { formatDateTime, generateId } from '@/utils/format';
import type { Column } from '@/components/DataTable';
import type { CleaningRecord, CleaningType } from '@/types';
import { Eye, Sparkles, Scissors, CircleDot, CheckCircle2, Plus, Package, CheckCircle, XCircle, Users } from 'lucide-react';

type TabType = 'cutting' | 'grinding' | 'polishing';

export default function CleaningPolishing() {
  const { 
    cleaningRecords, 
    workOrders,
    getWorkOrderById,
    addCleaningRecord
  } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('cutting');
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<CleaningRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredRecords = cleaningRecords
    .filter((r) => r.processType === activeTab)
    .filter((r) => {
      const order = getWorkOrderById(r.workOrderId);
      return order?.orderNo.toLowerCase().includes(searchText.toLowerCase());
    });

  const processLabels: Record<TabType, string> = {
    cutting: '切割飞边',
    grinding: '打磨处理',
    polishing: '打磨抛光',
  };

  const processDefaults: Record<TabType, { equipment: string; equipmentNo: string }> = {
    cutting: { equipment: '等离子切割机', equipmentNo: 'PLS-001' },
    grinding: { equipment: '砂带打磨机', equipmentNo: 'GRD-001' },
    polishing: { equipment: '抛光机', equipmentNo: 'POL-001' },
  };

  const workOrderOptions = workOrders
    .filter(o => o.status === 'cleaning' || o.status === 'pouring' || o.status === 'pending')
    .map(o => ({ value: o.id, label: `${o.orderNo} - ${o.productName}` }));

  const getFormSections = (tabType: TabType): FormSection[] => [
    {
      title: '基本信息',
      fields: [
        {
          name: 'workOrderId',
          label: '关联工单',
          type: 'select',
          required: true,
          options: workOrderOptions,
          placeholder: '请选择工单',
        },
        {
          name: 'processType',
          label: '工序类型',
          type: 'select',
          required: true,
          options: [
            { value: 'cutting', label: '切割飞边' },
            { value: 'grinding', label: '打磨处理' },
            { value: 'polishing', label: '打磨抛光' },
          ],
          defaultValue: tabType,
        },
        {
          name: 'equipment',
          label: '设备名称',
          type: 'text',
          required: true,
          defaultValue: processDefaults[tabType].equipment,
          placeholder: '请输入设备名称',
        },
        {
          name: 'equipmentNo',
          label: '设备编号',
          type: 'text',
          required: true,
          defaultValue: processDefaults[tabType].equipmentNo,
          placeholder: '请输入设备编号',
        },
        {
          name: 'operator',
          label: '操作人员',
          type: 'text',
          required: true,
          placeholder: '请输入操作人员姓名',
        },
      ],
    },
    {
      title: '时间记录',
      fields: [
        {
          name: 'startTime',
          label: '开始时间',
          type: 'datetime-local',
          required: true,
          defaultValue: new Date().toISOString().slice(0, 16),
        },
        {
          name: 'endTime',
          label: '结束时间',
          type: 'datetime-local',
          required: true,
          defaultValue: new Date().toISOString().slice(0, 16),
        },
      ],
    },
    {
      title: '数量与质量',
      fields: [
        {
          name: 'quantity',
          label: '处理数量(件)',
          type: 'number',
          required: true,
          placeholder: '请输入处理总数量',
          step: '1',
          min: '1',
        },
        {
          name: 'qualifiedCount',
          label: '合格数量(件)',
          type: 'number',
          required: true,
          placeholder: '不能大于处理数量',
          step: '1',
          min: '0',
        },
        {
          name: 'qualityResult',
          label: '质量结果',
          type: 'select',
          required: true,
          options: [
            { value: '优秀', label: '优秀' },
            { value: '合格', label: '合格' },
            { value: '不合格', label: '不合格' },
          ],
          defaultValue: '合格',
        },
        {
          name: 'unqualifiedReason',
          label: '不合格原因',
          type: 'text',
          placeholder: '仅不合格时填写',
        },
        {
          name: 'remark',
          label: '备注',
          type: 'textarea',
          placeholder: '选填',
          className: 'md:col-span-2',
        },
      ],
    },
  ];

  const validationRules: ValidationRule[] = [
    { field: 'workOrderId', label: '关联工单', required: true },
    { field: 'processType', label: '工序类型', required: true },
    { field: 'equipment', label: '设备名称', required: true },
    { field: 'equipmentNo', label: '设备编号', required: true },
    { field: 'operator', label: '操作人员', required: true },
    { field: 'startTime', label: '开始时间', required: true },
    { 
      field: 'endTime', 
      label: '结束时间', 
      required: true,
      custom: (value, allValues) => {
        if (allValues.startTime && value && String(value) < String(allValues.startTime)) {
          return '结束时间不能早于开始时间';
        }
        return null;
      }
    },
    { field: 'quantity', label: '处理数量', required: true, type: 'number', min: 1 },
    { 
      field: 'qualifiedCount', 
      label: '合格数量', 
      required: true, 
      type: 'number', 
      min: 0,
      custom: (value, allValues) => {
        const q = Number(value);
        const t = Number(allValues.quantity);
        if (q > t) return '合格数量不能大于处理数量';
        return null;
      }
    },
    { 
      field: 'qualityResult', 
      label: '质量结果', 
      required: true,
      custom: (value, allValues) => {
        const q = Number(allValues.qualifiedCount);
        const t = Number(allValues.quantity);
        const unqualifiedRate = t > 0 ? ((t - q) / t) : 0;
        if (value === '不合格' && unqualifiedRate <= 0.05 && q === t) {
          return '全部合格时，质量结果不能为"不合格"';
        }
        if (value === '优秀' && unqualifiedRate > 0.02) {
          return '不合格率超过2%时，质量结果不能为"优秀"';
        }
        return null;
      }
    },
    {
      field: 'unqualifiedReason',
      label: '不合格原因',
      custom: (value, allValues) => {
        const q = Number(allValues.qualifiedCount);
        const t = Number(allValues.quantity);
        if (t - q > 0 && (!value || String(value).trim() === '')) {
          return '存在不合格品时，必须填写不合格原因';
        }
        return null;
      }
    },
  ];

  const handleSubmit = (values: Record<string, unknown>) => {
    const formatDT = (v: unknown) => {
      const s = String(v);
      return s.includes('T') ? s.replace('T', ' ') + ':00' : s;
    };

    const newRecord: CleaningRecord = {
      id: generateId('cl'),
      workOrderId: String(values.workOrderId),
      processType: values.processType as CleaningType,
      equipment: String(values.equipment),
      equipmentNo: String(values.equipmentNo),
      operator: String(values.operator),
      startTime: formatDT(values.startTime),
      endTime: formatDT(values.endTime),
      quantity: Number(values.quantity),
      qualifiedCount: Number(values.qualifiedCount),
      qualityResult: String(values.qualityResult),
      unqualifiedReason: values.unqualifiedReason ? String(values.unqualifiedReason) : undefined,
      remark: values.remark ? String(values.remark) : undefined,
    };
    addCleaningRecord(newRecord);
    setShowAddModal(false);
  };

  const columns: Column<CleaningRecord>[] = [
    {
      key: 'workOrderId',
      title: '工单编号',
      render: (record) => {
        const order = getWorkOrderById(record.workOrderId);
        return (
          <span className="text-sm font-medium text-blue-600">
            {order?.orderNo || '-'}
          </span>
        );
      },
    },
    {
      key: 'equipmentNo',
      title: '设备编号',
      render: (record) => <span className="text-sm text-slate-600">{record.equipmentNo}</span>,
    },
    {
      key: 'equipment',
      title: '设备名称',
      render: (record) => <span className="text-sm">{record.equipment}</span>,
    },
    {
      key: 'quantity',
      title: '处理/合格',
      render: (record) => (
        <span className="text-sm">
          <span>{record.quantity}</span>
          <span className="text-emerald-600 font-medium"> / {record.qualifiedCount}</span>
          {record.quantity - record.qualifiedCount > 0 && (
            <span className="text-red-500 ml-1">({record.quantity - record.qualifiedCount}废)</span>
          )}
        </span>
      ),
    },
    {
      key: 'qualityResult',
      title: '质量结果',
      render: (record) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          record.qualityResult === '优秀' 
            ? 'bg-emerald-100 text-emerald-700'
            : record.qualityResult === '合格'
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {record.qualityResult}
        </span>
      ),
    },
    {
      key: 'operator',
      title: '操作工',
    },
    {
      key: 'startTime',
      title: '开始时间',
      render: (record) => (
        <span className="text-sm text-slate-500">{formatDateTime(record.startTime)}</span>
      ),
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

  const tabs = [
    { key: 'cutting' as TabType, label: '切割飞边', icon: <Scissors size={18} />, addText: '新增切割记录', color: 'amber' },
    { key: 'grinding' as TabType, label: '打磨处理', icon: <CircleDot size={18} />, addText: '新增打磨记录', color: 'blue' },
    { key: 'polishing' as TabType, label: '打磨抛光', icon: <Sparkles size={18} />, addText: '新增抛光记录', color: 'emerald' },
  ];

  const cuttingCount = cleaningRecords.filter(r => r.processType === 'cutting').length;
  const grindingCount = cleaningRecords.filter(r => r.processType === 'grinding').length;
  const polishingCount = cleaningRecords.filter(r => r.processType === 'polishing').length;

  const stats = useMemo(() => {
    const currentRecords = cleaningRecords.filter(r => r.processType === activeTab);
    const totalQuantity = currentRecords.reduce((sum, r) => sum + r.quantity, 0);
    const totalQualified = currentRecords.reduce((sum, r) => sum + r.qualifiedCount, 0);
    const unqualifiedCount = totalQuantity - totalQualified;
    const passRate = totalQuantity > 0 ? ((totalQualified / totalQuantity) * 100).toFixed(1) : '0';
    return [
      { label: `${processLabels[activeTab]}批次`, value: String(currentRecords.length), unit: '批', icon: <Package size={20} /> },
      { label: '处理总数', value: totalQuantity.toLocaleString(), unit: '件', icon: <Package size={20} /> },
      { label: '合格数量', value: totalQualified.toLocaleString(), unit: '件', icon: <CheckCircle size={20} /> },
      { label: '不合格数', value: String(unqualifiedCount), unit: '件', icon: <XCircle size={20} /> },
      { label: '合格率', value: passRate, unit: '%', icon: <Users size={20} /> },
    ];
  }, [cleaningRecords, activeTab]);

  const statColorMap: Record<string, { bg: string; text: string }> = {
    cutting: { bg: 'bg-amber-50', text: 'text-amber-600' },
    grinding: { bg: 'bg-blue-50', text: 'text-blue-600' },
    polishing: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  };

  const statBgTextColors = [
    { bg: statColorMap[activeTab].bg, text: statColorMap[activeTab].text },
    { bg: 'bg-blue-50', text: 'text-blue-600' },
    { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { bg: 'bg-red-50', text: 'text-red-600' },
    { bg: 'bg-amber-50', text: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="清理打磨"
        description="管理铸件后处理工序，包括切割飞边、打磨和抛光"
        addButtonText={tabs.find(t => t.key === activeTab)?.addText || '新增记录'}
        onAdd={() => setShowAddModal(true)}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">待清理工单</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {workOrders.filter(o => o.status === 'cleaning' || o.status === 'pouring').length} 单
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Scissors size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">切割飞边</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{cuttingCount} 批</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <Scissors size={24} className="text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">打磨处理</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{grindingCount} 批</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <CircleDot size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">打磨抛光</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{polishingCount} 批</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Sparkles size={24} className="text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {tabs.map((tab) => (
            <div key={tab.key} className="flex items-center">
              <button
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-800'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
              {activeTab === tab.key && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className={`flex items-center gap-1 mx-2 my-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    tab.color === 'amber' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : tab.color === 'blue' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <Plus size={14} />
                  {tab.addText}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {stats.map((stat, idx) => (
              <div key={stat.label} className={`p-4 rounded-xl ${
                idx === 0 ? statColorMap[activeTab].bg : statBgTextColors[idx].bg
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={statBgTextColors[idx].text}>{stat.icon}</div>
                  <p className="text-sm text-slate-600">{stat.label}</p>
                </div>
                <p className={`text-2xl font-bold ${statBgTextColors[idx].text}`}>
                  {stat.value} <span className="text-sm font-normal text-slate-500">{stat.unit}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-xl ${
              activeTab === 'cutting' ? 'bg-amber-50' :
              activeTab === 'grinding' ? 'bg-blue-50' : 'bg-emerald-50'
            }`}>
              <p className="text-sm text-slate-600">加工设备</p>
              <p className={`text-lg font-bold mt-1 ${
                activeTab === 'cutting' ? 'text-amber-700' :
                activeTab === 'grinding' ? 'text-blue-700' : 'text-emerald-700'
              }`}>
                {activeTab === 'cutting' ? '等离子切割机' :
                 activeTab === 'grinding' ? '砂带打磨机' : '抛光机'}
              </p>
            </div>
            <div className={`p-4 rounded-xl ${
              activeTab === 'cutting' ? 'bg-amber-50' :
              activeTab === 'grinding' ? 'bg-blue-50' : 'bg-emerald-50'
            }`}>
              <p className="text-sm text-slate-600">工艺标准</p>
              <p className={`text-lg font-bold mt-1 ${
                activeTab === 'cutting' ? 'text-amber-700' :
                activeTab === 'grinding' ? 'text-blue-700' : 'text-emerald-700'
              }`}>
                {activeTab === 'cutting' ? '浇口平整' :
                 activeTab === 'grinding' ? 'Ra≤6.3' : 'Ra≤1.6'}
              </p>
            </div>
            <div className={`p-4 rounded-xl ${
              activeTab === 'cutting' ? 'bg-amber-50' :
              activeTab === 'grinding' ? 'bg-blue-50' : 'bg-emerald-50'
            }`}>
              <p className="text-sm text-slate-600">今日完成</p>
              <p className={`text-lg font-bold mt-1 ${
                activeTab === 'cutting' ? 'text-amber-700' :
                activeTab === 'grinding' ? 'text-blue-700' : 'text-emerald-700'
              }`}>
                {filteredRecords.length} 批
              </p>
            </div>
          </div>

          <Toolbar
            searchPlaceholder="搜索工单编号..."
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
      </div>

      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">后处理工艺流程</h3>
            <p className="text-sm text-slate-300">铸件从浇注完成到成品入库的完整后处理流程</p>
          </div>
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
        <div className="flex items-center gap-2 mt-6">
          {['切割飞边', '粗磨', '精磨', '抛光', '检验', '入库'].map((step, index) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < 4 ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                }`}>
                  {index + 1}
                </div>
                <p className="text-xs mt-2 text-center w-16">{step}</p>
              </div>
              {index < 5 && (
                <div className={`flex-1 h-0.5 mx-1 ${
                  index < 3 ? 'bg-emerald-500' : 'bg-slate-700'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <FormModal
        isOpen={showAddModal}
        title={`新增${processLabels[activeTab]}记录`}
        sections={getFormSections(activeTab)}
        validationRules={validationRules}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSubmit}
        submitText="保存记录"
        size="lg"
      />

      {showDetail && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {processLabels[selectedRecord.processType]}详情
              </h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">工单编号</p>
                  <p className="text-base font-medium text-slate-800">
                    {getWorkOrderById(selectedRecord.workOrderId)?.orderNo || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">工序类型</p>
                  <p className="text-base font-medium text-slate-800">
                    {processLabels[selectedRecord.processType]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">加工设备</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.equipment}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">设备编号</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.equipmentNo}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">操作工</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.operator}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">质量结果</p>
                  <p className={`text-base font-medium ${
                    selectedRecord.qualityResult === '优秀' 
                      ? 'text-emerald-600'
                      : selectedRecord.qualityResult === '合格'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {selectedRecord.qualityResult}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">开始时间</p>
                    <p className="text-sm font-medium text-slate-700">
                      {formatDateTime(selectedRecord.startTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">结束时间</p>
                    <p className="text-sm font-medium text-slate-700">
                      {formatDateTime(selectedRecord.endTime)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl">
                <h4 className="text-sm font-semibold text-emerald-700 mb-3">生产统计</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{selectedRecord.quantity}</p>
                    <p className="text-xs text-slate-500 mt-1">处理总数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{selectedRecord.qualifiedCount}</p>
                    <p className="text-xs text-slate-500 mt-1">合格数量</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {selectedRecord.quantity - selectedRecord.qualifiedCount}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">不合格数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">
                      {selectedRecord.quantity > 0
                        ? ((selectedRecord.qualifiedCount / selectedRecord.quantity) * 100).toFixed(1)
                        : '0'}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">合格率</p>
                  </div>
                </div>
              </div>

              {selectedRecord.unqualifiedReason && (
                <div className="p-4 bg-red-50 rounded-xl">
                  <p className="text-sm font-semibold text-red-700 mb-1">不合格原因</p>
                  <p className="text-sm text-red-600">{selectedRecord.unqualifiedReason}</p>
                </div>
              )}

              {selectedRecord.remark && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">备注</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                    {selectedRecord.remark}
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
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
