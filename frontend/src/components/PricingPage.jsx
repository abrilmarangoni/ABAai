import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const PricingPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
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
      window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, #9ca3af 1px, transparent 1px)`,
            backgroundSize: '12px 12px',
            backgroundPosition: '0 0, 6px 6px'
          }}></div>
        </div>
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Dotted Grid Background */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, #9ca3af 1px, transparent 1px)`,
          backgroundSize: '12px 12px',
          backgroundPosition: '0 0, 6px 6px'
        }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white bg-opacity-80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-light text-gray-900">ABA</h1>
            </div>
            <div className="flex space-x-4">
              <Link to="/login" className="text-gray-900 hover:text-gray-700 font-medium">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white bg-opacity-80 backdrop-blur-sm py-12 px-8 shadow-xl rounded-2xl border border-white border-opacity-20">
            <h2 className="text-4xl font-light text-gray-900 mb-4">
              Automatiza tus pedidos por WhatsApp con IA
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Recibe pedidos 24/7, procesa con inteligencia artificial y gestiona desde tu dashboard
            </p>
            <div className="flex justify-center space-x-4 flex-wrap gap-2">
              <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm">
                14 días gratis
              </span>
              <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm">
                Sin compromiso
              </span>
              <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm">
                Configuración en 5 minutos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-light text-gray-900 mb-4">
            Elige tu plan
          </h3>
          <p className="text-gray-600">
            Todos los planes incluyen período de prueba de 14 días
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-xl border border-white border-opacity-20 p-8 relative ${
              plan.slug === 'professional' ? 'ring-2 ring-blue-600 transform scale-105' : ''
            }`}>
              {plan.slug === 'professional' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Más Popular
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <h4 className="text-2xl font-light text-gray-900 mb-2">
                  {plan.name}
                </h4>
                <div className="mb-6">
                  <span className="text-4xl font-light text-gray-900">
                    ${plan.price_monthly}
                  </span>
                  <span className="text-gray-600">/mes</span>
                </div>
                
                <div className="mb-8">
                  {plan.orders_limit ? (
                    <span className="text-lg text-gray-600">
                      {plan.orders_limit} pedidos/mes
                    </span>
                  ) : (
                    <span className="text-lg text-gray-600">
                      Pedidos ilimitados
                    </span>
                  )}
                </div>

                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center">
                    <span className="text-blue-600 mr-3 font-bold">✓</span>
                    WhatsApp AI Bot
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-600 mr-3 font-bold">✓</span>
                    Dashboard web
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-600 mr-3 font-bold">✓</span>
                    Soporte por email
                  </li>
                  {plan.features.priority_support && (
                    <li className="flex items-center">
                      <span className="text-blue-600 mr-3 font-bold">✓</span>
                      Soporte prioritario
                    </li>
                  )}
                  {plan.features.advanced_analytics && (
                    <li className="flex items-center">
                      <span className="text-blue-600 mr-3 font-bold">✓</span>
                      Analytics avanzados
                    </li>
                  )}
                  {plan.features.api_access && (
                    <li className="flex items-center">
                      <span className="text-blue-600 mr-3 font-bold">✓</span>
                      Acceso a API
                    </li>
                  )}
                  {plan.features.white_label && (
                    <li className="flex items-center">
                      <span className="text-blue-600 mr-3 font-bold">✓</span>
                      White label
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  className="w-full py-3 px-6 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {plan.slug === 'starter' ? 'Comenzar Prueba Gratis' : 'Suscribirse'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-xl border border-white border-opacity-20 p-8">
          <h3 className="text-2xl font-light text-center mb-8 text-gray-900">
            Preguntas Frecuentes
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">¿Cómo funciona el período de prueba?</h4>
              <p className="text-gray-600">
                Tienes 14 días gratis para probar todas las funciones. No necesitas tarjeta de crédito.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">¿Puedo cambiar de plan?</h4>
              <p className="text-gray-600">
                Sí, puedes cambiar de plan en cualquier momento. Los cambios se aplican en el próximo ciclo de facturación.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">¿Qué pasa si excedo el límite?</h4>
              <p className="text-gray-600">
                Te notificaremos cuando te acerques al límite. Puedes actualizar tu plan o esperar al próximo mes.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">¿Ofrecen soporte técnico?</h4>
              <p className="text-gray-600">
                Sí, todos los planes incluyen soporte. Los planes superiores tienen soporte prioritario y 24/7.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative z-10 bg-white bg-opacity-80 backdrop-blur-sm py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-light text-gray-900 mb-4">
            ¿Listo para automatizar tus pedidos?
          </h3>
          <p className="text-gray-600 mb-8">
            Únete a cientos de negocios que ya automatizaron sus pedidos por WhatsApp
          </p>
          <button
            onClick={() => handleSubscribe(plans[0]?.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Comenzar Prueba Gratis
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;