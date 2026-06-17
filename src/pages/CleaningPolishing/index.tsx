import { useState } from 'react';
import { useStore } from '@/store/useStore';
import PageHeader, { Toolbar } from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { formatDateTime } from '@/utils/format';
import type { Column } from '@/components/DataTable';
import type { CleaningRecord } from '@/types';
import { Eye, Sparkles, Scissors, CircleDot, CheckCircle2 } from 'lucide-react';

type TabType = 'cutting' | 'grinding' | 'polishing';

export default function CleaningPolishing() {
  const { cleaningRecords, getWorkOrderById } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('cutting');
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<CleaningRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const filteredRecords = cleaningRecords
    .filter((r) => r.processType === activeTab)
    .filter((r) => {
      const order = getWorkOrderById(r.workOrderId);
      return order?.orderNo.toLowerCase().includes(searchText.toLowerCase());
    });

  const processLabels = {
    cutting: '切割飞边',
    grinding: '打磨处理',
    polishing: '打磨抛光',
  };

  const columns: Column<CleaningRecord>[] = [
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
      key: 'equipment',
      title: '设备',
    },
    {
      key: 'quantity',
      title: '处理数量',
      render: (record) => (
        <span className="text-sm">{record.quantity} 件</span>
      ),
    },
    {
      key: 'qualityResult',
      title: '质量结果',
      render: (record) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          record.qualityResult === '优秀' 
            ? 'bg-emerald-100 text-emerald-700'
            : record.qualityResult === '合格'
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {record.qualityResult}
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
      key: 'endTime',
      title: '结束时间',
      render: (record) => (
        <span className="text-sm text-slate-500">{formatDateTime(record.endTime)}</span>
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

  const tabs = [
    { key: 'cutting' as TabType, label: '切割飞边', icon: <Scissors size={18} /> },
    { key: 'grinding' as TabType, label: '打磨处理', icon: <CircleDot size={18} /> },
    { key: 'polishing' as TabType, label: '打磨抛光', icon: <Sparkles size={18} /> },
  ];

  const cuttingCount = cleaningRecords.filter(r => r.processType === 'cutting').length;
  const grindingCount = cleaningRecords.filter(r => r.processType === 'grinding').length;
  const polishingCount = cleaningRecords.filter(r => r.processType === 'polishing').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="清理打磨"
        description="管理铸件后处理工序，包括切割飞边、打磨和抛光"
        addButtonText="新增记录"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">待清理工单</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">8 单</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Scissors size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">切割飞边</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{cuttingCount} 批</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <Scissors size={24} className="text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">打磨处理</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{grindingCount} 批</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <CircleDot size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">打磨抛光</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{polishingCount} 批</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Sparkles size={24} className="text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-xl ${
              activeTab === 'cutting' ? 'bg-amber-50' :
              activeTab === 'grinding' ? 'bg-blue-50' : 'bg-emerald-50'
            }`}>
              <p className="text-sm text-slate-600">加工设备</p>
              <p className={`text-lg font-bold mt-1 ${
                activeTab === 'cutting' ? 'text-amber-700' :
                activeTab === 'grinding' ? 'text-blue-700' : 'text-emerald-700'
              }`}>
                {activeTab === 'cutting' ? '等离子切割机' :
                 activeTab === 'grinding' ? '砂带打磨机' : '抛光机'}
              </p>
            </div>
            <div className={`p-4 rounded-xl ${
              activeTab === 'cutting' ? 'bg-amber-50' :
              activeTab === 'grinding' ? 'bg-blue-50' : 'bg-emerald-50'
            }`}>
              <p className="text-sm text-slate-600">工艺标准</p>
              <p className={`text-lg font-bold mt-1 ${
                activeTab === 'cutting' ? 'text-amber-700' :
                activeTab === 'grinding' ? 'text-blue-700' : 'text-emerald-700'
              }`}>
                {activeTab === 'cutting' ? '浇口平整' :
                 activeTab === 'grinding' ? 'Ra≤6.3' : 'Ra≤1.6'}
              </p>
            </div>
            <div className={`p-4 rounded-xl ${
              activeTab === 'cutting' ? 'bg-amber-50' :
              activeTab === 'grinding' ? 'bg-blue-50' : 'bg-emerald-50'
            }`}>
              <p className="text-sm text-slate-600">今日完成</p>
              <p className={`text-lg font-bold mt-1 ${
                activeTab === 'cutting' ? 'text-amber-700' :
                activeTab === 'grinding' ? 'text-blue-700' : 'text-emerald-700'
              }`}>
                {filteredRecords.length} 批
              </p>
            </div>
          </div>

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

      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">后处理工艺流程</h3>
            <p className="text-sm text-slate-300">铸件从浇注完成到成品入库的完整后处理流程</p>
          </div>
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
        <div className="flex items-center gap-2 mt-6">
          {['切割飞边', '粗磨', '精磨', '抛光', '检验', '入库'].map((step, index) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < 4 ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                }`}>
                  {index + 1}
                </div>
                <p className="text-xs mt-2 text-center w-16">{step}</p>
              </div>
              {index < 5 && (
                <div className={`flex-1 h-0.5 mx-1 ${
                  index < 3 ? 'bg-emerald-500' : 'bg-slate-700'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showDetail && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {processLabels[selectedRecord.processType]}详情
              </h3>
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
                  <p className="text-sm text-slate-500">工序类型</p>
                  <p className="text-base font-medium text-slate-800">
                    {processLabels[selectedRecord.processType]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">加工设备</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.equipment}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">处理数量</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.quantity} 件</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">操作工</p>
                  <p className="text-base font-medium text-slate-800">{selectedRecord.operator}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">质量结果</p>
                  <p className={`text-base font-medium ${
                    selectedRecord.qualityResult === '优秀' 
                      ? 'text-emerald-600'
                      : selectedRecord.qualityResult === '合格'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {selectedRecord.qualityResult}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">开始时间</p>
                    <p className="text-sm font-medium text-slate-700">
                      {formatDateTime(selectedRecord.startTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">结束时间</p>
                    <p className="text-sm font-medium text-slate-700">
                      {formatDateTime(selectedRecord.endTime)}
                    </p>
                  </div>
                </div>
              </div>

              {selectedRecord.remark && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">备注</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                    {selectedRecord.remark}
                  </p>
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
