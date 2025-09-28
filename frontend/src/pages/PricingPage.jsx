import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const PricingPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem('pricing_plans');
    if (cached) {
      try {
        setPlans(JSON.parse(cached));
        setLoading(false);
        // refresh in background
        fetchPlans(true);
        return;
      } catch (_) {}
    }
    fetchPlans(false);
  }, []);

  const fetchPlans = async (silent = false) => {
    try {
      const response = await fetch('/api/subscription-plans');
      const data = await response.json();
      setPlans(data);
      sessionStorage.setItem('pricing_plans', JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Redirect to login
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan_id: planId })
      });

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center relative">
        {/* Dotted Grid Background */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, #9ca3af 1px, transparent 1px)`,
            backgroundSize: '12px 12px',
            backgroundPosition: '0 0, 6px 6px'
          }}></div>
        </div>
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Dotted Grid Background - Only for Hero Section */}
      <div className="absolute top-0 left-0 right-0 opacity-50" style={{ height: '80vh' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, #9ca3af 1px, transparent 1px)`,
          backgroundSize: '12px 12px',
          backgroundPosition: '0 0, 6px 6px'
        }}></div>
      </div>

      {/* Header */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white bg-opacity-20 backdrop-blur-md rounded-2xl shadow-xl border border-white border-opacity-30 w-[70%]">
        <div className="px-8 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-light text-gray-900">ABA</h1>
            
            {/* Center Navigation */}
            <div className="flex items-center space-x-6">
              <a href="#pricing" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Precios</a>
              <a href="#about" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Nosotros</a>
              <a href="#faq" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">FAQ</a>
            </div>
            
                    {/* Right side buttons */}
                    <div className="flex items-center space-x-3">
                      <Link to="/login" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Iniciar Sesión</Link>
                      <Link to="/register" className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 hover:from-pink-500 hover:via-rose-500 hover:to-orange-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg">Registrarse</Link>
                    </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 pt-32 pb-32 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Text */}
            <div className="text-left">
              <h2 className="text-6xl font-light text-gray-900 mb-8 leading-tight">
                Automatiza tus pedidos por WhatsApp con{' '}
                <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 bg-clip-text text-transparent font-medium">
                  ABA IA
                </span>
              </h2>
              <p className="text-lg text-gray-600 mb-12 leading-relaxed">Recibe pedidos 24/7, procesa con inteligencia artificial y gestiona desde tu dashboard</p>
            </div>
            
            {/* Right side - Phone Mockup */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Phone Frame */}
                <div className="w-64 h-[520px] bg-gray-800 rounded-[2.5rem] p-1.5 shadow-2xl">
                  <div className="w-full h-full bg-gray-900 rounded-[2rem] overflow-hidden relative">
                    {/* Screen */}
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-gray-100">
                      {/* Status Bar */}
                      <div className="flex justify-between items-center px-4 pt-2 pb-1 text-gray-800 text-xs">
                        <span className="font-semibold">9:41</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-1.5 bg-gray-800 rounded-sm"></div>
                          <div className="w-3 h-1.5 bg-gray-800 rounded-sm"></div>
                          <div className="w-3 h-1.5 bg-gray-800 rounded-sm"></div>
                        </div>
                      </div>
                      
                      {/* App Header */}
                      <div className="bg-white px-3 py-2 flex items-center border-b border-gray-200">
                        <div className="w-6 h-6 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full flex items-center justify-center mr-2">
                          <span className="text-white text-xs font-bold">ABA</span>
                        </div>
                        <div>
                          <div className="text-gray-800 text-xs font-semibold">ABA AI Agent</div>
                          <div className="text-gray-500 text-xs">online</div>
                        </div>
                      </div>
                      
                      {/* Messages */}
                      <div className="px-3 py-3 space-y-2 h-[320px] overflow-y-auto">
                        <div className="flex justify-start">
                          <div className="bg-gray-100 rounded-2xl rounded-bl-md px-3 py-2 max-w-[75%]">
                            <p className="text-gray-700 text-xs">¡Hola! Soy ABA, tu asistente de pedidos. ¿Qué te gustaría ordenar hoy?</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <div className="bg-gradient-to-r from-pink-400 to-orange-400 rounded-2xl rounded-br-md px-3 py-2 max-w-[75%]">
                            <p className="text-white text-xs">Quiero una pizza margherita</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-start">
                          <div className="bg-gray-100 rounded-2xl rounded-bl-md px-3 py-2 max-w-[75%]">
                            <p className="text-gray-700 text-xs">¡Perfecto! Una pizza margherita. ¿Algún tamaño específico?</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <div className="bg-gradient-to-r from-pink-400 to-orange-400 rounded-2xl rounded-br-md px-3 py-2 max-w-[75%]">
                            <p className="text-white text-xs">Mediana por favor</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-start">
                          <div className="bg-gray-100 rounded-2xl rounded-bl-md px-3 py-2 max-w-[75%]">
                            <p className="text-gray-700 text-xs">Excelente! Total: $15. ¿Confirmas el pedido?</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Input Area */}
                      <div className="absolute bottom-0 left-0 right-0 bg-white px-3 py-2 border-t border-gray-200">
                        <div className="flex items-center bg-gray-100 rounded-full px-3 py-1.5">
                          <span className="text-gray-500 text-xs">Escribe un mensaje...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Home Button */}
                <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-gray-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Features Carousel */}
      <div className="relative z-10 py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-light text-gray-800 mb-4">
              ¿Cómo funciona ABA?
            </h3>
            <p className="text-gray-600">
              Descubre cómo automatizamos tus pedidos por WhatsApp
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-2xl shadow-xl border border-white border-opacity-30 p-8 text-center hover:bg-opacity-80 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 className="text-xl font-medium text-gray-800 mb-4">
                Conecta WhatsApp
              </h4>
              <p className="text-gray-600">
                Conecta tu número de WhatsApp Business y ABA comenzará a recibir mensajes automáticamente
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-2xl shadow-xl border border-white border-opacity-30 p-8 text-center hover:bg-opacity-80 transition-all duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="text-xl font-medium text-gray-800 mb-4">
                IA Procesa Pedidos
              </h4>
              <p className="text-gray-600">
                Nuestra inteligencia artificial entiende los pedidos, confirma detalles y calcula precios automáticamente
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-2xl shadow-xl border border-white border-opacity-30 p-8 text-center hover:bg-opacity-80 transition-all duration-300">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-xl font-medium text-gray-800 mb-4">
                Gestiona Dashboard
              </h4>
              <p className="text-gray-600">
                Ve todos los pedidos, actualiza estados y analiza estadísticas desde tu dashboard web
              </p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white bg-opacity-40 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-100 to-orange-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h5 className="text-lg font-medium text-gray-800">Disponible 24/7</h5>
              </div>
              <p className="text-gray-600">Tu bot nunca duerme, siempre está listo para recibir pedidos</p>
            </div>

            <div className="bg-white bg-opacity-40 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h5 className="text-lg font-medium text-gray-800">Configuración Rápida</h5>
              </div>
              <p className="text-gray-600">En solo 5 minutos tendrás tu bot funcionando</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-light text-gray-800 mb-6">
            Elige tu plan
          </h3>
          <p className="text-xl text-gray-600">
            Todos los planes incluyen período de prueba de 14 días
          </p>
        </div>

        <div className="space-y-1">
          {plans.map((plan) => (
            <div key={plan.id} className={`flex items-center justify-between py-2 px-4 rounded text-sm ${
              plan.slug === 'professional' 
                ? 'bg-pink-50 border-l-2 border-pink-400' 
                : 'bg-gray-50 hover:bg-gray-100'
            }`}>
              <div className="flex items-center space-x-4">
                <span className="font-medium text-gray-800">{plan.name}</span>
                {plan.slug === 'professional' && (
                  <span className="text-xs bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded">
                    Pop
                  </span>
                )}
                <span className="text-gray-500">${plan.price_monthly}/mes</span>
                <span className="text-xs text-gray-400">
                  {plan.orders_limit ? `${plan.orders_limit} pedidos` : 'Ilimitados'}
                </span>
              </div>
              
              <button
                onClick={() => handleSubscribe(plan.id)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  plan.slug === 'professional'
                    ? 'bg-pink-500 hover:bg-pink-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                }`}
              >
                {plan.slug === 'starter' ? 'Gratis' : 'Suscribirse'}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-light text-gray-800 mb-4">
              Preguntas Frecuentes
            </h3>
          </div>
          
          <div className="space-y-2">
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-4 border border-gray-200 hover:bg-opacity-95 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">¿Cómo funciona el período de prueba?</h4>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-pink-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-4 border border-gray-200 hover:bg-opacity-95 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">¿Puedo cambiar de plan?</h4>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-pink-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-4 border border-gray-200 hover:bg-opacity-95 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">¿Qué pasa si excedo el límite?</h4>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-pink-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-4 border border-gray-200 hover:bg-opacity-95 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">¿Ofrecen soporte técnico?</h4>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-pink-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-4 border border-gray-200 hover:bg-opacity-95 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">¿Cómo se conecta a mi WhatsApp?</h4>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-pink-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-4 border border-gray-200 hover:bg-opacity-95 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">¿Puedo cancelar en cualquier momento?</h4>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-pink-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-4 border border-gray-200 hover:bg-opacity-95 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">¿Los datos están seguros?</h4>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-pink-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 bg-white bg-opacity-80 backdrop-blur-sm py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-light text-gray-900 mb-4">¿Listo para automatizar tus pedidos?</h3>
          <p className="text-gray-600 mb-8">Únete a cientos de negocios que ya automatizaron sus pedidos por WhatsApp</p>
          <Link to="/register" className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 hover:from-pink-500 hover:via-rose-500 hover:to-orange-500 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg">Comenzar Prueba Gratis</Link>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
