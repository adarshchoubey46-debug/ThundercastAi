import { useState } from 'react';
import { ExternalLink, MapPin, ShieldCheck, Trash2 } from 'lucide-react';

interface SafetySite {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
}

const SITE_STORAGE_KEY = 'vajra-kavach-safety-site';
const CHECKLIST_STORAGE_KEY = 'vajra-kavach-safety-checklist';
const preparednessItems = [
  'Identify a sturdy enclosed building and an interior room away from windows.',
  'Charge phones and keep a torch, drinking water, essential medicines, and first aid supplies ready.',
  'Avoid open fields, rooftops, isolated trees, floodwater, and contact with wired electrical equipment during storms.',
  'Share your household contact plan and meeting point with everyone who may need it.'
];

const emptySite: SafetySite = { name: '', address: '', latitude: 23.2599, longitude: 77.4126, phone: '' };

export function SafetyPage() {
  const [site, setSite] = useState<SafetySite | null>(() => {
    try {
      const value = localStorage.getItem(SITE_STORAGE_KEY);
      return value ? JSON.parse(value) as SafetySite : null;
    } catch {
      localStorage.removeItem(SITE_STORAGE_KEY);
      return null;
    }
  });
  const [draft, setDraft] = useState<SafetySite>(() => site ?? emptySite);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(() => {
    try {
      const value = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      const parsed = value ? JSON.parse(value) as boolean[] : [];
      return Array.from({ length: preparednessItems.length }, (_, index) => parsed[index] ?? false);
    } catch {
      localStorage.removeItem(CHECKLIST_STORAGE_KEY);
      return Array(preparednessItems.length).fill(false);
    }
  });
  const [savedMessage, setSavedMessage] = useState('');

  const updateDraft = (field: keyof SafetySite, value: string) => {
    setDraft((current) => ({
      ...current,
      [field]: field === 'latitude' || field === 'longitude' ? Number(value) : value
    }));
  };

  const saveSite = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!Number.isFinite(draft.latitude) || !Number.isFinite(draft.longitude) || Math.abs(draft.latitude) > 90 || Math.abs(draft.longitude) > 180) {
      setSavedMessage('Enter valid latitude and longitude values.');
      return;
    }
    localStorage.setItem(SITE_STORAGE_KEY, JSON.stringify(draft));
    setSite(draft);
    setSavedMessage('Location saved on this device. Confirm it is open and designated before travelling.');
  };

  const toggleChecklistItem = (index: number) => {
    setCheckedItems((current) => {
      const updated = current.map((checked, itemIndex) => itemIndex === index ? !checked : checked);
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearSite = () => {
    localStorage.removeItem(SITE_STORAGE_KEY);
    setSite(null);
    setDraft(emptySite);
    setSavedMessage('Saved location removed from this device.');
  };

  return (
    <div className="space-y-6">
      <section className="glass-card p-5 border-l-4 border-l-emerald-700">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 mt-0.5 text-emerald-800" />
          <div>
            <h2 className="text-base font-bold text-gray-800">Safety &amp; shelter plan</h2>
            <p className="mt-1 text-sm text-gray-600">Keep a confirmed safe location and household readiness plan close at hand.</p>
            <p className="mt-2 text-xs text-amber-800">This dashboard does not maintain an official shelter directory. Add a location only after confirming it with your district or municipal authority.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#175a91]" />
            <h3 className="text-sm font-bold text-gray-800">My confirmed safe location</h3>
          </div>
          {site && (
            <div className="flex items-start justify-between gap-3 bg-emerald-50 border border-emerald-200 p-3 rounded-sm">
              <div className="text-sm text-gray-800">
                <strong>{site.name}</strong>
                <div>{site.address}</div>
                <div className="text-xs text-gray-600">{site.latitude.toFixed(5)}, {site.longitude.toFixed(5)}</div>
                {site.phone && <a className="text-[#175a91] underline" href={`tel:${site.phone}`}>{site.phone}</a>}
              </div>
              <button type="button" onClick={clearSite} title="Remove saved location" className="p-2 text-red-800 hover:bg-red-50 rounded-sm">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          <form onSubmit={saveSite} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="sm:col-span-2 space-y-1">
              <span className="block text-gray-600">Location name</span>
              <input required value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} className="w-full border border-gray-300 bg-white rounded-sm p-2 text-gray-800" placeholder="Confirmed shelter or safe site" />
            </label>
            <label className="sm:col-span-2 space-y-1">
              <span className="block text-gray-600">Address or directions</span>
              <input required value={draft.address} onChange={(event) => updateDraft('address', event.target.value)} className="w-full border border-gray-300 bg-white rounded-sm p-2 text-gray-800" placeholder="Street, locality, landmark" />
            </label>
            <label className="space-y-1">
              <span className="block text-gray-600">Latitude</span>
              <input required type="number" step="any" min="-90" max="90" value={draft.latitude} onChange={(event) => updateDraft('latitude', event.target.value)} className="w-full border border-gray-300 bg-white rounded-sm p-2 text-gray-800" />
            </label>
            <label className="space-y-1">
              <span className="block text-gray-600">Longitude</span>
              <input required type="number" step="any" min="-180" max="180" value={draft.longitude} onChange={(event) => updateDraft('longitude', event.target.value)} className="w-full border border-gray-300 bg-white rounded-sm p-2 text-gray-800" />
            </label>
            <label className="sm:col-span-2 space-y-1">
              <span className="block text-gray-600">Local contact (optional)</span>
              <input type="tel" value={draft.phone} onChange={(event) => updateDraft('phone', event.target.value)} className="w-full border border-gray-300 bg-white rounded-sm p-2 text-gray-800" placeholder="Contact confirmed by local authority" />
            </label>
            <button type="submit" className="sm:col-span-2 px-4 py-2 bg-[#12345a] text-white rounded-sm font-semibold hover:bg-[#175a91]">Save safe location</button>
          </form>
          <p className="text-[11px] text-gray-500">Location details stay in this browser and are marked on the weather map. They are not uploaded to Vajra Kavach.</p>
          {savedMessage && <p role="status" className="text-xs text-emerald-800">{savedMessage}</p>}
          {site && (
            <a className="inline-flex items-center gap-1 text-xs text-[#175a91] underline" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${site.latitude}&mlon=${site.longitude}#map=16/${site.latitude}/${site.longitude}`}>
              View saved location on OpenStreetMap <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </section>

        <section className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-800">Severe-weather readiness</h3>
          <div className="space-y-3">
            {preparednessItems.map((item, index) => (
              <label key={item} className="flex gap-3 text-sm text-gray-700 items-start">
                <input type="checkbox" checked={checkedItems[index]} onChange={() => toggleChecklistItem(index)} className="mt-1 accent-emerald-700" />
                <span>{item}</span>
              </label>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-200 space-y-2">
            <h4 className="text-xs font-bold text-gray-700">Official information</h4>
            <a className="flex items-center justify-between py-2 text-sm text-[#175a91] underline" href="https://mausam.imd.gov.in/" target="_blank" rel="noreferrer">
              India Meteorological Department <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a className="flex items-center justify-between py-2 text-sm text-[#175a91] underline" href="https://112.gov.in/" target="_blank" rel="noreferrer">
              India emergency response: 112 <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-[11px] text-gray-500">In immediate danger, contact emergency services and follow instructions from local authorities. This checklist is general preparedness guidance, not an evacuation order.</p>
        </section>
      </div>
    </div>
  );
}