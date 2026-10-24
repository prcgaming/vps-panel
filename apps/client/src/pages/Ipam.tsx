import React, { useEffect, useState } from 'react';
import { Network, Plus, Check, Shield, Server, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { IpPool, IpAllocation } from '../types';

export const IpamPage: React.FC = () => {
  const [pools, setPools] = useState<IpPool[]>([]);
  const [allocations, setAllocations] = useState<IpAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIpam = () => {
    api.getIpam()
      .then((res) => {
        setPools(res.pools || []);
        setAllocations(res.allocations || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIpam();
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">IP Address Management (IPAM)</h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage public IPv4/IPv6 subnets, gateway configuration, and automatic IP pool assignment
          </p>
        </div>
        <button
          onClick={fetchIpam}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700 self-start"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pools.map((pool) => {
          const used = pool.used_ips || 0;
          const total = pool.total_ips || 0;
          const percent = total ? Math.round((used / total) * 100) : 0;

          return (
            <div key={pool.id} className="p-6 bg-[#0e1424] border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 text-base">{pool.name}</h3>
                  <div className="text-xs font-mono text-cyan-400 mt-0.5">{pool.subnet}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                  {pool.type}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-center font-mono">
                <div>
                  <div className="text-slate-400 text-[10px]">GATEWAY</div>
                  <div className="text-slate-300 mt-0.5">{pool.gateway}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">NETMASK</div>
                  <div className="text-slate-300 mt-0.5">{pool.netmask}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">ALLOCATED</div>
                  <div className="text-cyan-400 font-bold mt-0.5">{used} / {total}</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                  <span>Pool Utilization</span>
                  <span>{percent}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-cyan-500 h-full rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Allocation Table */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 bg-slate-900/40">
          <h3 className="font-bold text-slate-200 text-sm">IP Allocation Map</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 font-mono">
              <tr>
                <th className="py-3 px-6">IP Address</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned VPS</th>
                <th className="py-3 px-6 text-right">Allocation Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
              {allocations.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-6 font-semibold text-slate-200">{a.ip_address}</td>
                  <td className="py-3.5 px-4">
                    {a.vps_id ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-sans font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        In Use
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-sans font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        Available
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-sans">
                    {a.vps_name ? `${a.vps_name} (${a.vps_hostname})` : '—'}
                  </td>
                  <td className="py-3.5 px-6 text-right text-slate-400">
                    {new Date(a.allocated_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
