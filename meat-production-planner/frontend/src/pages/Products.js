import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import toast from 'react-hot-toast';
import ProductForm from '../components/products/ProductForm';
import ProductCostBreakdown from '../components/products/ProductCostBreakdown';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      toast.error('Napaka pri nalaganju izdelkov');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data) => {
    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, data);
        toast.success('Izdelek uspešno posodobljen');
      } else {
        await productsAPI.create(data);
        toast.success('Izdelek uspešno dodan');
      }
      loadProducts();
      setShowForm(false);
      setEditingProduct(null);
    } catch (error) {
      toast.error('Napaka pri shranjevanju izdelka');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Ali ste prepričani, da želite izbrisati ta izdelek?')) {
      try {
        await productsAPI.delete(id);
        toast.success('Izdelek uspešno izbrisan');
        loadProducts();
      } catch (error) {
        toast.error('Napaka pri brisanju izdelka');
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
          <h1 className="text-2xl font-bold text-gray-900">Izdelki</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upravljanje izdelkov in njihovih stroškov
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Dodaj izdelek
        </button>
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {products.map((product) => (
            <li key={product.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">📦</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Enota: {product.unit} | Kategorija: {product.category}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Stroški
                    </button>
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setShowForm(true);
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Uredi
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Izbriši
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {selectedProduct && (
        <ProductCostBreakdown
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default Products;