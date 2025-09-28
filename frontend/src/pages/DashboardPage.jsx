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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [manualOrder, setManualOrder] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    products: [],
    totalPrice: 0,
    status: 'PENDIENTE',
    notes: ''
  });
  const [availableProducts, setAvailableProducts] = useState([]);

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
      await fetchProducts();
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tenant:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products for manual order creation
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const products = await response.json();
        setAvailableProducts(products.filter(p => p.available));
      }
    } catch (err) {
      console.error('Error fetching products:', err);
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

  // Upgrade subscription - show modal
  const handleSubscriptionUpgrade = (planSlug) => {
    const plan = subscriptionPlans.find(p => p.slug === planSlug);
    if (plan) {
      setSelectedPlan(plan);
      setShowUpgradeModal(true);
    }
  };

  // Process payment and upgrade
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planSlug: selectedPlan.slug,
          paymentMethod: 'CARD',
          paymentInfo: paymentInfo
        })
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.message || result.error || 'Error al procesar el pago';
        alert(`Error: ${errorMessage}`);
        return;
      }

      alert(`¡Suscripción ${result.plan.name} activada exitosamente!\n\nPrecio: $${result.plan.price}/mes\nMétodo de pago: Tarjeta de Crédito`);
      
      // Close modal and refresh
      setShowUpgradeModal(false);
      setPaymentInfo({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
      await fetchTenantInfo();
    } catch (err) {
      console.error('Payment error:', err);
      alert(`Error de conexión: ${err.message}`);
    }
  };

  // Manual order functions
  const addProductToOrder = (product) => {
    const existingProduct = manualOrder.products.find(p => p.id === product.id);
    if (existingProduct) {
      setManualOrder({
        ...manualOrder,
        products: manualOrder.products.map(p => 
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        )
      });
    } else {
      setManualOrder({
        ...manualOrder,
        products: [...manualOrder.products, { ...product, quantity: 1 }]
      });
    }
    calculateTotal();
  };

  const removeProductFromOrder = (productId) => {
    setManualOrder({
      ...manualOrder,
      products: manualOrder.products.filter(p => p.id !== productId)
    });
    calculateTotal();
  };

  const updateProductQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeProductFromOrder(productId);
    } else {
      setManualOrder({
        ...manualOrder,
        products: manualOrder.products.map(p => 
          p.id === productId ? { ...p, quantity } : p
        )
      });
    }
    calculateTotal();
  };

  const calculateTotal = () => {
    const total = manualOrder.products.reduce((sum, product) => 
      sum + (product.price * product.quantity), 0
    );
    setManualOrder({ ...manualOrder, totalPrice: total });
  };

  const createManualOrder = async (e) => {
    e.preventDefault();
    
    if (manualOrder.products.length === 0) {
      alert('Debes agregar al menos un producto al pedido');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName: manualOrder.customerName,
          customerPhone: manualOrder.customerPhone,
          customerEmail: manualOrder.customerEmail,
          customerAddress: manualOrder.customerAddress,
          items: manualOrder.products.map(p => ({
            productId: p.id,
            name: p.name,
            qty: p.quantity,
            price: p.price
          })),
          totalPrice: manualOrder.totalPrice,
          status: manualOrder.status,
          notes: manualOrder.notes
        })
      });

      if (response.ok) {
        alert('Pedido creado exitosamente');
        setShowManualOrderModal(false);
        setManualOrder({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          customerAddress: '',
          products: [],
          totalPrice: 0,
          status: 'PENDIENTE',
          notes: ''
        });
        await fetchOrders();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'No se pudo crear el pedido'}`);
      }
    } catch (err) {
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

            {/* Manual Order Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowManualOrderModal(true)}
                className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 hover:from-pink-500 hover:via-rose-500 hover:to-orange-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Crear Pedido Manual</span>
              </button>
            </div>

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

            {/* Available Plans - Vertical Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Planes Disponibles</h3>
              
              {subscriptionPlans.map((plan) => (
                <div key={plan.id} className={`bg-white rounded-xl p-6 border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                  business?.subscriptionPlan === plan.slug 
                    ? 'border-green-400 bg-green-50 shadow-md' 
                    : plan.popular
                    ? 'border-pink-300 bg-gradient-to-r from-pink-50 to-rose-50 hover:border-pink-400'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-xl font-semibold text-gray-900">{plan.name}</h4>
                        {plan.popular && (
                          <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1 text-sm font-medium rounded-full">
                            Más Popular
                          </span>
                        )}
                        {business?.subscriptionPlan === plan.slug && (
                          <span className="bg-green-500 text-white px-3 py-1 text-sm font-medium rounded-full">
                            Plan Actual
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-gray-900">
                          ${plan.price}
                          <span className="text-lg font-normal text-gray-600">/{plan.interval}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {plan.features?.slice(0, 3).join(' • ')}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleSubscriptionUpgrade(plan.slug)}
                      disabled={business?.subscriptionPlan === plan.slug}
                      className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
                        business?.subscriptionPlan === plan.slug
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : plan.popular
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg hover:shadow-xl'
                          : 'bg-gray-600 hover:bg-gray-700 text-white shadow-md hover:shadow-lg'
                      }`}
                    >
                      {business?.subscriptionPlan === plan.slug ? 'Plan Actual' : 'Cambiar Plan'}
                    </button>
                  </div>
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
                  Los pagos se procesan de forma segura con encriptación SSL.
                </p>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Actualizar Plan
                </h3>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Plan Info */}
              {selectedPlan && (
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 mb-6 border border-pink-200">
                  <h4 className="font-semibold text-gray-900 text-lg">{selectedPlan.name}</h4>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    ${selectedPlan.price}
                    <span className="text-lg font-normal text-gray-600">/{selectedPlan.interval}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedPlan.features?.slice(0, 3).join(' • ')}
                  </p>
                </div>
              )}

              {/* Payment Form */}
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Titular
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.cardholderName}
                    onChange={(e) => setPaymentInfo({...paymentInfo, cardholderName: e.target.value})}
                    placeholder="Juan Pérez"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Tarjeta
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.cardNumber}
                    onChange={(e) => setPaymentInfo({...paymentInfo, cardNumber: e.target.value})}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    maxLength="19"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Vencimiento
                    </label>
                    <input
                      type="text"
                      value={paymentInfo.expiryDate}
                      onChange={(e) => setPaymentInfo({...paymentInfo, expiryDate: e.target.value})}
                      placeholder="MM/AA"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      maxLength="5"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={paymentInfo.cvv}
                      onChange={(e) => setPaymentInfo({...paymentInfo, cvv: e.target.value})}
                      placeholder="123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      maxLength="4"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Confirmar Pago
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(false)}
                    className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>

              {/* Security Notice */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-sm text-blue-800">
                    Tu información de pago está protegida con encriptación SSL
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Order Modal */}
      {showManualOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Crear Pedido Manual
                </h3>
                <button
                  onClick={() => setShowManualOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={createManualOrder} className="space-y-6">
                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Información del Cliente</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={manualOrder.customerName}
                        onChange={(e) => setManualOrder({...manualOrder, customerName: e.target.value})}
                        placeholder="Ej: Juan Pérez"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={manualOrder.customerPhone}
                        onChange={(e) => setManualOrder({...manualOrder, customerPhone: e.target.value})}
                        placeholder="Ej: +1234567890"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={manualOrder.customerEmail}
                        onChange={(e) => setManualOrder({...manualOrder, customerEmail: e.target.value})}
                        placeholder="Ej: juan@email.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={manualOrder.customerAddress}
                        onChange={(e) => setManualOrder({...manualOrder, customerAddress: e.target.value})}
                        placeholder="Ej: Calle 123, Ciudad"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Order Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Estado del Pedido</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'].map((status) => (
                      <label key={status} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value={status}
                          checked={manualOrder.status === status}
                          onChange={(e) => setManualOrder({...manualOrder, status: e.target.value})}
                          className="text-pink-600 focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {status.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Products Selection */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Productos Disponibles</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {availableProducts.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:border-pink-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{product.name}</h5>
                          <span className="text-sm font-semibold text-pink-600">${product.price}</span>
                        </div>
                        {product.description && (
                          <p className="text-xs text-gray-500 mb-3 italic">{product.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {product.trackStock ? `Stock: ${product.stock}` : 'Sin control de stock'}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => addProductToOrder(product)}
                              className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 text-xs font-medium rounded transition-colors"
                            >
                              Agregar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                {manualOrder.products.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Resumen del Pedido</h4>
                    <div className="space-y-3">
                      {manualOrder.products.map((product) => (
                        <div key={product.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">{product.name}</span>
                              <p className="text-xs text-gray-500">${product.price} c/u</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => updateProductQuantity(product.id, product.quantity - 1)}
                                className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium"
                              >
                                -
                              </button>
                              <span className="w-12 text-center font-medium">{product.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateProductQuantity(product.id, product.quantity + 1)}
                                className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm font-semibold text-gray-900 min-w-[80px] text-right">
                              ${(product.price * product.quantity).toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeProductFromOrder(product.id)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 mt-4 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total:</span>
                        <span className="text-2xl font-bold text-pink-600">
                          ${manualOrder.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas Adicionales
                  </label>
                  <textarea
                    value={manualOrder.notes}
                    onChange={(e) => setManualOrder({...manualOrder, notes: e.target.value})}
                    placeholder="Instrucciones especiales, alergias, preferencias, etc."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Crear Pedido
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManualOrderModal(false)}
                    className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
