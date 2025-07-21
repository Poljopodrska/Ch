import React, { useState, useEffect } from 'react';
import { customersAPI } from '../services/api';
import toast from 'react-hot-toast';
import CustomerForm from '../components/customers/CustomerForm';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customersAPI.getAll();
      setCustomers(response.data);
    } catch (error) {
      toast.error('Napaka pri nalaganju strank');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data) => {
    try {
      if (editingCustomer) {
        await customersAPI.update(editingCustomer.id, data);
        toast.success('Stranka uspešno posodobljena');
      } else {
        await customersAPI.create(data);
        toast.success('Stranka uspešno dodana');
      }
      loadCustomers();
      setShowForm(false);
      setEditingCustomer(null);
    } catch (error) {
      toast.error('Napaka pri shranjevanju stranke');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Ali ste prepričani, da želite izbrisati to stranko?')) {
      try {
        await customersAPI.delete(id);
        toast.success('Stranka uspešno izbrisana');
        loadCustomers();
      } catch (error) {
        toast.error('Napaka pri brisanju stranke');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stranke</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upravljanje strank in njihovih podatkov
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Dodaj stranko
        </button>
      </div>

      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: customer.color }}
                >
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {customer.name}
                  </h3>
                  <p className="text-sm text-gray-500">{customer.contact_email}</p>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Telefon:</span> {customer.contact_phone || 'Ni podatka'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Naslov:</span> {customer.address || 'Ni podatka'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Davčna št.:</span> {customer.tax_number || 'Ni podatka'}
                </p>
              </div>
              
              <div className="mt-5 flex space-x-2">
                <button
                  onClick={() => {
                    setEditingCustomer(customer);
                    setShowForm(true);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Uredi
                </button>
                <button
                  onClick={() => handleDelete(customer.id)}
                  className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  Izbriši
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Customers;