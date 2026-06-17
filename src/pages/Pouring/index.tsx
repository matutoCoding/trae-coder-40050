import { useState } from 'react';
import { useStore } from '@/store/useStore';
import PageHeader, { Toolbar } from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { formatDateTime } from '@/utils/format';
import type { Column } from '@/components/DataTable';
import type { PouringRecord } from '@/types';
import { Eye, Droplets, Thermometer, CheckCircle } from 'lucide-react';

export default function Pouring() {
  const { pouringRecords, getWorkOrderById, getMeltingByOrderId } = useStore();
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<PouringRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const filteredRecords = pouringRecords.filter((r) => {
    const order = getWorkOrderById(r.workOrderId);
    return order?.orderNo.toLowerCase().includes(searchText.toLowerCase());
  });

  const columns: Column<PouringRecord>[] = [
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
      key: 'shellCount',
      title: '浇注型壳数',
      render: (record) => (
        <span className="text-sm">{record.shellCount} 组</span>
      ),
    },
    {
      key: 'pouringTemperature',
      title: '浇注温度(°C)',
      render: (record) => (
        <span className="text-sm font-medium text-red-600">{record.pouringTemperature}°C</span>
      ),
    },
    {
      key: 'pouringSpeed',
      title: '浇注速度',
    },
    {
      key: 'pouredCount',
      title: '浇注数量',
      render: (record) => (
        <span className="text-sm">{record.pouredCount} 件</span>
      ),
    },
    {
      key: 'qualifiedCount',
      title: '合格数量',
      render: (record) => (
        <span className="text-sm text-emerald-600 font-medium">{record.qualifiedCount} 件</span>
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

  const totalPoured = pouringRecords.reduce((sum, r) => sum + r.pouredCount, 0);
  const totalQualified = pouringRecords.reduce((sum, r) => sum + r.qualifiedCount, 0);
  const passRate = totalPoured > 0 ? Math.round((totalQualified / totalPoured) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="浇注作业"
        description="管理浇注作业记录，监控浇注温度和质量"
        addButtonText="新增浇注记录"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">今日浇注批次</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{pouringRecords.length} 批</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <Droplets size={24} className="text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">浇注总数</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{totalPoured} 件</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Thermometer size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">合格数量</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{totalQualified} 件</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <CheckCircle size={24} className="text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">合格率</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{passRate}%</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <CheckCircle size={24} className="text-amber-600" />
            </div>
          </div>
        </div>
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
          <h3 className="text-lg font-semibold text-slate-800 mb-4">今日温度记录</h3>
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

      {showDetail && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">浇注详情</h3>
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
                  <p className="text-sm text-slate-500">型壳数量</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.shellCount} 组</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">浇注温度</p>
                  <p className="text-base font-medium text-red-600">{selectedRecord.pouringTemperature}°C</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">浇注速度</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.pouringSpeed}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">浇注数量</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.pouredCount} 件</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">合格数量</p>
                  <p className="text-base font-medium text-emerald-600">{selectedRecord.qualifiedCount} 件</p>
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
                      {Math.round((selectedRecord.qualifiedCount / selectedRecord.pouredCount) * 100)}%
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
