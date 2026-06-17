import { useState } from 'react';
import { useStore } from '@/store/useStore';
import PageHeader, { Toolbar } from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { formatDateTime } from '@/utils/format';
import type { Column } from '@/components/DataTable';
import type { AssemblyRecord } from '@/types';
import { Eye, CheckCircle, XCircle, Wrench, Layers } from 'lucide-react';

export default function AssemblyWelding() {
  const { assemblyRecords, getWorkOrderById } = useStore();
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AssemblyRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const filteredRecords = assemblyRecords.filter((r) =>
    r.assemblyNo.toLowerCase().includes(searchText.toLowerCase()) ||
    getWorkOrderById(r.workOrderId)?.orderNo.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: Column<AssemblyRecord>[] = [
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
        <span className="text-sm">{record.weldingTemperature}°C</span>
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

  const totalWaxCount = assemblyRecords.reduce((sum, r) => sum + r.waxCount, 0);
  const passCount = assemblyRecords.filter(r => r.inspectionResult).length;
  const passRate = assemblyRecords.length > 0 
    ? Math.round((passCount / assemblyRecords.length) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="模组焊接"
        description="管理模组组树焊接记录，监控焊接质量"
        addButtonText="新增焊接记录"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">今日焊接模组</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{assemblyRecords.length} 组</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Wrench size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">焊接蜡件总数</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{totalWaxCount} 件</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Layers size={24} className="text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">检验合格</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{passCount} 组</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle size={24} className="text-green-600" />
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

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">焊接工艺标准</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-orange-50 rounded-xl">
            <p className="text-sm text-orange-600 font-medium">焊接温度</p>
            <p className="text-2xl font-bold text-orange-700 mt-1">80-90°C</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-600 font-medium">焊接方式</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">焊蜡枪</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl">
            <p className="text-sm text-emerald-600 font-medium">每组蜡件</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">8-12件</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl">
            <p className="text-sm text-purple-600 font-medium">冷却时间</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">30分钟</p>
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

      {showDetail && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">模组焊接详情</h3>
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
                  <p className="text-sm text-slate-500">模组编号</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.assemblyNo}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">蜡件数量</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.waxCount} 件</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">焊接方式</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.weldingMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">焊接温度</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.weldingTemperature}°C</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">焊工</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.welder}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">检验结果</p>
                    <p className="text-sm text-slate-700 mt-1">检验员：{selectedRecord.inspector}</p>
                  </div>
                  {selectedRecord.inspectionResult ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                      <CheckCircle size={18} />
                      检验合格
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium">
                      <XCircle size={18} />
                      检验不合格
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500">焊接时间</p>
                <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.weldingTime)}</p>
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
