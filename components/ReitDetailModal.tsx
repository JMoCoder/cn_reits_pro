import React from 'react';
import { ReitDetail } from '../types';

interface ReitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReitDetail | null;
  loading: boolean;
  error: string | null;
}

const ReitDetailModal: React.FC<ReitDetailModalProps> = ({ isOpen, onClose, data, loading, error }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            {data ? `${data.base.name} (${data.base.ts_code})` : '详细信息'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none px-2"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading && (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-center p-4">
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-6">
              {/* Basic Info */}
              <section>
                <h3 className="text-lg font-semibold mb-3 border-l-4 border-blue-500 pl-2 text-gray-900">基本信息</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <span className="text-xs text-gray-500 block mb-1">基金管理人</span>
                    <span className="text-sm font-medium text-gray-900">{data.base.management || '-'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <span className="text-xs text-gray-500 block mb-1">基金托管人</span>
                    <span className="text-sm font-medium text-gray-900">{data.base.custodian || '-'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <span className="text-xs text-gray-500 block mb-1">成立日期</span>
                    <span className="text-sm font-medium text-gray-900">{data.base.found_date || '-'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <span className="text-xs text-gray-500 block mb-1">上市日期</span>
                    <span className="text-sm font-medium text-gray-900">{data.base.list_date || '-'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <span className="text-xs text-gray-500 block mb-1">发行份额</span>
                    <span className="text-sm font-medium text-gray-900">{data.base.issue_amount ? `${data.base.issue_amount}亿份` : '-'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <span className="text-xs text-gray-500 block mb-1">管理费率</span>
                    <span className="text-sm font-medium text-gray-900">{data.base.m_fee ? `${data.base.m_fee}%` : '-'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <span className="text-xs text-gray-500 block mb-1">托管费率</span>
                    <span className="text-sm font-medium text-gray-900">{data.base.c_fee ? `${data.base.c_fee}%` : '-'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <span className="text-xs text-gray-500 block mb-1">存续期</span>
                    <span className="text-sm font-medium text-gray-900">{data.base.duration_year ? `${data.base.duration_year}年` : '-'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <span className="text-xs text-gray-500 block mb-1">投资类型</span>
                    <span className="text-sm font-medium text-gray-900">{data.base.invest_type || '-'}</span>
                  </div>
                </div>
              </section>

              {/* Managers */}
              <section>
                <h3 className="text-lg font-semibold mb-3 border-l-4 border-green-500 pl-2 text-gray-900">基金经理</h3>
                <div className="space-y-3">
                  {data.managers && data.managers.length > 0 ? (
                    data.managers.map((mgr, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-md border border-gray-100">
                        <div className="flex items-baseline justify-between mb-2">
                           <div className="font-bold text-gray-900 text-base">{mgr.name}</div>
                           <div className="text-xs text-gray-500 font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
                             {mgr.begin_date} ~ {mgr.end_date || '至今'}
                           </div>
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed text-justify">{mgr.resume}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm italic p-2">暂无经理信息</div>
                  )}
                </div>
              </section>

              {/* Dividends */}
              <section>
                <h3 className="text-lg font-semibold mb-3 border-l-4 border-red-500 pl-2 text-gray-900">分红历史</h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="p-3 text-left font-semibold text-gray-600">除息日</th>
                        <th className="p-3 text-left font-semibold text-gray-600">派息日</th>
                        <th className="p-3 text-right font-semibold text-gray-600">分红金额</th>
                        <th className="p-3 text-left font-semibold text-gray-600">说明</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.dividend && data.dividend.length > 0 ? (
                        data.dividend.map((div, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3 text-gray-700 font-mono">{div.ex_date}</td>
                            <td className="p-3 text-gray-700 font-mono">{div.pay_date}</td>
                            <td className="p-3 text-right font-mono text-red-600 font-bold">{div.div_cash}</td>
                            <td className="p-3 text-gray-600">{div.div_memo || div.div_proc}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-400 italic">暂无分红数据</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* NAV History */}
              <section>
                <h3 className="text-lg font-semibold mb-3 border-l-4 border-purple-500 pl-2 text-gray-900">近期净值 <span className="text-xs font-normal text-gray-500 ml-1">(最近10次)</span></h3>
                 <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="p-3 text-left font-semibold text-gray-600">日期</th>
                        <th className="p-3 text-right font-semibold text-gray-600">单位净值</th>
                        <th className="p-3 text-right font-semibold text-gray-600">累计净值</th>
                        <th className="p-3 text-right font-semibold text-gray-600">调整净值</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.nav && data.nav.length > 0 ? (
                        data.nav.slice(0, 10).map((n, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3 text-gray-700 font-mono">{n.nav_date}</td>
                            <td className="p-3 text-right font-mono text-gray-900 font-medium">{n.unit_nav.toFixed(4)}</td>
                            <td className="p-3 text-right font-mono text-gray-600">{n.accum_nav.toFixed(4)}</td>
                            <td className="p-3 text-right font-mono text-gray-600">{n.adj_nav.toFixed(4)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-400 italic">暂无净值数据</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReitDetailModal;
