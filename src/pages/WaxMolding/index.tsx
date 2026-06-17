import { useState } from 'react';
import { useStore } from '@/store/useStore';
import PageHeader, { Toolbar } from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { formatDateTime } from '@/utils/format';
import type { Column } from '@/components/DataTable';
import type { WaxMoldingRecord } from '@/types';
import { Plus, Eye, Thermometer, Clock, Gauge, Package, CheckCircle } from 'lucide-react';

export default function WaxMolding() {
  const { waxMoldingRecords, workOrders, getWorkOrderById } = useStore();
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<WaxMoldingRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const filteredRecords = waxMoldingRecords.filter((r) =>
    r.moldNo.toLowerCase().includes(searchText.toLowerCase()) ||
    getWorkOrderById(r.workOrderId)?.orderNo.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: Column<WaxMoldingRecord>[] = [
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
      key: 'moldNo',
      title: '模具编号',
      render: (record) => <span className="text-sm font-medium">{record.moldNo}</span>,
    },
    {
      key: 'waxMaterial',
      title: '蜡料类型',
    },
    {
      key: 'waxTemperature',
      title: '蜡温(°C)',
      render: (record) => (
        <span className="text-sm">{record.waxTemperature}°C</span>
      ),
    },
    {
      key: 'pressPressure',
      title: '压注压力(MPa)',
      render: (record) => (
        <span className="text-sm">{record.pressPressure} MPa</span>
      ),
    },
    {
      key: 'holdTime',
      title: '保压时间(s)',
      render: (record) => (
        <span className="text-sm">{record.holdTime} s</span>
      ),
    },
    {
      key: 'outputCount',
      title: '产出数量',
      render: (record) => (
        <span className="text-sm">{record.outputCount} 件</span>
      ),
    },
    {
      key: 'qualifiedCount',
      title: '合格数量',
      render: (record) => (
        <span className="text-sm text-emerald-600 font-medium">
          {record.qualifiedCount} 件
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

  const stats = [
    { label: '今日压制批次', value: '8', unit: '批', icon: <Plus size={20} />, color: 'blue' },
    { label: '总产出数量', value: '1,250', unit: '件', icon: <Package size={20} />, color: 'emerald' },
    { label: '平均合格率', value: '97.5', unit: '%', icon: <CheckCircle size={20} />, color: 'amber' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="蜡模压制"
        description="管理蜡模压制记录，监控压制工艺参数"
        addButtonText="新增压制记录"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <h3 className="text-lg font-semibold text-slate-800 mb-6">工艺参数标准</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer size={18} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">蜡料温度</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">55-60°C</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Gauge size={18} className="text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">压注压力</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">2-3 MPa</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={18} className="text-amber-600" />
              <span className="text-sm font-medium text-amber-800">保压时间</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">60-180s</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer size={18} className="text-purple-600" />
              <span className="text-sm font-medium text-purple-800">模具温度</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">20-28°C</p>
          </div>
        </div>
      </div>

      <div>
        <Toolbar
          searchPlaceholder="搜索工单号或模具号..."
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
              <h3 className="text-lg font-semibold text-slate-800">蜡模压制详情</h3>
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
                  <p className="text-sm text-slate-500">模具编号</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.moldNo}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">蜡料类型</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.waxMaterial}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">操作工</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.operator}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">工艺参数</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedRecord.waxTemperature}°C</p>
                    <p className="text-xs text-slate-500 mt-1">蜡料温度</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{selectedRecord.moldTemperature}°C</p>
                    <p className="text-xs text-slate-500 mt-1">模具温度</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">{selectedRecord.pressPressure} MPa</p>
                    <p className="text-xs text-slate-500 mt-1">压注压力</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">保压时间</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.holdTime} 秒</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">生产周期</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.cycleTime} 秒</p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl">
                <h4 className="text-sm font-semibold text-emerald-700 mb-3">生产统计</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{selectedRecord.outputCount}</p>
                    <p className="text-xs text-slate-500 mt-1">总产出</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{selectedRecord.qualifiedCount}</p>
                    <p className="text-xs text-slate-500 mt-1">合格品</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">
                      {selectedRecord.outputCount - selectedRecord.qualifiedCount}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">不合格品</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">开始时间</p>
                  <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.startTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">结束时间</p>
                  <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.endTime)}</p>
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
