import { useState } from 'react';
import { useStore } from '@/store/useStore';
import PageHeader, { Toolbar } from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { formatDateTime } from '@/utils/format';
import type { Column } from '@/components/DataTable';
import type { WaxInspectionRecord } from '@/types';
import { Eye, CheckCircle, XCircle, Ruler } from 'lucide-react';

export default function WaxInspection() {
  const { waxInspectionRecords, getWorkOrderById } = useStore();
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<WaxInspectionRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const filteredRecords = waxInspectionRecords.filter((r) =>
    r.sampleNo.toLowerCase().includes(searchText.toLowerCase()) ||
    getWorkOrderById(r.workOrderId)?.orderNo.toLowerCase().includes(searchText.toLowerCase())
  );

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
        <span className="text-sm">{record.dimensions.length} 项</span>
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

  const qualifiedCount = waxInspectionRecords.filter(r => r.isQualified).length;
  const passRate = waxInspectionRecords.length > 0 
    ? Math.round((qualifiedCount / waxInspectionRecords.length) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="蜡件尺寸检验"
        description="管理蜡件尺寸检验记录，确保蜡件质量符合要求"
        addButtonText="新增检验记录"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">今日检验批次</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{waxInspectionRecords.length} 批</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Ruler size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">合格批次</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{qualifiedCount} 批</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <CheckCircle size={24} className="text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">不合格批次</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {waxInspectionRecords.length - qualifiedCount} 批
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <XCircle size={24} className="text-red-600" />
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

      {showDetail && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">检验详情</h3>
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
                  <p className="text-sm text-slate-500">样品编号</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.sampleNo}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">表面质量</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.surfaceQuality}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">尺寸检验结果</h4>
                <div className="bg-slate-50 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">检测项目</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">标准值</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">公差</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">实测值</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">偏差</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">判定</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedRecord.dimensions.map((dim, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-slate-700">{dim.name}</td>
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
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                <CheckCircle size={12} /> 合格
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-red-600">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">检验员</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.inspector}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">检验时间</p>
                  <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.inspectTime)}</p>
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
