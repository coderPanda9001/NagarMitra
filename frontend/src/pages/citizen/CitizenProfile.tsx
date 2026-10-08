import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DemoBadge } from '../../components/common/DemoBadge';
import { User, Phone, MapPin, Bell, Save, Check } from 'lucide-react';

export const CitizenProfile: React.FC = () => {
  const { currentUser } = useAuth();
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '+91 98200 12345');
  const [ward, setWard] = useState(currentUser.ward || 'Ward H/West (Bandra)');
  const [saved, setSaved] = useState(false);

  // Preference Toggles
  const [smsNotif, setSmsNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">Citizen Profile & Settings</h1>
            <DemoBadge label="Active Citizen" />
          </div>
          <p className="text-xs text-slate-500">
            Manage your personal contact info, primary municipal ward preferences, and automated dispatch notifications.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs text-center">
          <div className="w-20 h-20 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-2xl font-bold mx-auto border-2 border-blue-200">
            {name.charAt(0)}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{name}</h3>
            <p className="text-xs text-slate-500">{email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded">
              Verified Citizen
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 text-left text-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-blue-700 shrink-0" />
              <span>{ward}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{phone}</span>
            </div>
          </div>
        </div>

        {/* Edit Details & Settings */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-700" /> Account Details
            </h3>

            {saved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" /> Profile details saved successfully!
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Primary Municipal Ward
                </label>
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="Ward H/West (Bandra)">Ward H/West (Bandra)</option>
                  <option value="Ward K/West (Andheri)">Ward K/West (Andheri)</option>
                  <option value="Ward A (Colaba)">Ward A (Colaba)</option>
                  <option value="Ward G/North (Dadar)">Ward G/North (Dadar)</option>
                  <option value="Ward D (Malabar Hill)">Ward D (Malabar Hill)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-700" /> Notification Dispatch Preferences
              </h4>

              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                  <span>SMS Status Update Alerts</span>
                  <input
                    type="checkbox"
                    checked={smsNotif}
                    onChange={(e) => setSmsNotif(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                  <span>Email Verification Digest</span>
                  <input
                    type="checkbox"
                    checked={emailNotif}
                    onChange={(e) => setEmailNotif(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                  <span>Web Push Notifications</span>
                  <input
                    type="checkbox"
                    checked={pushNotif}
                    onChange={(e) => setPushNotif(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save Profile Preferences
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
