import React, { useState } from 'react';
import toast from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    companyName: 'AGP d.o.o.',
    companyAddress: 'Industrijska cesta 1, 1000 Ljubljana',
    companyTaxNumber: 'SI12345678',
    defaultCurrency: 'EUR',
    workingDays: ['Pon', 'Tor', 'Sre', 'Čet', 'Pet'],
    defaultProductionHours: '8',
    autoSaveEnabled: true,
    autoSaveInterval: '60',
  });

  const tabs = [
    { id: 'general', label: 'Splošno', icon: '⚙️' },
    { id: 'production', label: 'Proizvodnja', icon: '🏭' },
    { id: 'notifications', label: 'Obvestila', icon: '🔔' },
    { id: 'backup', label: 'Varnostne kopije', icon: '💾' },
  ];

  const handleSave = () => {
    // Save settings
    toast.success('Nastavitve shranjene');
  };

  const handleBackup = () => {
    // Create backup
    toast.success('Varnostna kopija ustvarjena');
  };

  const handleRestore = () => {
    // Restore from backup
    toast.success('Podatki obnovljeni iz varnostne kopije');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nastavitve</h1>
        <p className="mt-1 text-sm text-gray-500">
          Konfigurirajte sistemske nastavitve
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Splošne nastavitve</h2>
              
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Naziv podjetja
                </label>
                <input
                  type="text"
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Naslov podjetja
                </label>
                <input
                  type="text"
                  id="companyAddress"
                  value={settings.companyAddress}
                  onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="companyTaxNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Davčna številka
                </label>
                <input
                  type="text"
                  id="companyTaxNumber"
                  value={settings.companyTaxNumber}
                  onChange={(e) => setSettings({ ...settings, companyTaxNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="defaultCurrency" className="block text-sm font-medium text-gray-700 mb-1">
                  Privzeta valuta
                </label>
                <select
                  id="defaultCurrency"
                  value={settings.defaultCurrency}
                  onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'production' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Nastavitve proizvodnje</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delovni dnevi
                </label>
                <div className="space-y-2">
                  {['Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob', 'Ned'].map((day) => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.workingDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSettings({
                              ...settings,
                              workingDays: [...settings.workingDays, day],
                            });
                          } else {
                            setSettings({
                              ...settings,
                              workingDays: settings.workingDays.filter((d) => d !== day),
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="defaultProductionHours" className="block text-sm font-medium text-gray-700 mb-1">
                  Privzeto število delovnih ur
                </label>
                <input
                  type="number"
                  id="defaultProductionHours"
                  value={settings.defaultProductionHours}
                  onChange={(e) => setSettings({ ...settings, defaultProductionHours: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Nastavitve obvestil</h2>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Obvestilo o nizki zalogi
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Obvestilo o nezadostnem številu delavcev
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Tedensko poročilo po e-pošti
                  </span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Varnostne kopije</h2>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Samodejna varnostna kopija</h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.autoSaveEnabled}
                    onChange={(e) => setSettings({ ...settings, autoSaveEnabled: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Omogoči samodejno shranjevanje
                  </span>
                </label>
                
                {settings.autoSaveEnabled && (
                  <div className="mt-3">
                    <label htmlFor="autoSaveInterval" className="block text-sm font-medium text-gray-700 mb-1">
                      Interval shranjevanja (sekunde)
                    </label>
                    <input
                      type="number"
                      id="autoSaveInterval"
                      value={settings.autoSaveInterval}
                      onChange={(e) => setSettings({ ...settings, autoSaveInterval: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleBackup}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Ustvari varnostno kopijo
                </button>
                <button
                  onClick={handleRestore}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Obnovi iz varnostne kopije
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Shrani nastavitve
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;