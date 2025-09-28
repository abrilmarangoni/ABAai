import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RegisterPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    tenantName: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerFirstName: '',
    ownerLastName: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords match
    if (formData.ownerPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantName: formData.tenantName,
          ownerEmail: formData.ownerEmail,
          ownerPassword: formData.ownerPassword,
          ownerFirstName: formData.ownerFirstName,
          ownerLastName: formData.ownerLastName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar el negocio');
      }

      const data = await response.json();
      setSuccess(true);
      
      // Auto login after successful registration
      setTimeout(() => {
        onLogin(data.user, data.access_token);
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

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        {/* Dotted Grid Background */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              radial-gradient(circle, #9ca3af 1px, transparent 1px)
            `,
            backgroundSize: '12px 12px',
            backgroundPosition: '0 0, 6px 6px'
          }}></div>
        </div>
        <div className="max-w-md w-full space-y-8 relative z-10">
          {/* Success Message */}
          <div className="bg-white bg-opacity-80 backdrop-blur-sm py-8 px-6 shadow-xl rounded-2xl border border-white border-opacity-20 text-center">
            <h1 className="text-2xl font-light text-gray-900 mb-2">ABA</h1>
            <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <div className="w-6 h-6 bg-green-600 rounded"></div>
            </div>
            <h2 className="text-xl font-light text-gray-700 mb-2">
              Registro exitoso
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Tu negocio ha sido registrado. Redirigiendo al dashboard...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Dotted Grid Background */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle, #9ca3af 1px, transparent 1px)
          `,
          backgroundSize: '12px 12px',
          backgroundPosition: '0 0, 6px 6px'
        }}></div>
      </div>
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Glass Form Container */}
        <div className="bg-white bg-opacity-80 backdrop-blur-sm py-8 px-6 shadow-xl rounded-2xl border border-white border-opacity-20">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light text-gray-900 mb-2">ABA</h1>
            <h2 className="text-xl font-light text-gray-700">
              Crear cuenta
            </h2>
            <p className="text-sm text-gray-500">
              Comienza a recibir pedidos por WhatsApp
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded p-3">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del negocio
              </label>
              <input
                id="tenantName"
                name="tenantName"
                type="text"
                required
                value={formData.tenantName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors"
                placeholder="ej. Central Cafe"
              />
            </div>

            <div>
              <label htmlFor="ownerFirstName" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                id="ownerFirstName"
                name="ownerFirstName"
                type="text"
                value={formData.ownerFirstName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors"
                placeholder="Juan"
              />
            </div>

            <div>
              <label htmlFor="ownerLastName" className="block text-sm font-medium text-gray-700 mb-2">
                Apellido
              </label>
              <input
                id="ownerLastName"
                name="ownerLastName"
                type="text"
                value={formData.ownerLastName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors"
                placeholder="Pérez"
              />
            </div>

            <div>
              <label htmlFor="ownerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                id="ownerEmail"
                name="ownerEmail"
                type="email"
                required
                value={formData.ownerEmail}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors"
                placeholder="admin@tunegocio.com"
              />
            </div>

            <div>
              <label htmlFor="ownerPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="ownerPassword"
                name="ownerPassword"
                type="password"
                required
                value={formData.ownerPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors"
                placeholder="Ingresa tu contraseña"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors"
                placeholder="Confirma tu contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded text-sm font-medium text-white bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 hover:from-pink-500 hover:via-rose-500 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando cuenta...
                </>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="font-medium text-gray-900 hover:text-gray-700">
                Inicia sesión
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link to="/pricing" className="text-sm text-gray-500 hover:text-gray-700">
              Ver precios
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
