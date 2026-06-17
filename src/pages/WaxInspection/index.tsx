import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import PageHeader, { Toolbar } from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormModal, { type ValidationRule, type FormSection, type DynamicSection } from '@/components/FormModal';
import { formatDateTime, generateId } from '@/utils/format';
import type { Column } from '@/components/DataTable';
import type { WaxInspectionRecord, DimensionItem } from '@/types';
import { Plus, Eye, CheckCircle, XCircle, Ruler, Activity, AlertTriangle } from 'lucide-react';

export default function WaxInspection() {
  const { 
    waxInspectionRecords, 
    waxMoldingRecords,
    workOrders,
    getWorkOrderById,
    addWaxInspectionRecord 
  } = useStore();
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<WaxInspectionRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredRecords = waxInspectionRecords.filter((r) =>
    r.sampleNo.toLowerCase().includes(searchText.toLowerCase()) ||
    getWorkOrderById(r.workOrderId)?.orderNo.toLowerCase().includes(searchText.toLowerCase())
  );

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayRecords = waxInspectionRecords.filter(r => 
      r.inspectTime.startsWith(today) || r.inspectTime.includes(today)
    );
    const qualifiedCount = waxInspectionRecords.filter(r => r.isQualified).length;
    const unqualifiedCount = waxInspectionRecords.length - qualifiedCount;
    const passRate = waxInspectionRecords.length > 0 
      ? ((qualifiedCount / waxInspectionRecords.length) * 100).toFixed(1)
      : '0';
    const totalDimensions = waxInspectionRecords.reduce((sum, r) => sum + r.dimensions.length, 0);
    const qualifiedDimensions = waxInspectionRecords.reduce((sum, r) => 
      sum + r.dimensions.filter(d => d.isQualified).length, 0
    );
    const dimPassRate = totalDimensions > 0 
      ? ((qualifiedDimensions / totalDimensions) * 100).toFixed(1)
      : '0';
    return [
      { label: '今日检验批次', value: String(todayRecords.length), unit: '批', icon: <Ruler size={20} />, color: 'blue' },
      { label: '合格批次', value: String(qualifiedCount), unit: '批', icon: <CheckCircle size={20} />, color: 'emerald' },
      { label: '尺寸项合格率', value: dimPassRate, unit: '%', icon: <Activity size={20} />, color: 'amber' },
      { label: '综合合格率', value: passRate, unit: '%', icon: <AlertTriangle size={20} />, color: 'purple' },
    ];
  }, [waxInspectionRecords]);

  const workOrderOptions = workOrders
    .filter(o => o.status === 'wax_inspection' || o.status === 'wax_molding' || o.status === 'pending')
    .map(o => ({ value: o.id, label: `${o.orderNo} - ${o.productName}` }));

  const waxMoldingOptions = waxMoldingRecords.map(wm => {
    const order = getWorkOrderById(wm.workOrderId);
    return { 
      value: wm.id, 
      label: `${wm.moldNo}${order ? ` (${order.orderNo})` : ''}` 
    };
  });

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
          name: 'waxMoldingId',
          label: '关联蜡模压制',
          type: 'select',
          required: true,
          options: waxMoldingOptions,
          placeholder: '请选择蜡模压制记录',
        },
        {
          name: 'sampleNo',
          label: '样品编号',
          type: 'text',
          required: true,
          placeholder: '如：S-WI-20240115-001',
        },
        {
          name: 'surfaceQuality',
          label: '表面质量',
          type: 'select',
          required: true,
          options: [
            { value: '优秀', label: '优秀' },
            { value: '良好', label: '良好' },
            { value: '合格', label: '合格' },
            { value: '不合格', label: '不合格' },
          ],
          defaultValue: '良好',
        },
      ],
    },
    {
      title: '检验信息',
      fields: [
        {
          name: 'inspector',
          label: '检验员',
          type: 'text',
          required: true,
          placeholder: '请输入检验员姓名',
        },
        {
          name: 'inspectTime',
          label: '检验时间',
          type: 'datetime-local',
          required: true,
          defaultValue: new Date().toISOString().slice(0, 16),
        },
        {
          name: 'remark',
          label: '备注',
          type: 'textarea',
          placeholder: '选填，特殊情况说明',
          className: 'md:col-span-2',
        },
      ],
    },
  ];

  const dynamicSection: DynamicSection = {
    title: '尺寸检验项目',
    addButtonText: '添加检验项',
    keyName: 'dimensions',
    minItems: 1,
    fields: [
      {
        name: 'name',
        label: '检测项目',
        type: 'text',
        required: true,
        placeholder: '如：总长、外径、内径等',
      },
      {
        name: 'standard',
        label: '标准值(mm)',
        type: 'number',
        required: true,
        placeholder: '如：50.00',
        step: '0.01',
      },
      {
        name: 'tolerance',
        label: '公差(±mm)',
        type: 'number',
        required: true,
        placeholder: '如：0.05',
        step: '0.01',
        min: '0',
      },
      {
        name: 'actual',
        label: '实测值(mm)',
        type: 'number',
        required: true,
        placeholder: '如：50.03',
        step: '0.01',
      },
    ],
  };

  const validationRules: ValidationRule[] = [
    { field: 'workOrderId', label: '关联工单', required: true },
    { field: 'waxMoldingId', label: '关联蜡模压制', required: true },
    { field: 'sampleNo', label: '样品编号', required: true },
    { field: 'surfaceQuality', label: '表面质量', required: true },
    { field: 'inspector', label: '检验员', required: true },
    { field: 'inspectTime', label: '检验时间', required: true },
  ];

  const handleSubmit = (values: Record<string, unknown>) => {
    const formatDT = (v: unknown) => {
      const s = String(v);
      return s.includes('T') ? s.replace('T', ' ') + ':00' : s;
    };

    const rawDims = (values.dimensions as Record<string, unknown>[]) || [];
    const dimensions: DimensionItem[] = rawDims.map(d => {
      const standard = Number(d.standard);
      const actual = Number(d.actual);
      const tolerance = Number(d.tolerance);
      const deviation = Number((actual - standard).toFixed(4));
      const isQualified = Math.abs(deviation) <= tolerance;
      return {
        name: String(d.name),
        standard,
        tolerance,
        actual,
        deviation,
        isQualified,
      };
    });

    const allDimsQualified = dimensions.length > 0 && dimensions.every(d => d.isQualified);
    const surfaceQualified = values.surfaceQuality !== '不合格';
    const isQualified = allDimsQualified && surfaceQualified;

    const newRecord: WaxInspectionRecord = {
      id: generateId('wi'),
      workOrderId: String(values.workOrderId),
      waxMoldingId: String(values.waxMoldingId),
      sampleNo: String(values.sampleNo),
      dimensions,
      surfaceQuality: String(values.surfaceQuality),
      isQualified,
      inspector: String(values.inspector),
      inspectTime: formatDT(values.inspectTime),
      remark: values.remark ? String(values.remark) : undefined,
    };
    addWaxInspectionRecord(newRecord);
    setShowAddModal(false);
  };

  const columns: Column<WaxInspectionRecord>[] = [
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
      key: 'sampleNo',
      title: '样品编号',
      render: (record) => <span className="text-sm font-medium">{record.sampleNo}</span>,
    },
    {
      key: 'dimensions',
      title: '检测项目',
      render: (record) => (
        <span className="text-sm">
          {record.dimensions.filter(d => d.isQualified).length}
          <span className="text-emerald-600">/</span>
          {record.dimensions.length} 项
        </span>
      ),
    },
    {
      key: 'surfaceQuality',
      title: '表面质量',
    },
    {
      key: 'isQualified',
      title: '检验结果',
      render: (record) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          record.isQualified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {record.isQualified ? (
            <><CheckCircle size={12} /> 合格</>
          ) : (
            <><XCircle size={12} /> 不合格</>
          )}
        </span>
      ),
    },
    {
      key: 'inspector',
      title: '检验员',
    },
    {
      key: 'inspectTime',
      title: '检验时间',
      render: (record) => (
        <span className="text-sm text-slate-500">{formatDateTime(record.inspectTime)}</span>
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
        title="蜡件尺寸检验"
        description="管理蜡件尺寸检验记录，确保蜡件质量符合要求"
        addButtonText="新增检验记录"
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
        <h3 className="text-lg font-semibold text-slate-800 mb-4">检验标准参考</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Ruler size={18} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">关键尺寸公差</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">±0.05mm</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={18} className="text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">表面质量要求</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">良好及以上</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={18} className="text-amber-600" />
              <span className="text-sm font-medium text-amber-800">尺寸合格率目标</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">≥98%</p>
          </div>
        </div>
      </div>

      <div>
        <Toolbar
          searchPlaceholder="搜索工单号或样品号..."
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
        title="新增蜡件尺寸检验记录"
        sections={formSections}
        dynamicSection={dynamicSection}
        validationRules={validationRules}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSubmit}
        submitText="保存检验记录"
        size="xl"
      />

      {showDetail && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-slate-800">检验详情</h3>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                  selectedRecord.isQualified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {selectedRecord.isQualified ? (
                    <><CheckCircle size={12} /> 综合合格</>
                  ) : (
                    <><XCircle size={12} /> 综合不合格</>
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-slate-500">工单编号</p>
                  <p className="text-base font-medium text-slate-800">
                    {getWorkOrderById(selectedRecord.workOrderId)?.orderNo || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">产品名称</p>
                  <p className="text-base font-medium text-slate-800">
                    {getWorkOrderById(selectedRecord.workOrderId)?.productName || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">样品编号</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.sampleNo}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">表面质量</p>
                  <p className={`text-base font-medium ${
                    selectedRecord.surfaceQuality === '不合格' ? 'text-red-600' : 
                    selectedRecord.surfaceQuality === '优秀' ? 'text-emerald-600' : 'text-slate-800'
                  }`}>{selectedRecord.surfaceQuality}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">尺寸检验结果</h4>
                <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">检测项目</th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 whitespace-nowrap">标准值(mm)</th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 whitespace-nowrap">公差(±mm)</th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 whitespace-nowrap">实测值(mm)</th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 whitespace-nowrap">偏差(mm)</th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 whitespace-nowrap">判定</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedRecord.dimensions.map((dim, index) => (
                          <tr key={index} className={!dim.isQualified ? 'bg-red-50/50' : ''}>
                            <td className="px-4 py-3 text-sm text-slate-700 font-medium">{dim.name}</td>
                            <td className="px-4 py-3 text-sm text-center text-slate-600">{dim.standard}</td>
                            <td className="px-4 py-3 text-sm text-center text-slate-500">±{dim.tolerance}</td>
                            <td className="px-4 py-3 text-sm text-center font-medium text-slate-800">{dim.actual}</td>
                            <td className={`px-4 py-3 text-sm text-center font-medium ${
                              Math.abs(dim.deviation) > dim.tolerance ? 'text-red-600' : 'text-slate-600'
                            }`}>
                              {dim.deviation > 0 ? '+' : ''}{dim.deviation}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {dim.isQualified ? (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                  <CheckCircle size={12} /> 合格
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                                  <XCircle size={12} /> 不合格
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">尺寸项合格</p>
                  <p className="text-xl font-bold text-emerald-600 mt-1">
                    {selectedRecord.dimensions.filter(d => d.isQualified).length} / {selectedRecord.dimensions.length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    合格率 {selectedRecord.dimensions.length > 0 
                      ? ((selectedRecord.dimensions.filter(d => d.isQualified).length / selectedRecord.dimensions.length) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">检验员</p>
                  <p className="text-base font-medium text-slate-800 mt-1">{selectedRecord.inspector}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">检验时间</p>
                  <p className="text-base font-medium text-slate-800 mt-1">{formatDateTime(selectedRecord.inspectTime)}</p>
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
