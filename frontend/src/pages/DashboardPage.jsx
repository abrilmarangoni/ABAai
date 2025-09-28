import React, { useState, useEffect } from 'react';
import OrdersTable from '../components/OrdersTable';
import OrderStats from '../components/OrderStats';
import BusinessConfig from '../components/BusinessConfig';

const DashboardPage = ({ user, onLogout }) => {
  const [business, setBusiness] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');

  // Fetch business info
  const fetchBusinessInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/business', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar información del negocio');
      }

      const businessData = await response.json();
      setBusiness(businessData);
      await fetchOrders();
    } catch (err) {
      setError(err.message);
      console.error('Error fetching business:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders from backend API
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar los pedidos');
      }
      const data = await response.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching orders:', err);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el pedido');
      }

      // Refresh orders after update
      await fetchOrders();
    } catch (err) {
      setError(err.message);
      console.error('Error updating order:', err);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchBusinessInfo();
    
    // Refresh orders every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white bg-opacity-90 backdrop-blur-sm shadow-lg border-r border-gray-200">
        <div className="p-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light text-gray-800">ABA</h2>
          </div>
          
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-pink-400 to-orange-400 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Dashboard
            </button>
            
            <button
              onClick={() => setActiveTab('config')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'config'
                  ? 'bg-gradient-to-r from-pink-400 to-orange-400 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Settings
            </button>
            
            <button
              onClick={() => setActiveTab('subscription')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'subscription'
                  ? 'bg-gradient-to-r from-pink-400 to-orange-400 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Subscription
            </button>
            
            {/* Separator line */}
            <div className="border-t border-gray-200 my-4"></div>
            
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-300"
            >
              Exit
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white bg-opacity-80 backdrop-blur-sm shadow-sm border-b border-gray-200">
          <div className="px-6 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-light text-gray-900">
                  {business?.name || 'WhatsApp AI Ordering Bot'}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Dashboard de gestión de pedidos
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={fetchOrders}
                  className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 hover:from-pink-500 hover:via-rose-500 hover:to-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg"
                >
                  Actualizar
                </button>
                <div className="text-sm text-gray-500">
                  Última actualización: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-lg">!</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <>
            {/* Stats */}
            <OrderStats orders={orders} />

            {/* Orders Table */}
            <div className="mt-8">
              <OrdersTable 
                orders={orders} 
                onUpdateStatus={updateOrderStatus}
              />
            </div>
          </>
        )}

        {activeTab === 'config' && (
          <BusinessConfig business={business} onUpdate={fetchBusinessInfo} />
        )}

        {activeTab === 'subscription' && (
          <div className="bg-white bg-opacity-80 backdrop-blur-sm shadow-lg rounded-2xl border border-white border-opacity-20 p-8">
            <h3 className="text-xl font-light text-gray-900 mb-6">
              Información de Suscripción
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-30">
                <h4 className="font-medium text-gray-800 mb-2">Plan Actual</h4>
                <p className="text-gray-600">Starter - $29/mes</p>
              </div>
              <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-30">
                <h4 className="font-medium text-gray-800 mb-2">Estado</h4>
                <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-gradient-to-r from-green-100 to-green-200 text-green-800">
                  Activo
                </span>
              </div>
              <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-30">
                <h4 className="font-medium text-gray-800 mb-2">Pedidos Usados</h4>
                <p className="text-gray-600">45 / 100 pedidos este mes</p>
              </div>
              <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-30">
                <h4 className="font-medium text-gray-800 mb-2">Próxima Facturación</h4>
                <p className="text-gray-600">15 de enero, 2024</p>
              </div>
            </div>
            <div className="mt-8">
              <button className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 hover:from-pink-500 hover:via-rose-500 hover:to-orange-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg">
                Actualizar Plan
              </button>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
