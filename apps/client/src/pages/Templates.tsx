import React, { useEffect, useState } from 'react';
import { Disc, Plus, Check, HardDrive, Cpu, Layers } from 'lucide-react';
import { api } from '../api/client';
import { OsTemplate } from '../types';

export const TemplatesPage: React.FC<{ onDeployWithTemplate?: (tmpl: OsTemplate) => void }> = () => {
  const [templates, setTemplates] = useState<OsTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTemplates()
      .then((res) => setTemplates(res.templates || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Operating System Templates</h2>
        <p className="text-sm text-slate-400 mt-1">
          Pre-built cloud-init, Linux distribution images, and container templates ready for instant provisioning
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((t) => (
          <div key={t.id} className="p-6 bg-[#0e1424] border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl">
                  <Disc className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">{t.name}</h3>
                  <div className="text-xs text-slate-400">{t.distro} {t.version}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Image Reference:</span>
                <span className="text-cyan-300 font-semibold">{t.image_ref}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Default Username:</span>
                <span className="text-slate-200">{t.default_user}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Minimum Specs:</span>
                <span className="text-slate-200">{t.min_ram_mb}MB RAM / {t.min_disk_gb}GB Disk</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
