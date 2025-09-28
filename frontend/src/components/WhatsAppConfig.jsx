import React, { useState, useEffect } from 'react';

const WhatsAppConfig = ({ onConfigUpdate }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentConfig, setCurrentConfig] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Load current configuration
  useEffect(() => {
    fetchCurrentConfig();
  }, []);

  const fetchCurrentConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tenants/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const whatsappConfig = JSON.parse(data.whatsappConfig || '{}');
        setCurrentConfig(whatsappConfig);
        
        if (whatsappConfig.connected) {
          setPhoneNumber(whatsappConfig.phoneNumber || '');
          setBusinessName(whatsappConfig.businessName || '');
          setPhoneNumberId(whatsappConfig.phoneNumberId || '');
          setAccessToken(whatsappConfig.accessToken || '');
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          businessName: businessName
        })
      });

      const result = await response.json();

      if (response.ok) {
        // If API tokens are provided, configure them too
        if (phoneNumberId && accessToken) {
          const configResponse = await fetch('/api/whatsapp/configure', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              phoneNumberId: phoneNumberId,
              accessToken: accessToken
            })
          });

          if (configResponse.ok) {
            setMessage('WhatsApp conectado y API configurada exitosamente!');
          } else {
            setMessage('WhatsApp conectado, pero error configurando API');
          }
        } else {
          setMessage('WhatsApp conectado exitosamente!');
        }
        
        setPhoneNumber('');
        setBusinessName('');
        setPhoneNumberId('');
        setAccessToken('');
        fetchCurrentConfig();
        if (onConfigUpdate) onConfigUpdate();
      } else {
        setMessage(`❌ Error: ${result.message || result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error de conexión: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureAPI = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/whatsapp/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phoneNumberId: phoneNumberId,
          accessToken: accessToken
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('✅ API de WhatsApp configurada exitosamente!');
        setPhoneNumberId('');
        setAccessToken('');
        fetchCurrentConfig();
        if (onConfigUpdate) onConfigUpdate();
      } else {
        setMessage(`❌ Error: ${result.message || result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error de conexión: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de que quieres desconectar WhatsApp?')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('✅ WhatsApp desconectado exitosamente');
        setCurrentConfig(null);
        setPhoneNumber('');
        setBusinessName('');
        setPhoneNumberId('');
        setAccessToken('');
        setIsEditing(false);
        fetchCurrentConfig();
        if (onConfigUpdate) onConfigUpdate();
      } else {
        setMessage(`❌ Error: ${result.message || result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error de conexión: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          businessName: businessName
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('✅ Configuración actualizada exitosamente!');
        setIsEditing(false);
        fetchCurrentConfig();
        if (onConfigUpdate) onConfigUpdate();
      } else {
        setMessage(`❌ Error: ${result.message || result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error de conexión: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-80 backdrop-blur-sm shadow-lg rounded-2xl border border-white border-opacity-20 p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-light text-gray-900">
          WhatsApp Business
        </h3>
        {currentConfig?.connected && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isEditing ? 'Cancelar' : 'Editar'}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Desconectar
            </button>
          </div>
        )}
      </div>
      
      <div className="space-y-6">
        {/* Estado Actual */}
        {currentConfig?.connected ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <h4 className="font-medium text-green-900 mb-3">WhatsApp Conectado</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-green-800">Número:</span>
                  <span className="ml-2 text-green-700">{currentConfig.phoneNumber}</span>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Editar número"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-green-800">Negocio:</span>
                  <span className="ml-2 text-green-700">{currentConfig.businessName}</span>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Editar nombre"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              <div>
                <span className="font-medium text-green-800">API:</span>
                <span className="ml-2 text-green-700">
                  {currentConfig.phoneNumberId ? 'Configurada' : 'No configurada'}
                </span>
              </div>
              <div>
                <span className="font-medium text-green-800">Estado:</span>
                <span className="ml-2 text-green-700">Activo</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Formulario Unificado */}
        {(!currentConfig?.connected || isEditing) && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Configuración de WhatsApp</h4>
              <p className="text-sm text-blue-800 mb-4">
                Configura tu número de WhatsApp y la API para enviar mensajes automáticamente.
              </p>
            </div>

            <form onSubmit={currentConfig?.connected ? handleUpdate : handleConnect} className="space-y-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900">Información Básica</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de WhatsApp *
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Ej: +5492235500594"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Negocio *
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Ej: Mi Cafetería"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Configuración de API */}
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900">Configuración de API</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number ID
                    </label>
                    <input
                      type="text"
                      value={phoneNumberId}
                      onChange={(e) => setPhoneNumberId(e.target.value)}
                      placeholder="123456789012345"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Access Token
                    </label>
                    <input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="EAAxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 hover:from-pink-500 hover:via-rose-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg w-full"
              >
                {loading ? (currentConfig?.connected ? 'Actualizando...' : 'Conectando...') : (currentConfig?.connected ? 'Actualizar Configuración' : 'Conectar WhatsApp')}
              </button>
              
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-2">Para enviar mensajes reales, configura la API de Meta WhatsApp Business.</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Ve a Meta for Developers</p>
                  <p>• Crea una app de WhatsApp Business</p>
                  <p>• Obtén tu Phone Number ID y Access Token</p>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Mensaje de resultado */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

      </div>
    </div>
  );
};

export default WhatsAppConfig;
