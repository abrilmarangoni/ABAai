import React, { useState, useEffect } from 'react';

const ProductsManager = ({ onProductAdded }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    sku: '',
    available: true
  });

  // Fetch products
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        setLoading(false);
        return;
      }

      console.log('Fetching products with token:', token.substring(0, 20) + '...');
      
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Products response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Products fetched:', data);
        setProducts(data);
      } else {
        const errorData = await response.json();
        console.error('Error fetching products:', errorData);
        alert(`Error al cargar productos: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      alert(`Error de conexión: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
        return;
      }

      console.log('Adding product:', newProduct);
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProduct)
      });

      console.log('Add product response status:', response.status);

      if (response.ok) {
        const product = await response.json();
        console.log('Product added:', product);
        setProducts([product, ...products]);
        setNewProduct({ name: '', price: '', sku: '', available: true });
        setShowAddForm(false);
        if (onProductAdded) onProductAdded();
        alert('Producto agregado exitosamente');
      } else {
        const errorData = await response.json();
        console.error('Error adding product:', errorData);
        alert(`Error: ${errorData.error || errorData.message || 'No se pudo agregar el producto'}`);
      }
    } catch (err) {
      console.error('Error adding product:', err);
      alert(`Error de conexión: ${err.message}`);
    }
  };

  // Update product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
        return;
      }

      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingProduct)
      });

      if (response.ok) {
        const updatedProduct = await response.json();
        setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        setEditingProduct(null);
        alert('Producto actualizado exitosamente');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || errorData.message || 'No se pudo actualizar el producto'}`);
      }
    } catch (err) {
      alert(`Error de conexión: ${err.message}`);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
        return;
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId));
        alert('Producto eliminado exitosamente');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || errorData.message || 'No se pudo eliminar el producto'}`);
      }
    } catch (err) {
      alert(`Error de conexión: ${err.message}`);
    }
  };

  // Toggle product availability
  const handleToggleAvailability = async (product) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
        return;
      }

      const updatedProduct = { ...product, available: !product.available };
      
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedProduct)
      });

      if (response.ok) {
        const result = await response.json();
        setProducts(products.map(p => p.id === result.id ? result : p));
        alert(`Producto ${result.available ? 'disponible' : 'no disponible'}`);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || errorData.message || 'No se pudo actualizar el producto'}`);
      }
    } catch (err) {
      alert(`Error de conexión: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="bg-white bg-opacity-80 backdrop-blur-sm shadow-lg rounded-2xl border border-white border-opacity-20 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white bg-opacity-80 backdrop-blur-sm shadow-lg rounded-2xl border border-white border-opacity-20 p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-light text-gray-900">
          Gestión de Productos
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 hover:from-pink-500 hover:via-rose-500 hover:to-orange-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg"
        >
          {showAddForm ? 'Cancelar' : 'Agregar Producto'}
        </button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-30 mb-6">
          <h4 className="font-medium text-gray-800 mb-4">Nuevo Producto</h4>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="Ej: Café Americano"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  placeholder="Ej: 5.50"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU (Código)
              </label>
              <input
                type="text"
                value={newProduct.sku}
                onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                placeholder="Ej: CAFE-001"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="available"
                checked={newProduct.available}
                onChange={(e) => setNewProduct({...newProduct, available: e.target.checked})}
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label htmlFor="available" className="ml-2 block text-sm text-gray-700">
                Producto disponible
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 hover:from-pink-500 hover:via-rose-500 hover:to-orange-500 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg"
              >
                Agregar Producto
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium transition-all duration-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      <div className="space-y-4">
        {products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No tienes productos configurados</p>
            <p className="text-sm text-gray-500">
              Agrega productos para que ABA pueda procesar pedidos automáticamente
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {products.map((product, index) => (
              <div key={product.id}>
                <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-30">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-lg">{product.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        ${product.price} {product.sku && `• ${product.sku}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleAvailability(product)}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                          product.available 
                            ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 hover:from-green-200 hover:to-green-300'
                            : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 hover:from-red-200 hover:to-red-300'
                        }`}
                      >
                        {product.available ? 'Disponible' : 'No disponible'}
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar producto"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar producto"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {index < products.length - 1 && (
                  <div className="h-px bg-gray-200 mx-4 my-4"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Product Form */}
      {editingProduct && (
        <div className="mt-6 bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-30">
          <h4 className="font-medium text-gray-800 mb-4">Editar Producto</h4>
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU (Código)
              </label>
              <input
                type="text"
                value={editingProduct.sku}
                onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="edit-available"
                checked={editingProduct.available}
                onChange={(e) => setEditingProduct({...editingProduct, available: e.target.checked})}
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label htmlFor="edit-available" className="ml-2 block text-sm text-gray-700">
                Producto disponible
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 hover:from-pink-500 hover:via-rose-500 hover:to-orange-500 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg"
              >
                Actualizar Producto
              </button>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium transition-all duration-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Instructions */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Instrucciones para ABA IA</h4>
        <p className="text-sm text-blue-800 mb-3">
          ABA usará estos productos para procesar pedidos automáticamente. 
          Los clientes pueden pedir usando nombres similares o descripciones.
        </p>
        <div className="text-xs text-blue-700">
          <p><strong>Ejemplo:</strong> "Quiero 2 cafés americanos" → ABA reconocerá "Café Americano"</p>
          <p><strong>Tip:</strong> Usa nombres claros y comunes para mejor reconocimiento</p>
        </div>
      </div>
    </div>
  );
};

export default ProductsManager;
