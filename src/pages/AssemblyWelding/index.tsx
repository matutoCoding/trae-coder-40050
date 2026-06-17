import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import PageHeader, { Toolbar } from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormModal, { type ValidationRule, type FormSection } from '@/components/FormModal';
import { formatDateTime, generateId } from '@/utils/format';
import type { Column } from '@/components/DataTable';
import { Link } from 'react-router-dom';
import type { AssemblyRecord } from '@/types';
import { Plus, Eye, CheckCircle, XCircle, Wrench, Layers, Thermometer, UserCheck } from 'lucide-react';

export default function AssemblyWelding() {
  const { 
    assemblyRecords, 
    workOrders,
    getWorkOrderById,
    addAssemblyRecord 
  } = useStore();
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AssemblyRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredRecords = assemblyRecords.filter((r) =>
    r.assemblyNo.toLowerCase().includes(searchText.toLowerCase()) ||
    getWorkOrderById(r.workOrderId)?.orderNo.toLowerCase().includes(searchText.toLowerCase())
  );

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayRecords = assemblyRecords.filter(r => 
      r.weldingTime.startsWith(today) || r.weldingTime.includes(today)
    );
    const totalWaxCount = assemblyRecords.reduce((sum, r) => sum + r.waxCount, 0);
    const passCount = assemblyRecords.filter(r => r.inspectionResult).length;
    const failCount = assemblyRecords.length - passCount;
    const passRate = assemblyRecords.length > 0 
      ? ((passCount / assemblyRecords.length) * 100).toFixed(1)
      : '0';
    const avgWaxCount = assemblyRecords.length > 0 
      ? (totalWaxCount / assemblyRecords.length).toFixed(1)
      : '0';
    return [
      { label: '今日焊接模组', value: String(todayRecords.length), unit: '组', icon: <Wrench size={20} />, color: 'blue' },
      { label: '焊接蜡件总数', value: totalWaxCount.toLocaleString(), unit: '件', icon: <Layers size={20} />, color: 'emerald' },
      { label: '平均每组蜡件', value: avgWaxCount, unit: '件', icon: <Plus size={20} />, color: 'purple' },
      { label: '综合合格率', value: passRate, unit: '%', icon: <UserCheck size={20} />, color: 'amber' },
    ];
  }, [assemblyRecords]);

  const workOrderOptions = workOrders
    .filter(o => o.status === 'assembly' || o.status === 'wax_inspection' || o.status === 'wax_molding' || o.status === 'pending')
    .map(o => ({ value: o.id, label: `${o.orderNo} - ${o.productName}` }));

  const formSections: FormSection[] = [
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
          name: 'assemblyNo',
          label: '模组编号',
          type: 'text',
          required: true,
          placeholder: '如：M-AW-20240115-001',
        },
      ],
    },
    {
      title: '焊接信息',
      fields: [
        {
          name: 'waxCount',
          label: '蜡件数量(件)',
          type: 'number',
          required: true,
          placeholder: '8-12件/组',
          step: '1',
          min: '1',
          max: '50',
          defaultValue: 10,
        },
        {
          name: 'weldingMethod',
          label: '焊接方式',
          type: 'select',
          required: true,
          options: [
            { value: '焊蜡枪', label: '焊蜡枪' },
            { value: '热风枪', label: '热风枪' },
            { value: '电烙铁', label: '电烙铁' },
            { value: '超声波焊接', label: '超声波焊接' },
          ],
          defaultValue: '焊蜡枪',
        },
        {
          name: 'weldingTemperature',
          label: '焊接温度(°C)',
          type: 'number',
          required: true,
          placeholder: '80-90',
          step: '1',
          min: '60',
          max: '120',
          defaultValue: 85,
        },
        {
          name: 'welder',
          label: '焊工',
          type: 'text',
          required: true,
          placeholder: '请输入焊工姓名',
        },
      ],
    },
    {
      title: '检验信息',
      fields: [
        {
          name: 'weldingTime',
          label: '焊接时间',
          type: 'datetime-local',
          required: true,
          defaultValue: new Date().toISOString().slice(0, 16),
        },
        {
          name: 'inspectionResult',
          label: '检验结果',
          type: 'select',
          required: true,
          options: [
            { value: 'true', label: '合格' },
            { value: 'false', label: '不合格' },
          ],
          defaultValue: 'true',
        },
        {
          name: 'inspector',
          label: '检验员',
          type: 'text',
          required: true,
          placeholder: '请输入检验员姓名',
        },
        {
          name: 'remark',
          label: '备注',
          type: 'textarea',
          placeholder: '选填，焊接特殊情况说明',
          className: 'md:col-span-2',
        },
      ],
    },
  ];

  const validationRules: ValidationRule[] = [
    { field: 'workOrderId', label: '关联工单', required: true },
    { field: 'assemblyNo', label: '模组编号', required: true },
    { field: 'waxCount', label: '蜡件数量', required: true, type: 'number', min: 1, max: 50 },
    { field: 'weldingMethod', label: '焊接方式', required: true },
    { field: 'weldingTemperature', label: '焊接温度', required: true, type: 'number', min: 60, max: 120 },
    { field: 'welder', label: '焊工', required: true },
    { field: 'weldingTime', label: '焊接时间', required: true },
    { field: 'inspectionResult', label: '检验结果', required: true },
    { field: 'inspector', label: '检验员', required: true },
  ];

  const handleSubmit = (values: Record<string, unknown>) => {
    const formatDT = (v: unknown) => {
      const s = String(v);
      return s.includes('T') ? s.replace('T', ' ') + ':00' : s;
    };

    const newRecord: AssemblyRecord = {
      id: generateId('aw'),
      workOrderId: String(values.workOrderId),
      assemblyNo: String(values.assemblyNo),
      waxCount: Number(values.waxCount),
      weldingMethod: String(values.weldingMethod),
      weldingTemperature: Number(values.weldingTemperature),
      welder: String(values.welder),
      weldingTime: formatDT(values.weldingTime),
      inspectionResult: values.inspectionResult === 'true' || values.inspectionResult === true,
      inspector: String(values.inspector),
      remark: values.remark ? String(values.remark) : undefined,
    };
    addAssemblyRecord(newRecord);
    setShowAddModal(false);
  };

  const columns: Column<AssemblyRecord>[] = [
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
      key: 'assemblyNo',
      title: '模组编号',
      render: (record) => <span className="text-sm font-medium">{record.assemblyNo}</span>,
    },
    {
      key: 'waxCount',
      title: '蜡件数量',
      render: (record) => (
        <span className="text-sm">{record.waxCount} 件</span>
      ),
    },
    {
      key: 'weldingMethod',
      title: '焊接方式',
    },
    {
      key: 'weldingTemperature',
      title: '焊接温度(°C)',
      render: (record) => (
        <span className={`text-sm ${
          record.weldingTemperature < 80 || record.weldingTemperature > 90 
            ? 'text-amber-600 font-medium' : ''
        }`}>{record.weldingTemperature}°C</span>
      ),
    },
    {
      key: 'welder',
      title: '焊工',
    },
    {
      key: 'inspectionResult',
      title: '检验结果',
      render: (record) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          record.inspectionResult ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {record.inspectionResult ? (
            <><CheckCircle size={12} /> 合格</>
          ) : (
            <><XCircle size={12} /> 不合格</>
          )}
        </span>
      ),
    },
    {
      key: 'weldingTime',
      title: '焊接时间',
      render: (record) => (
        <span className="text-sm text-slate-500">{formatDateTime(record.weldingTime)}</span>
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="模组焊接"
        description="管理模组组树焊接记录，监控焊接质量"
        addButtonText="新增焊接记录"
        onAdd={() => setShowAddModal(true)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {stat.value} <span className="text-sm font-normal text-slate-500">{stat.unit}</span>
                </p>
              </div>
              <div className={`p-3 bg-${stat.color}-50 rounded-xl`}>
                <div className={`text-${stat.color}-600`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">焊接工艺标准</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-orange-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer size={18} className="text-orange-600" />
              <span className="text-sm font-medium text-orange-800">焊接温度</span>
            </div>
            <p className="text-2xl font-bold text-orange-700">80-90°C</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Wrench size={18} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">焊接方式</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">焊蜡枪</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Layers size={18} className="text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">每组蜡件</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">8-12件</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={18} className="text-purple-600" />
              <span className="text-sm font-medium text-purple-800">合格率目标</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">≥95%</p>
          </div>
        </div>
      </div>

      <div>
        <Toolbar
          searchPlaceholder="搜索工单号或模组号..."
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

      <FormModal
        isOpen={showAddModal}
        title="新增模组焊接记录"
        sections={formSections}
        validationRules={validationRules}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSubmit}
        submitText="保存焊接记录"
        size="lg"
      />

      {showDetail && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-slate-800">模组焊接详情</h3>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                  selectedRecord.inspectionResult ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {selectedRecord.inspectionResult ? (
                    <><CheckCircle size={12} /> 检验合格</>
                  ) : (
                    <><XCircle size={12} /> 检验不合格</>
                  )}
                </span>
              </div>
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
                  <Link to={`/work-order/${selectedRecord.workOrderId}`} className="text-base font-medium text-blue-600 hover:text-blue-800 hover:underline">
                    {getWorkOrderById(selectedRecord.workOrderId)?.orderNo || '-'}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-slate-500">产品名称</p>
                  <p className="text-base font-medium text-slate-800">
                    {getWorkOrderById(selectedRecord.workOrderId)?.productName || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">模组编号</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.assemblyNo}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">蜡件数量</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.waxCount} 件</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="text-sm font-semibold text-slate-700 mb-4">焊接工艺参数</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">焊接方式</p>
                    <p className="text-lg font-bold text-blue-600">{selectedRecord.weldingMethod}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">焊接温度</p>
                    <p className={`text-lg font-bold ${
                      selectedRecord.weldingTemperature < 80 || selectedRecord.weldingTemperature > 90 
                        ? 'text-amber-600' : 'text-orange-600'
                    }`}>
                      {selectedRecord.weldingTemperature}°C
                      {selectedRecord.weldingTemperature < 80 || selectedRecord.weldingTemperature > 90 ? (
                        <span className="text-xs font-normal ml-2">(偏离标准)</span>
                      ) : null}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">焊工</p>
                    <p className="text-lg font-bold text-slate-700">{selectedRecord.welder}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">焊接时间</p>
                    <p className="text-lg font-bold text-slate-700">{formatDateTime(selectedRecord.weldingTime)}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">检验信息</p>
                    <p className="text-sm text-slate-700 mt-1">检验员：{selectedRecord.inspector}</p>
                  </div>
                  {selectedRecord.inspectionResult ? (
                    <span className="inline-flex items-center gap-2 px-5 py-3 bg-green-100 text-green-700 rounded-lg font-semibold">
                      <CheckCircle size={20} />
                      检验合格
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-5 py-3 bg-red-100 text-red-700 rounded-lg font-semibold">
                      <XCircle size={20} />
                      检验不合格
                    </span>
                  )}
                </div>
              </div>

              {selectedRecord.remark && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">备注</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">{selectedRecord.remark}</p>
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
