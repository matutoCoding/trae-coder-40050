import { useState } from 'react';
import { useStore } from '@/store/useStore';
import PageHeader, { Toolbar } from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { formatDateTime } from '@/utils/format';
import type { Column } from '@/components/DataTable';
import type { MeltingRecord } from '@/types';
import { Eye, Factory, Scale, Thermometer, Clock, FlaskConical } from 'lucide-react';

export default function AlloyMelting() {
  const { meltingRecords, getWorkOrderById } = useStore();
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MeltingRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const filteredRecords = meltingRecords.filter((r) =>
    r.alloyGrade.toLowerCase().includes(searchText.toLowerCase()) ||
    r.furnaceNo.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: Column<MeltingRecord>[] = [
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

  const totalMeltingWeight = meltingRecords.reduce((sum, r) => sum + r.totalWeight, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="合金熔炼"
        description="管理中频炉熔炼配料过程，监控合金成分和熔炼工艺"
        addButtonText="新增熔炼记录"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">今日熔炼炉次</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{meltingRecords.length} 炉</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl">
              <Factory size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">总熔炼量</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{totalMeltingWeight} kg</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Scale size={24} className="text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">合金种类</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {new Set(meltingRecords.map(r => r.alloyGrade)).size} 种
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <FlaskConical size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">成分合格率</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">98.5%</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <Thermometer size={24} className="text-amber-600" />
            </div>
          </div>
        </div>
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

      {showDetail && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">熔炼详情</h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-500">工单编号</p>
                  <p className="text-base font-medium text-slate-800">
                    {getWorkOrderById(selectedRecord.workOrderId)?.orderNo || '-'}
                  </p>
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
                <h4 className="text-sm font-semibold text-amber-800 mb-3">配料明细</h4>
                <div className="space-y-2">
                  {selectedRecord.materials.map((mat, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-amber-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span className="text-sm text-amber-900">{mat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-amber-800">{mat.weight} kg</span>
                        <span className="text-xs text-amber-600 ml-2">({mat.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-amber-200">
                    <span className="text-sm font-medium text-amber-900">总重量</span>
                    <span className="text-base font-bold text-amber-700">{selectedRecord.totalWeight} kg</span>
                  </div>
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

              {selectedRecord.compositionTest && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">成分检测结果</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedRecord.compositionTest.map((item, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-slate-500">{item.element}</p>
                        <p className={`text-lg font-bold ${
                          item.isQualified ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {item.content}%
                        </p>
                        <p className="text-xs text-slate-400">标准: {item.standard}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-slate-500">开始时间</p>
                <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.startTime)}</p>
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
