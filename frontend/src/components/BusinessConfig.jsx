import React, { useState } from 'react';

const BusinessConfig = ({ business, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: business?.name || '',
    whatsapp_number: business?.whatsapp_number || '',
    twilio_account_sid: business?.twilio_account_sid || '',
    twilio_auth_token: business?.twilio_auth_token || '',
    twilio_whatsapp_number: business?.twilio_whatsapp_number || '',
    openai_api_key: business?.openai_api_key || '',
    menu_config: business?.menu_config || {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/business', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la configuración');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onUpdate();
      }, 2000);

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

  const addMenuItem = () => {
    const newItem = {
      name: '',
      price: 0,
      variants: []
    };
    
    setFormData({
      ...formData,
      menu_config: {
        ...formData.menu_config,
        [`item_${Date.now()}`]: newItem
      }
    });
  };

  const updateMenuItem = (key, field, value) => {
    setFormData({
      ...formData,
      menu_config: {
        ...formData.menu_config,
        [key]: {
          ...formData.menu_config[key],
          [field]: value
        }
      }
    });
  };

  const removeMenuItem = (key) => {
    const newMenuConfig = { ...formData.menu_config };
    delete newMenuConfig[key];
    setFormData({
      ...formData,
      menu_config: newMenuConfig
    });
  };

  return (
    <div className="space-y-6">
      {/* Business Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          📋 Información del Negocio
        </h3>
        
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3">
            <div className="text-sm text-green-600">✅ Configuración actualizada exitosamente</div>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre del Negocio
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Café Central"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Número de WhatsApp
              </label>
              <input
                type="tel"
                name="whatsapp_number"
                value={formData.whatsapp_number}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1234567890"
              />
            </div>
          </div>

          {/* Twilio Configuration */}
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Configuración de Twilio WhatsApp
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Twilio Account SID
                </label>
                <input
                  type="text"
                  name="twilio_account_sid"
                  value={formData.twilio_account_sid}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Twilio Auth Token
                </label>
                <input
                  type="password"
                  name="twilio_auth_token"
                  value={formData.twilio_auth_token}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••••••••••••••••••••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Twilio WhatsApp Number
                </label>
                <input
                  type="text"
                  name="twilio_whatsapp_number"
                  value={formData.twilio_whatsapp_number}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="whatsapp:+14155238886"
                />
              </div>
            </div>
          </div>

          {/* OpenAI Configuration */}
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              🤖 Configuración de OpenAI
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                OpenAI API Key
              </label>
              <input
                type="password"
                name="openai_api_key"
                value={formData.openai_api_key}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="sk-••••••••••••••••••••••••••••••••"
              />
              <p className="mt-1 text-xs text-gray-500">
                Obtén tu API key en <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">platform.openai.com</a>
              </p>
            </div>
          </div>

          {/* Menu Configuration */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium text-gray-900">
                🍽️ Configuración del Menú
              </h4>
              <button
                type="button"
                onClick={addMenuItem}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                + Agregar Producto
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(formData.menu_config).map(([key, item]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-medium text-gray-900">Producto</h5>
                    <button
                      type="button"
                      onClick={() => removeMenuItem(key)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => updateMenuItem(key, 'name', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Café"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Precio
                      </label>
                      <input
                        type="number"
                        value={item.price || 0}
                        onChange={(e) => updateMenuItem(key, 'price', parseInt(e.target.value))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Variantes (separadas por coma)
                      </label>
                      <input
                        type="text"
                        value={item.variants ? item.variants.join(', ') : ''}
                        onChange={(e) => updateMenuItem(key, 'variants', e.target.value.split(',').map(v => v.trim()).filter(v => v))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="americano, latte, cappuccino"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>

      {/* Webhook Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-blue-900 mb-2">
          🔗 Información del Webhook
        </h4>
        <p className="text-sm text-blue-800 mb-2">
          Configura este URL en tu cuenta de Twilio:
        </p>
        <code className="block bg-blue-100 p-2 rounded text-sm text-blue-900">
          {window.location.origin}/webhook/{business?.slug || 'tu-negocio'}
        </code>
        <p className="text-xs text-blue-700 mt-2">
          Este webhook recibirá todos los mensajes de WhatsApp dirigidos a tu negocio.
        </p>
      </div>
    </div>
  );
};

export default BusinessConfig;
