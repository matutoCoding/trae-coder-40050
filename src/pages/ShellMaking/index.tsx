import { useState } from 'react';
import { useStore } from '@/store/useStore';
import PageHeader, { Toolbar } from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { formatDateTime } from '@/utils/format';
import type { Column } from '@/components/DataTable';
import type { ShellMakingRecord } from '@/types';
import { Eye, Layers, Droplets, Clock, Thermometer, Droplet } from 'lucide-react';

type TabType = 'layers' | 'viscosity' | 'drying';

export default function ShellMaking() {
  const { shellMakingRecords, getWorkOrderById, getAssemblyByOrderId } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('layers');
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ShellMakingRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const filteredRecords = shellMakingRecords.filter((r) => {
    const order = getWorkOrderById(r.workOrderId);
    return order?.orderNo.toLowerCase().includes(searchText.toLowerCase());
  });

  const viscosityData = [
    { time: '08:00', viscosity: 35, layer: '面层' },
    { time: '10:00', viscosity: 34, layer: '面层' },
    { time: '12:00', viscosity: 36, layer: '面层' },
    { time: '14:00', viscosity: 33, layer: '过渡层' },
    { time: '16:00', viscosity: 28, layer: '过渡层' },
    { time: '18:00', viscosity: 29, layer: '背层' },
  ];

  const dryingRecords = [
    { id: 1, assemblyNo: 'ASM-002', layer: 3, startTime: '2024-06-16 08:00:00', duration: 24, temperature: 23, humidity: 55, status: 'drying' },
    { id: 2, assemblyNo: 'ASM-003', layer: 2, startTime: '2024-06-16 10:00:00', duration: 18, temperature: 24, humidity: 58, status: 'completed' },
    { id: 3, assemblyNo: 'ASM-004', layer: 1, startTime: '2024-06-16 14:00:00', duration: 24, temperature: 25, humidity: 60, status: 'drying' },
    { id: 4, assemblyNo: 'ASM-005', layer: 5, startTime: '2024-06-15 16:00:00', duration: 24, temperature: 22, humidity: 55, status: 'completed' },
  ];

  const columns: Column<ShellMakingRecord>[] = [
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
      key: 'layerNumber',
      title: '层数',
      render: (record) => (
        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          {record.layerNumber}
        </span>
      ),
    },
    {
      key: 'slurryType',
      title: '涂料类型',
    },
    {
      key: 'viscosity',
      title: '涂料粘度(s)',
      render: (record) => (
        <span className={`text-sm font-medium ${
          record.viscosity > 30 && record.layerNumber === 1 ? 'text-amber-600' : 'text-slate-700'
        }`}>
          {record.viscosity} s
        </span>
      ),
    },
    {
      key: 'sandType',
      title: '砂料类型',
    },
    {
      key: 'sandMesh',
      title: '砂料目数',
    },
    {
      key: 'dryTime',
      title: '干燥时间(h)',
      render: (record) => (
        <span className="text-sm">{record.dryTime} h</span>
      ),
    },
    {
      key: 'operator',
      title: '操作工',
    },
    {
      key: 'operateTime',
      title: '操作时间',
      render: (record) => (
        <span className="text-sm text-slate-500">{formatDateTime(record.operateTime)}</span>
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

  const totalLayers = shellMakingRecords.length;
  const avgViscosity = shellMakingRecords.length > 0 
    ? (shellMakingRecords.reduce((sum, r) => sum + r.viscosity, 0) / shellMakingRecords.length).toFixed(1)
    : 0;

  const tabs = [
    { key: 'layers' as TabType, label: '制壳层数管控', icon: <Layers size={18} /> },
    { key: 'viscosity' as TabType, label: '涂料粘度监控', icon: <Droplets size={18} /> },
    { key: 'drying' as TabType, label: '型壳干燥时长', icon: <Clock size={18} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="制壳挂砂"
        description="管理制壳挂砂全过程，包括层数管控、粘度监控和干燥管理"
        addButtonText="新增制壳记录"
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
          {activeTab === 'layers' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers size={20} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">总层数记录</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{totalLayers} 层</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets size={20} className="text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">平均粘度</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">{avgViscosity} s</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={20} className="text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">平均干燥</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">22 h</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer size={20} className="text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">干燥温度</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">24°C</p>
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
            </div>
          )}

          {activeTab === 'viscosity' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                  <p className="text-sm opacity-90">面层涂料粘度</p>
                  <p className="text-3xl font-bold mt-2">35 s</p>
                  <p className="text-xs opacity-75 mt-1">标准范围: 32-38s</p>
                </div>
                <div className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white">
                  <p className="text-sm opacity-90">过渡层涂料粘度</p>
                  <p className="text-3xl font-bold mt-2">28 s</p>
                  <p className="text-xs opacity-75 mt-1">标准范围: 25-30s</p>
                </div>
                <div className="p-5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-white">
                  <p className="text-sm opacity-90">背层涂料粘度</p>
                  <p className="text-3xl font-bold mt-2">22 s</p>
                  <p className="text-xs opacity-75 mt-1">标准范围: 20-25s</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-slate-700 mb-4">今日粘度监测记录</h4>
                <div className="space-y-2">
                  {viscosityData.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-white rounded-lg">
                      <span className="text-sm text-slate-500 w-20">{item.time}</span>
                      <span className="text-sm text-slate-600 w-20">{item.layer}</span>
                      <div className="flex-1">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(item.viscosity / 40) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-slate-800 w-16 text-right">
                        {item.viscosity} s
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3">涂料配比（面层）</h4>
                  <div className="space-y-2 text-sm text-blue-700">
                    <div className="flex justify-between">
                      <span>硅溶胶</span>
                      <span className="font-medium">60%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>锆英粉</span>
                      <span className="font-medium">35%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>润湿剂</span>
                      <span className="font-medium">3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>消泡剂</span>
                      <span className="font-medium">2%</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <h4 className="text-sm font-semibold text-emerald-800 mb-3">涂料配比（背层）</h4>
                  <div className="space-y-2 text-sm text-emerald-700">
                    <div className="flex justify-between">
                      <span>硅溶胶</span>
                      <span className="font-medium">55%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>莫来石粉</span>
                      <span className="font-medium">40%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>润湿剂</span>
                      <span className="font-medium">3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>消泡剂</span>
                      <span className="font-medium">2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'drying' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-600">干燥中模组</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {dryingRecords.filter(r => r.status === 'drying').length} 组
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <p className="text-sm text-emerald-600">已完成干燥</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">
                    {dryingRecords.filter(r => r.status === 'completed').length} 组
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <p className="text-sm text-amber-600">干燥室温度</p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">24°C</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm text-purple-600">干燥室湿度</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">58%</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">模组编号</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">当前层数</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">开始时间</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">干燥时长</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">温度</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">湿度</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">状态</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">进度</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dryingRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{record.assemblyNo}</td>
                        <td className="px-4 py-3 text-center text-sm">第 {record.layer} 层</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-500">{record.startTime}</td>
                        <td className="px-4 py-3 text-center text-sm">{record.duration} h</td>
                        <td className="px-4 py-3 text-center text-sm">{record.temperature}°C</td>
                        <td className="px-4 py-3 text-center text-sm">{record.humidity}%</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            record.status === 'drying' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {record.status === 'drying' ? '干燥中' : '已完成'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                record.status === 'drying' ? 'bg-blue-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: record.status === 'completed' ? '100%' : '65%' }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDetail && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">制壳详情</h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
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
                  <p className="text-sm text-slate-500">层数</p>
                  <p className="text-base font-medium text-slate-800">第 {selectedRecord.layerNumber} 层</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">涂料类型</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.slurryType}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">涂料粘度</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.viscosity} s</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">砂料类型</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.sandType}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">砂料目数</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.sandMesh}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">干燥时间</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.dryTime} 小时</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">操作工</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.operator}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">干燥环境</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedRecord.dryTemperature}°C</p>
                    <p className="text-xs text-slate-500 mt-1">干燥温度</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{selectedRecord.dryHumidity}%</p>
                    <p className="text-xs text-slate-500 mt-1">环境湿度</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500">操作时间</p>
                <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.operateTime)}</p>
              </div>
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
