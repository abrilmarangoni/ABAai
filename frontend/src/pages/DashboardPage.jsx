import React, { useState, useEffect } from 'react';
import OrdersTable from '../components/OrdersTable';
import OrderStats from '../components/OrderStats';
import ProductsManager from '../components/ProductsManager';
import WhatsAppConfig from '../components/WhatsAppConfig';
// BusinessConfig component removed - using new backend structure

const DashboardPage = ({ user, onLogout }) => {
  const [business, setBusiness] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [whatsappConfig, setWhatsappConfig] = useState({
    phoneNumber: '',
    businessName: ''
  });
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Fetch tenant info
  const fetchTenantInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tenants/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar información del negocio');
      }

      const tenantData = await response.json();
      setBusiness(tenantData);
      await fetchOrders();
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tenant:', err);
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
    fetchTenantInfo();
    fetchSubscriptionPlans();
    
    // Refresh orders every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch subscription plans
  const fetchSubscriptionPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans');
      if (response.ok) {
        const plans = await response.json();
        setSubscriptionPlans(plans);
      }
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
    }
  };

  // Connect WhatsApp
  const handleWhatsAppConnect = async () => {
    try {
      // Validate input
      if (!whatsappConfig.phoneNumber.trim()) {
        alert('Por favor ingresa tu número de WhatsApp');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(whatsappConfig)
      });

      const result = await response.json();

      if (!response.ok) {
        // Show specific error message
        const errorMessage = result.message || result.error || 'Error al conectar WhatsApp';
        alert(`Error: ${errorMessage}`);
        return;
      }

      alert(`¡WhatsApp conectado exitosamente!\n\nNúmero: ${result.phoneNumber}\nWebhook: ${result.webhookUrl}`);
      
      // Clear form
      setWhatsappConfig({ phoneNumber: '', businessName: '' });
      
      // Refresh business info
      await fetchTenantInfo();
    } catch (err) {
      console.error('WhatsApp connect error:', err);
      alert(`Error de conexión: ${err.message}`);
    }
  };

  // Upgrade subscription
  const handleSubscriptionUpgrade = async (planSlug) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planSlug: planSlug,
          paymentMethod: 'CARD'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.message || result.error || 'Error al actualizar suscripción';
        alert(`Error: ${errorMessage}`);
        return;
      }

      alert(`¡Suscripción ${result.plan.name} activada exitosamente!\n\nPrecio: $${result.plan.price}/mes\nMétodo de pago: ${result.paymentMethod}`);
      
      // Refresh business info
      await fetchTenantInfo();
    } catch (err) {
      console.error('Subscription upgrade error:', err);
      alert(`Error de conexión: ${err.message}`);
    }
  };

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
              onClick={() => setActiveTab('products')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'products'
                  ? 'bg-gradient-to-r from-pink-400 to-orange-400 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Productos
            </button>
            
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'whatsapp'
                  ? 'bg-gradient-to-r from-pink-400 to-orange-400 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              WhatsApp
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

                {activeTab === 'products' && (
                  <ProductsManager onProductAdded={() => fetchTenantInfo()} />
                )}

                {activeTab === 'whatsapp' && (
                  <WhatsAppConfig onConfigUpdate={() => fetchTenantInfo()} />
                )}

                {activeTab === 'config' && (
                  <div className="bg-white bg-opacity-80 backdrop-blur-sm shadow-lg rounded-2xl border border-white border-opacity-20 p-8">
                    <h3 className="text-xl font-light text-gray-900 mb-6">
                      Configuración del Negocio
                    </h3>
                    
                    {/* Business Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-30">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-800 mb-2">Nombre del Negocio</h4>
                            <p className="text-gray-600">{business?.name || 'No configurado'}</p>
                          </div>
                          <button
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar nombre del negocio"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-30">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-800 mb-2">WhatsApp</h4>
                            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                              business?.whatsappConnected 
                                ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
                                : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                            }`}>
                              {business?.whatsappConnected ? 'Conectado' : 'No conectado'}
                            </span>
                            {business?.whatsappPhoneNumber && (
                              <p className="text-sm text-gray-600 mt-1">{business.whatsappPhoneNumber}</p>
                            )}
                          </div>
                          <button
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Configurar WhatsApp"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp Configuration */}
                    {!business?.whatsappConnected && (
                      <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-30 mb-6">
                        <h4 className="font-medium text-gray-800 mb-4">Conectar WhatsApp</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Número de WhatsApp
                            </label>
                            <input
                              type="tel"
                              value={whatsappConfig.phoneNumber}
                              onChange={(e) => setWhatsappConfig({...whatsappConfig, phoneNumber: e.target.value})}
                              placeholder="549111234567 o +549111234567"
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nombre del Negocio
                            </label>
                            <input
                              type="text"
                              value={whatsappConfig.businessName}
                              onChange={(e) => setWhatsappConfig({...whatsappConfig, businessName: e.target.value})}
                              placeholder={business?.name || 'Mi Negocio'}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                            />
                          </div>
                          <button
                            onClick={handleWhatsAppConnect}
                            disabled={!whatsappConfig.phoneNumber}
                            className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 hover:from-pink-500 hover:via-rose-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg"
                          >
                            Conectar WhatsApp
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Subscription Info - Subtle */}
                    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span className="text-sm text-gray-600">
                          Plan {business?.subscriptionPlan || 'Starter'}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          {business?.subscriptionStatus === 'active' ? 'Activa' : 'Prueba Gratis'}
                        </span>
                      </div>
                      <button 
                        onClick={() => setActiveTab('subscription')}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                )}

        {activeTab === 'subscription' && (
          <div className="space-y-6">
            {/* Current Subscription - Subtle */}
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-800">Plan Actual</h4>
                  <p className="text-sm text-gray-600">
                    {business?.subscriptionPlan || 'Starter'} • {business?.subscriptionStatus === 'active' ? 'Activa' : 'Prueba Gratis'}
                  </p>
                </div>
              </div>
            </div>

            {/* Available Plans - Tiny Lines */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Planes</h3>
              
              {subscriptionPlans.map((plan) => (
                <div key={plan.id} className={`flex items-center justify-between py-2 px-3 rounded text-xs ${
                  business?.subscriptionPlan === plan.slug 
                    ? 'bg-green-50 border-l-2 border-green-400' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}>
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-800">{plan.name}</span>
                    {plan.popular && (
                      <span className="text-xs bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded">
                        Pop
                      </span>
                    )}
                    <span className="text-gray-500">${plan.price}/{plan.interval}</span>
                  </div>
                  
                  <button
                    onClick={() => handleSubscriptionUpgrade(plan.slug)}
                    disabled={business?.subscriptionPlan === plan.slug}
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                      business?.subscriptionPlan === plan.slug
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-pink-500 hover:bg-pink-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                    }`}
                  >
                    {business?.subscriptionPlan === plan.slug ? '✓' : 'Cambiar'}
                  </button>
                </div>
              ))}
            </div>

            {/* Payment Info - Subtle */}
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-400">
              <h4 className="font-medium text-gray-800 mb-2">Información de Pago</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Método: Tarjeta de Crédito/Débito</p>
                <p>Facturación: Mensual</p>
                <p className="text-xs text-gray-500 mt-2">
                  Los pagos se procesan de forma segura a través de MercadoPago.
                </p>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
