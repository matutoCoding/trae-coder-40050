import { useState } from 'react';
import { useStore } from '@/store/useStore';
import PageHeader, { Toolbar } from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { formatDateTime } from '@/utils/format';
import type { Column } from '@/components/DataTable';
import type { DewaxingRecord, FiringRecord } from '@/types';
import { Eye, Flame, ThermometerSun, Gauge, Clock, TrendingUp } from 'lucide-react';

type TabType = 'dewaxing' | 'firing';

export default function DewaxingFiring() {
  const { dewaxingRecords, firingRecords, getWorkOrderById } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('dewaxing');
  const [searchText, setSearchText] = useState('');
  const [selectedDewaxing, setSelectedDewaxing] = useState<DewaxingRecord | null>(null);
  const [selectedFiring, setSelectedFiring] = useState<FiringRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const filteredDewaxing = dewaxingRecords.filter((r) => {
    const order = getWorkOrderById(r.workOrderId);
    return order?.orderNo.toLowerCase().includes(searchText.toLowerCase());
  });

  const filteredFiring = firingRecords.filter((r) => {
    const order = getWorkOrderById(r.workOrderId);
    return order?.orderNo.toLowerCase().includes(searchText.toLowerCase());
  });

  const dewaxingColumns: Column<DewaxingRecord>[] = [
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
      key: 'kettleNo',
      title: '脱蜡釜编号',
    },
    {
      key: 'pressure',
      title: '工作压力(MPa)',
      render: (record) => (
        <span className="text-sm font-medium">{record.pressure} MPa</span>
      ),
    },
    {
      key: 'temperature',
      title: '脱蜡温度(°C)',
      render: (record) => (
        <span className="text-sm">{record.temperature}°C</span>
      ),
    },
    {
      key: 'duration',
      title: '脱蜡时间(min)',
      render: (record) => (
        <span className="text-sm">{record.duration} min</span>
      ),
    },
    {
      key: 'waxRecovery',
      title: '蜡回收率(%)',
      render: (record) => (
        <span className="text-sm text-emerald-600 font-medium">{record.waxRecovery}%</span>
      ),
    },
    {
      key: 'result',
      title: '结果',
      render: (record) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          record.result === '合格' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {record.result}
        </span>
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
            setSelectedDewaxing(record);
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

  const firingColumns: Column<FiringRecord>[] = [
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
      key: 'furnaceNo',
      title: '焙烧炉编号',
    },
    {
      key: 'maxTemperature',
      title: '最高温度(°C)',
      render: (record) => (
        <span className="text-sm font-medium text-red-600">{record.maxTemperature}°C</span>
      ),
    },
    {
      key: 'holdTime',
      title: '保温时间(min)',
      render: (record) => (
        <span className="text-sm">{record.holdTime} min</span>
      ),
    },
    {
      key: 'totalTime',
      title: '总时长(min)',
      render: (record) => (
        <span className="text-sm">{record.totalTime} min</span>
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
            setSelectedFiring(record);
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
    { key: 'dewaxing' as TabType, label: '脱蜡釜压力', icon: <Gauge size={18} /> },
    { key: 'firing' as TabType, label: '型壳焙烧曲线', icon: <Flame size={18} /> },
  ];

  const avgWaxRecovery = dewaxingRecords.length > 0
    ? (dewaxingRecords.reduce((sum, r) => sum + r.waxRecovery, 0) / dewaxingRecords.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="脱蜡焙烧"
        description="管理脱蜡和焙烧工艺过程，监控压力温度曲线"
        addButtonText="新增记录"
      />

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'dewaxing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-orange-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge size={20} className="text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">今日脱蜡批次</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-700">{dewaxingRecords.length} 批</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <ThermometerSun size={20} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">平均温度</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">165°C</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={20} className="text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">蜡回收率</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">{avgWaxRecovery}%</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={20} className="text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">平均时长</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">25 min</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-orange-800 mb-4">脱蜡工艺标准</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white/80 backdrop-blur p-4 rounded-lg">
                    <p className="text-xs text-slate-500">工作压力</p>
                    <p className="text-lg font-bold text-slate-800">0.6-0.8 MPa</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur p-4 rounded-lg">
                    <p className="text-xs text-slate-500">脱蜡温度</p>
                    <p className="text-lg font-bold text-slate-800">160-170°C</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur p-4 rounded-lg">
                    <p className="text-xs text-slate-500">脱蜡时间</p>
                    <p className="text-lg font-bold text-slate-800">20-30 min</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur p-4 rounded-lg">
                    <p className="text-xs text-slate-500">蜡回收率</p>
                    <p className="text-lg font-bold text-emerald-600">≥90%</p>
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
                  columns={dewaxingColumns}
                  data={filteredDewaxing}
                  rowKey="id"
                  pagination={{
                    current: 1,
                    pageSize: 10,
                    total: filteredDewaxing.length,
                    onChange: () => {},
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'firing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-red-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame size={20} className="text-red-600" />
                    <span className="text-sm font-medium text-red-800">今日焙烧批次</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">{firingRecords.length} 批</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <ThermometerSun size={20} className="text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">最高温度</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-700">1100°C</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={20} className="text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">保温时间</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">120 min</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={20} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">总周期</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">480 min</p>
                </div>
              </div>

              {firingRecords.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-4">
                    焙烧温度曲线 - {firingRecords[0].furnaceNo}
                  </h4>
                  <div className="relative h-64 bg-white rounded-lg p-4">
                    <svg className="w-full h-full" viewBox="0 0 480 200" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {[0, 50, 100, 150, 200].map((y, i) => (
                        <line
                          key={i}
                          x1="40"
                          y1={y}
                          x2="460"
                          y2={y}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                          strokeDasharray="4,4"
                        />
                      ))}
                      
                      <path
                        d="M40,180 Q100,170 120,150 Q150,120 180,100 Q200,80 240,60 Q280,50 300,40 Q340,35 380,35 L420,35 L440,60 L460,100"
                        fill="url(#curveGradient)"
                        stroke="#ef4444"
                        strokeWidth="2"
                      />
                      
                      {firingRecords[0].curveData.map((point, i) => {
                        const x = 40 + (point.time / 480) * 420;
                        const y = 180 - (point.temperature / 1200) * 160;
                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r="4" fill="#ef4444" />
                          </g>
                        );
                      })}
                      
                      <text x="35" y="190" fontSize="10" fill="#64748b" textAnchor="end">25°</text>
                      <text x="35" y="100" fontSize="10" fill="#64748b" textAnchor="end">600°</text>
                      <text x="35" y="40" fontSize="10" fill="#64748b" textAnchor="end">1100°</text>
                      <text x="40" y="200" fontSize="10" fill="#64748b">0</text>
                      <text x="250" y="200" fontSize="10" fill="#64748b" textAnchor="middle">时间(min)</text>
                      <text x="460" y="200" fontSize="10" fill="#64748b">480</text>
                    </svg>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-amber-800 mb-4">焙烧工艺规范</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-xs text-amber-700">升温阶段</div>
                    <div className="flex-1 h-2 bg-amber-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <div className="w-32 text-xs text-amber-800 font-medium">室温 → 600°C / 2h</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-xs text-amber-700">快速升温</div>
                    <div className="flex-1 h-2 bg-orange-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                    <div className="w-32 text-xs text-orange-800 font-medium">600°C → 1100°C / 2h</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-xs text-amber-700">高温保温</div>
                    <div className="flex-1 h-2 bg-red-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <div className="w-32 text-xs text-red-800 font-medium">1100°C 保温 2h</div>
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
                  columns={firingColumns}
                  data={filteredFiring}
                  rowKey="id"
                  pagination={{
                    current: 1,
                    pageSize: 10,
                    total: filteredFiring.length,
                    onChange: () => {},
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {showDetail && (selectedDewaxing || selectedFiring) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {selectedDewaxing ? '脱蜡详情' : '焙烧详情'}
              </h3>
              <button
                onClick={() => {
                  setShowDetail(false);
                  setSelectedDewaxing(null);
                  setSelectedFiring(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              {selectedDewaxing && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">工单编号</p>
                      <p className="text-base font-medium text-slate-800">
                        {getWorkOrderById(selectedDewaxing.workOrderId)?.orderNo || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">脱蜡釜</p>
                      <p className="text-base font-medium text-slate-800">{selectedDewaxing.kettleNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">工作压力</p>
                      <p className="text-base font-medium text-slate-800">{selectedDewaxing.pressure} MPa</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">脱蜡温度</p>
                      <p className="text-base font-medium text-slate-800">{selectedDewaxing.temperature}°C</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">脱蜡时长</p>
                      <p className="text-base font-medium text-slate-800">{selectedDewaxing.duration} 分钟</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">蜡回收率</p>
                      <p className="text-base font-medium text-emerald-600">{selectedDewaxing.waxRecovery}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">操作工</p>
                      <p className="text-base font-medium text-slate-800">{selectedDewaxing.operator}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">脱蜡结果</p>
                      <p className={`text-base font-medium ${
                        selectedDewaxing.result === '合格' ? 'text-emerald-600' : 'text-red-600'
                      }`}>{selectedDewaxing.result}</p>
                    </div>
                  </div>
                </>
              )}
              {selectedFiring && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">工单编号</p>
                      <p className="text-base font-medium text-slate-800">
                        {getWorkOrderById(selectedFiring.workOrderId)?.orderNo || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">焙烧炉</p>
                      <p className="text-base font-medium text-slate-800">{selectedFiring.furnaceNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">最高温度</p>
                      <p className="text-base font-medium text-red-600">{selectedFiring.maxTemperature}°C</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">保温时间</p>
                      <p className="text-base font-medium text-slate-800">{selectedFiring.holdTime} 分钟</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">总时长</p>
                      <p className="text-base font-medium text-slate-800">{selectedFiring.totalTime} 分钟</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">操作工</p>
                      <p className="text-base font-medium text-slate-800">{selectedFiring.operator}</p>
                    </div>
                  </div>
                </>
              )}

              {selectedDewaxing?.remark && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">备注</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedDewaxing.remark}</p>
                </div>
              )}
              {selectedFiring?.remark && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">备注</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedFiring.remark}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDetail(false);
                  setSelectedDewaxing(null);
                  setSelectedFiring(null);
                }}
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
