import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import PageHeader, { Toolbar } from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormModal, { type ValidationRule, type FormSection, type DynamicSection } from '@/components/FormModal';
import { formatDateTime, generateId } from '@/utils/format';
import type { Column } from '@/components/DataTable';
import { Link } from 'react-router-dom';
import type { PouringRecord, TemperatureRecord } from '@/types';
import { Eye, Droplets, Thermometer, CheckCircle, Scale, Package } from 'lucide-react';

export default function Pouring() {
  const { 
    pouringRecords, 
    workOrders,
    meltingRecords,
    getWorkOrderById, 
    getMeltingByOrderId,
    addPouringRecord
  } = useStore();
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<PouringRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredRecords = pouringRecords.filter((r) => {
    const order = getWorkOrderById(r.workOrderId);
    return order?.orderNo.toLowerCase().includes(searchText.toLowerCase());
  });

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayRecords = pouringRecords.filter(r => 
      r.pourTime.startsWith(today) || r.pourTime.includes(today)
    );
    const totalPoured = pouringRecords.reduce((sum, r) => sum + r.pouredCount, 0);
    const totalQualified = pouringRecords.reduce((sum, r) => sum + r.qualifiedCount, 0);
    const totalWeight = pouringRecords.reduce((sum, r) => sum + r.pouredWeight, 0);
    const passRate = totalPoured > 0 ? ((totalQualified / totalPoured) * 100).toFixed(1) : '0';
    return [
      { label: '今日浇注批次', value: String(todayRecords.length), unit: '批', icon: <Droplets size={20} />, color: 'red' },
      { label: '浇注总数', value: totalPoured.toLocaleString(), unit: '件', icon: <Package size={20} />, color: 'blue' },
      { label: '合格数量', value: totalQualified.toLocaleString(), unit: '件', icon: <CheckCircle size={20} />, color: 'emerald' },
      { label: '合格率', value: passRate, unit: '%', icon: <CheckCircle size={20} />, color: 'amber' },
      { label: '浇注重量', value: totalWeight.toLocaleString(), unit: 'kg', icon: <Scale size={20} />, color: 'purple' },
    ];
  }, [pouringRecords]);

  const workOrderOptions = workOrders
    .filter(o => o.status === 'pouring' || o.status === 'melting' || o.status === 'pending')
    .map(o => ({ value: o.id, label: `${o.orderNo} - ${o.productName}` }));

  const getMeltingOptions = (workOrderId: string) => {
    if (!workOrderId) return [];
    return getMeltingByOrderId(workOrderId).map(m => ({
      value: m.id,
      label: `${m.furnaceNo} - ${m.alloyGrade} (${m.totalWeight}kg)`
    }));
  };

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
          name: 'meltingId',
          label: '熔炼炉次',
          type: 'select',
          required: true,
          dependsOn: 'workOrderId',
          getOptions: (values) => values.workOrderId 
            ? getMeltingByOrderId(String(values.workOrderId)).map(m => ({
                value: m.id,
                label: `${m.furnaceNo} - ${m.alloyGrade}`,
              }))
            : [],
          placeholder: '请选择熔炼炉次',
        },
        {
          name: 'ladleNo',
          label: '浇注包号',
          type: 'text',
          required: true,
          placeholder: '如：LB-001',
        },
        {
          name: 'operator',
          label: '操作工',
          type: 'text',
          required: true,
          placeholder: '请输入操作工姓名',
        },
      ],
    },
    {
      title: '工艺参数',
      fields: [
        {
          name: 'shellCount',
          label: '浇注型壳数(组)',
          type: 'number',
          required: true,
          placeholder: '请输入型壳组数',
          step: '1',
          min: '1',
        },
        {
          name: 'shellTemperature',
          label: '型壳温度(°C)',
          type: 'number',
          required: true,
          placeholder: '≥800',
          step: '1',
          min: '500',
          max: '1200',
          defaultValue: 850,
        },
        {
          name: 'pouringTemperature',
          label: '平均浇注温度(°C)',
          type: 'number',
          required: true,
          placeholder: '1500-1650',
          step: '1',
          min: '1400',
          max: '1700',
          defaultValue: 1560,
        },
        {
          name: 'pouringSpeed',
          label: '浇注速度',
          type: 'select',
          required: true,
          options: [
            { value: '慢速', label: '慢速' },
            { value: '中速', label: '中速' },
            { value: '快速', label: '快速' },
          ],
          defaultValue: '中速',
        },
        {
          name: 'holdingTemperature',
          label: '保温温度(°C)',
          type: 'number',
          required: true,
          placeholder: '1500-1580',
          step: '1',
          min: '1400',
          max: '1650',
          defaultValue: 1540,
        },
        {
          name: 'holdingTime',
          label: '保温时间(min)',
          type: 'number',
          required: true,
          placeholder: '15-60',
          step: '1',
          min: '5',
          max: '180',
          defaultValue: 30,
        },
      ],
    },
    {
      title: '重量与统计',
      fields: [
        {
          name: 'steelWeight',
          label: '钢水重量(kg)',
          type: 'number',
          required: true,
          placeholder: '请输入钢水总重量',
          step: '0.1',
          min: '1',
        },
        {
          name: 'pouredWeight',
          label: '浇注重量(kg)',
          type: 'number',
          required: true,
          placeholder: '实际浇注重量',
          step: '0.1',
          min: '0',
        },
        {
          name: 'pouredCount',
          label: '浇注数量(件)',
          type: 'number',
          required: true,
          placeholder: '请输入浇注总数',
          step: '1',
          min: '1',
        },
        {
          name: 'qualifiedCount',
          label: '合格数量(件)',
          type: 'number',
          required: true,
          placeholder: '不能大于浇注数量',
          step: '1',
          min: '0',
        },
        {
          name: 'pourTime',
          label: '浇注时间',
          type: 'datetime-local',
          required: true,
          defaultValue: new Date().toISOString().slice(0, 16),
          className: 'md:col-span-2',
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

  const temperatureDynamicSection: DynamicSection = {
    title: '浇注温度记录（多组）',
    addButtonText: '添加温度记录',
    keyName: 'temperatureRecords',
    minItems: 1,
    filterEmpty: true,
    itemValidationRules: [
      { field: 'timePoint', label: '时间点', required: true },
      { field: 'temperature', label: '温度', required: true, type: 'number', min: 1400, max: 1700 },
    ],
    fields: [
      {
        name: 'timePoint',
        label: '时间点',
        type: 'text',
        required: true,
        placeholder: '如：开始浇注/中期/结束',
        defaultValue: '中期',
      },
      {
        name: 'temperature',
        label: '温度(°C)',
        type: 'number',
        required: true,
        placeholder: '1500-1650',
        step: '1',
        min: '1400',
        max: '1700',
        defaultValue: 1560,
      },
    ],
  };

  const validationRules: ValidationRule[] = [
    { field: 'workOrderId', label: '关联工单', required: true },
    { field: 'meltingId', label: '熔炼炉次', required: true },
    { field: 'ladleNo', label: '浇注包号', required: true },
    { field: 'operator', label: '操作工', required: true },
    { field: 'shellCount', label: '浇注型壳数', required: true, type: 'number', min: 1 },
    { field: 'shellTemperature', label: '型壳温度', required: true, type: 'number', min: 500, max: 1200 },
    { field: 'pouringTemperature', label: '平均浇注温度', required: true, type: 'number', min: 1400, max: 1700 },
    { field: 'pouringSpeed', label: '浇注速度', required: true },
    { field: 'holdingTemperature', label: '保温温度', required: true, type: 'number', min: 1400, max: 1650 },
    { field: 'holdingTime', label: '保温时间', required: true, type: 'number', min: 5, max: 180 },
    { field: 'steelWeight', label: '钢水重量', required: true, type: 'number', min: 1 },
    { 
      field: 'pouredWeight', 
      label: '浇注重量', 
      required: true, 
      type: 'number', 
      min: 0,
      custom: (value, allValues) => {
        const pw = Number(value);
        const sw = Number(allValues.steelWeight);
        if (pw > sw) return '浇注重量不能大于钢水重量';
        return null;
      }
    },
    { field: 'pouredCount', label: '浇注数量', required: true, type: 'number', min: 1 },
    { 
      field: 'qualifiedCount', 
      label: '合格数量', 
      required: true, 
      type: 'number', 
      min: 0,
      custom: (value, allValues) => {
        const q = Number(value);
        const p = Number(allValues.pouredCount);
        if (q > p) return '合格数量不能大于浇注数量';
        return null;
      }
    },
    { field: 'pourTime', label: '浇注时间', required: true },
  ];

  const handleSubmit = (values: Record<string, unknown>) => {
    const formatDT = (v: unknown) => {
      const s = String(v);
      return s.includes('T') ? s.replace('T', ' ') + ':00' : s;
    };

    const tempRecords = Array.isArray(values.temperatureRecords)
      ? (values.temperatureRecords as Record<string, unknown>[]).map(r => ({
          timePoint: String(r.timePoint),
          temperature: Number(r.temperature),
        }))
      : [];

    const newRecord: PouringRecord = {
      id: generateId('pr'),
      workOrderId: String(values.workOrderId),
      meltingId: String(values.meltingId),
      shellCount: Number(values.shellCount),
      shellTemperature: Number(values.shellTemperature),
      pouringTemperature: Number(values.pouringTemperature),
      temperatureRecords: tempRecords,
      pouringSpeed: String(values.pouringSpeed),
      ladleNo: String(values.ladleNo),
      steelWeight: Number(values.steelWeight),
      pouredWeight: Number(values.pouredWeight),
      holdingTemperature: Number(values.holdingTemperature),
      holdingTime: Number(values.holdingTime),
      operator: String(values.operator),
      pourTime: formatDT(values.pourTime),
      pouredCount: Number(values.pouredCount),
      qualifiedCount: Number(values.qualifiedCount),
      remark: values.remark ? String(values.remark) : undefined,
    };
    addPouringRecord(newRecord);
    setShowAddModal(false);
  };

  const columns: Column<PouringRecord>[] = [
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
      key: 'ladleNo',
      title: '浇注包号',
      render: (record) => <span className="text-sm font-medium">{record.ladleNo}</span>,
    },
    {
      key: 'shellCount',
      title: '型壳数',
      render: (record) => (
        <span className="text-sm">{record.shellCount} 组</span>
      ),
    },
    {
      key: 'shellTemperature',
      title: '型壳温度',
      render: (record) => (
        <span className="text-sm text-orange-600">{record.shellTemperature}°C</span>
      ),
    },
    {
      key: 'pouringTemperature',
      title: '浇注温度',
      render: (record) => (
        <span className="text-sm font-medium text-red-600">{record.pouringTemperature}°C</span>
      ),
    },
    {
      key: 'pouredWeight',
      title: '浇注重量',
      render: (record) => (
        <span className="text-sm">{record.pouredWeight} kg</span>
      ),
    },
    {
      key: 'pouredCount',
      title: '浇注/合格',
      render: (record) => (
        <span className="text-sm">
          <span>{record.pouredCount}</span>
          <span className="text-emerald-600 font-medium"> / {record.qualifiedCount}</span>
        </span>
      ),
    },
    {
      key: 'operator',
      title: '操作工',
    },
    {
      key: 'pourTime',
      title: '浇注时间',
      render: (record) => (
        <span className="text-sm text-slate-500">{formatDateTime(record.pourTime)}</span>
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

  const statColorClasses: Record<string, { bg: string; text: string }> = {
    red: { bg: 'bg-red-50', text: 'text-red-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="浇注作业"
        description="管理浇注作业记录，监控浇注温度和质量"
        addButtonText="新增浇注记录"
        onAdd={() => setShowAddModal(true)}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {stat.value} <span className="text-sm font-normal text-slate-500">{stat.unit}</span>
                </p>
              </div>
              <div className={`p-3 ${statColorClasses[stat.color]?.bg || 'bg-slate-50'} rounded-xl`}>
                <div className={statColorClasses[stat.color]?.text || 'text-slate-600'}>
                  {stat.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">浇注工艺标准</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl">
              <p className="text-sm text-orange-600 font-medium">浇注温度</p>
              <p className="text-2xl font-bold text-orange-700 mt-2">1560°C</p>
              <p className="text-xs text-orange-500 mt-1">45号钢标准</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
              <p className="text-sm text-indigo-600 font-medium">浇注速度</p>
              <p className="text-2xl font-bold text-indigo-700 mt-2">中速</p>
              <p className="text-xs text-indigo-500 mt-1">先慢后快再慢</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
              <p className="text-sm text-teal-600 font-medium">型壳温度</p>
              <p className="text-2xl font-bold text-teal-700 mt-2">≥800°C</p>
              <p className="text-xs text-teal-500 mt-1">出炉后立即浇注</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <p className="text-sm text-purple-600 font-medium">保温时间</p>
              <p className="text-2xl font-bold text-purple-700 mt-2">30 min</p>
              <p className="text-xs text-purple-500 mt-1">浇注后保温</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">今日温度参考</h3>
          <div className="space-y-3">
            {[
              { time: '09:00', temp: 1565, status: '正常' },
              { time: '10:30', temp: 1560, status: '正常' },
              { time: '12:00', temp: 1558, status: '正常' },
              { time: '14:00', temp: 1570, status: '偏高' },
              { time: '15:30', temp: 1562, status: '正常' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Thermometer size={18} className={`${item.status === '正常' ? 'text-emerald-500' : 'text-amber-500'}`} />
                  <span className="text-sm text-slate-600">{item.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${
                    item.status === '正常' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {item.temp}°C
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === '正常' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
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

      <FormModal
        isOpen={showAddModal}
        title="新增浇注记录"
        sections={formSections}
        dynamicSection={temperatureDynamicSection}
        validationRules={validationRules}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSubmit}
        submitText="保存记录"
        size="xl"
      />

      {showDetail && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">浇注详情</h3>
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
                  <p className="text-sm text-slate-500">浇注包号</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.ladleNo}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">型壳数量</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.shellCount} 组</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">浇注速度</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.pouringSpeed}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">操作工</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.operator}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">浇注时间</p>
                  <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.pourTime)}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">温度参数</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{selectedRecord.shellTemperature}°C</p>
                    <p className="text-xs text-slate-500 mt-1">型壳温度</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{selectedRecord.pouringTemperature}°C</p>
                    <p className="text-xs text-slate-500 mt-1">浇注温度</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">{selectedRecord.holdingTemperature}°C</p>
                    <p className="text-xs text-slate-500 mt-1">保温温度</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedRecord.holdingTime} min</p>
                    <p className="text-xs text-slate-500 mt-1">保温时间</p>
                  </div>
                </div>
              </div>

              {selectedRecord.temperatureRecords && selectedRecord.temperatureRecords.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">浇注温度记录</h4>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">序号</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">时间点</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">温度(°C)</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {selectedRecord.temperatureRecords.map((record: TemperatureRecord, idx: number) => {
                          const isHigh = record.temperature > 1580;
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-slate-600">{idx + 1}</td>
                              <td className="px-4 py-3 text-slate-700">{record.timePoint}</td>
                              <td className={`px-4 py-3 text-right font-bold ${isHigh ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {record.temperature}°C
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  isHigh 
                                    ? 'bg-amber-100 text-amber-700' 
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  <Thermometer size={12} className="mr-1" />
                                  {isHigh ? '偏高' : '正常'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">钢水重量</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.steelWeight} kg</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">浇注重量</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.pouredWeight} kg</p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600">质量统计</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">
                      {selectedRecord.qualifiedCount} / {selectedRecord.pouredCount} 件合格
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-600">
                      {selectedRecord.pouredCount > 0 
                        ? Math.round((selectedRecord.qualifiedCount / selectedRecord.pouredCount) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-emerald-500">合格率</p>
                  </div>
                </div>
              </div>

              {selectedRecord.remark && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">备注</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedRecord.remark}</p>
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
