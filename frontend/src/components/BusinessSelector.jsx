import React, { useState } from 'react';

const BusinessSelector = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    slug: '',
    whatsapp_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Login
        const response = await fetch('/api/businesses/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });

        if (!response.ok) {
          throw new Error('Credenciales inválidas');
        }

        const data = await response.json();
        onLogin(data.user, data.token);
      } else {
        // Register
        const response = await fetch('/api/businesses/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            slug: formData.slug,
            whatsapp_number: formData.whatsapp_number,
            email: formData.email,
            password: formData.password,
            menu_config: {
              "café": { "price": 1500, "variants": ["americano", "latte", "cappuccino"] },
              "sandwich": { "price": 3000, "variants": ["jamón", "pollo", "vegetariano"] }
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al registrar el negocio');
        }

        const data = await response.json();
        onLogin(data.user, 'dummy-token'); // In real app, you'd get a token
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            🤖 WhatsApp AI Ordering Bot
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? 'Inicia sesión en tu negocio' : 'Registra tu negocio'}
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          {/* Toggle Login/Register */}
          <div className="flex mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md ${
                isLogin
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md ${
                !isLogin
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Registrar Negocio
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nombre del Negocio
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Café Central"
                  />
                </div>

                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                    Identificador (URL)
                  </label>
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    required={!isLogin}
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="cafe-central"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Se usará en la URL del webhook: /webhook/{formData.slug || 'tu-negocio'}
                  </p>
                </div>

                <div>
                  <label htmlFor="whatsapp_number" className="block text-sm font-medium text-gray-700">
                    Número de WhatsApp
                  </label>
                  <input
                    id="whatsapp_number"
                    name="whatsapp_number"
                    type="tel"
                    required={!isLogin}
                    value={formData.whatsapp_number}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1234567890"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin@tunegocio.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isLogin ? 'Iniciando sesión...' : 'Registrando...'}
                  </div>
                ) : (
                  isLogin ? 'Iniciar Sesión' : 'Registrar Negocio'
                )}
              </button>
            </div>
          </form>

          {!isLogin && (
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                📋 Después del registro necesitarás:
              </h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Configurar Twilio WhatsApp API</li>
                <li>• Configurar OpenAI API Key</li>
                <li>• Personalizar el menú de productos</li>
                <li>• Configurar el webhook: /webhook/{formData.slug || 'tu-negocio'}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessSelector;
