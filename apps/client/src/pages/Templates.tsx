import React, { useEffect, useState } from 'react';
import { Disc, Plus, Check, HardDrive, Cpu, Layers, Monitor, Server } from 'lucide-react';
import { api } from '../api/client';
import { OsTemplate } from '../types';

export const TemplatesPage: React.FC<{ onDeployWithTemplate?: (tmpl: OsTemplate) => void }> = () => {
  const [templates, setTemplates] = useState<OsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'all' | 'linux' | 'windows' | 'gui_desktop' | 'custom_iso'>('all');

  useEffect(() => {
    api.getTemplates()
      .then((res) => setTemplates(res.templates || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = templates.filter((t) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'linux') return !t.os_type || t.os_type === 'linux';
    return t.os_type === filterCategory;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Operating System Templates</h2>
          <p className="text-sm text-slate-400 mt-1">
            Pre-built Linux distros, Windows Server & 11 images, Graphical Desktops, and Custom ISO boot templates
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#0e1424] p-1.5 rounded-xl border border-slate-800 text-xs self-start md:self-auto">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${filterCategory === 'all' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            All ({templates.length})
          </button>
          <button
            onClick={() => setFilterCategory('linux')}
            className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1 ${filterCategory === 'linux' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Server className="w-3.5 h-3.5" /> Linux
          </button>
          <button
            onClick={() => setFilterCategory('windows')}
            className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1 ${filterCategory === 'windows' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Monitor className="w-3.5 h-3.5" /> Windows
          </button>
          <button
            onClick={() => setFilterCategory('gui_desktop')}
            className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1 ${filterCategory === 'gui_desktop' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Monitor className="w-3.5 h-3.5" /> Desktop GUI
          </button>
          <button
            onClick={() => setFilterCategory('custom_iso')}
            className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1 ${filterCategory === 'custom_iso' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Disc className="w-3.5 h-3.5" /> Custom ISO
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((t) => {
          const isWindows = t.os_type === 'windows';
          const isGui = t.os_type === 'gui_desktop';
          const isIso = t.os_type === 'custom_iso';

          return (
            <div key={t.id} className="p-6 bg-[#0e1424] border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    isWindows ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                    isGui ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' :
                    isIso ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                  }`}>
                    {isWindows || isGui ? <Monitor className="w-5 h-5" /> : <Disc className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">{t.name}</h3>
                    <div className="text-xs text-slate-400">{t.distro} {t.version}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                  isWindows ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' :
                  isIso ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {isWindows ? 'Windows HVM' : isGui ? 'Desktop GUI' : isIso ? 'Custom ISO' : 'Linux Cloud-Init'}
                </span>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Image Reference:</span>
                  <span className="text-cyan-300 font-semibold">{t.image_ref}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Default User:</span>
                  <span className="text-slate-200">{t.default_user}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Minimum Specs:</span>
                  <span className="text-slate-200">{t.min_ram_mb}MB RAM / {t.min_disk_gb}GB Disk</span>
                </div>
                {t.iso_url && (
                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                    <span>Boot ISO:</span>
                    <span className="text-amber-300 truncate max-w-[180px]">{t.iso_url}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
