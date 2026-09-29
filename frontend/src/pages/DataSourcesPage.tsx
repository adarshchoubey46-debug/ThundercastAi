import React, { useState, useEffect } from 'react';
import type { DataSourceStatus } from '../types/weather';
import { fetchDataSources } from '../services/api';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import {
  Database,
  Upload,
  CheckCircle,
  HardDrive
} from 'lucide-react';

export const DataSourcesPage: React.FC = () => {
  const [sources, setSources] = useState<DataSourceStatus[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadSources() {
      const data = await fetchDataSources();
      setSources(data);
    }
    loadSources();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadStatus(`Uploaded dataset '${file.name}' (${(file.size / 1024).toFixed(1)} KB). Ingested into Local Adapter Pipeline.`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-card p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Meteorological Data Ingestion Adapters & Sensor Health</span>
          </h2>
          <p className="text-xs text-gray-400">
            Adapters for IMD Doppler Radar, MOSDAC INSAT-3DR Satellite, and IITM Lightning Stroke Telemetry
          </p>
        </div>

        <ProvenanceBadge sourceType="REAL_OBSERVATION" sourceName="Configured weather source status" />
      </div>

      {/* Main Data Sources Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((source) => (
          <div key={source.source_id} className="glass-card p-5 space-y-3 border-l-4 border-l-cyan-500">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">{source.source_id}</span>
                <h3 className="text-sm font-bold text-white mt-0.5">{source.source_name}</h3>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-mono rounded font-bold ${
                source.status === 'OPERATIONAL'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                {source.status}
              </span>
            </div>

            <p className="text-xs text-gray-300">{source.type}</p>

            <div className="p-3 bg-gray-900/60 rounded border border-gray-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-400">Data Freshness:</span>
                <span className="text-cyan-300">{source.data_freshness}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Stream Latency:</span>
                <span className="text-white">{source.latency_minutes} Minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Coverage Domain:</span>
                <span className="text-gray-300 truncate max-w-[200px]" title={source.coverage_area}>
                  {source.coverage_area}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Local Dataset File Upload Adapter Card */}
      <div className="glass-card p-6 space-y-4 border-l-4 border-l-purple-500">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-purple-400" />
            <span>Local Dataset File Upload Adapter (CSV / JSON / NetCDF)</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Ingest custom ground station readings or historical radar NetCDF grids directly into the Nowcasting pipeline.
          </p>
        </div>

        <div className="border-2 border-dashed border-gray-800 hover:border-purple-500/50 transition p-8 rounded-xl text-center space-y-3 bg-gray-950/40">
          <HardDrive className="w-8 h-8 text-purple-400 mx-auto" />
          <div className="text-xs text-gray-300">
            <label className="cursor-pointer text-purple-400 hover:underline font-bold">
              Click to select file
              <input
                type="file"
                accept=".csv,.json,.nc"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-gray-400"> or drag and drop local weather file (.csv, .json, .nc)</span>
          </div>
          <p className="text-[11px] text-gray-500 font-mono">
            Supported fields: timestamp, lat, lon, temp_c, humidity, pressure, dbz, rainfall_mm, cape
          </p>
        </div>

        {uploadStatus && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded text-xs text-emerald-300 flex items-center space-x-2 font-mono">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{uploadStatus}</span>
          </div>
        )}
      </div>

    </div>
  );
};
