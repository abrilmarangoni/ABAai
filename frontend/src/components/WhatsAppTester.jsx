import React, { useState, useEffect } from 'react';

const WhatsAppTester = () => {
  const [testMessage, setTestMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/test/whatsapp-messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setMessages(result.messages);
        setMessageCount(result.count);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendTestMessage = async () => {
    if (!testMessage.trim()) {
      alert('Por favor ingresa un mensaje de prueba');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/test/whatsapp-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: testMessage
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ Mensaje enviado!\n\nMensaje: ${result.incomingMessage}\nRespuesta: ${result.aiResponse}`);
        setTestMessage('');
        fetchMessages(); // Refresh messages
      } else {
        alert(`❌ Error: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      alert(`❌ Error de conexión: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="bg-white bg-opacity-80 backdrop-blur-sm shadow-lg rounded-2xl border border-white border-opacity-20 p-8">
      <h3 className="text-xl font-light text-gray-900 mb-6">
        🧪 Probador de WhatsApp
      </h3>
      
      <div className="space-y-6">
        {/* Enviar mensaje de prueba */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-4">📤 Enviar Mensaje de Prueba</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje de Prueba
              </label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Ej: Hola, quiero pedir un café"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            
            <button
              onClick={sendTestMessage}
              disabled={loading}
              className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 hover:from-pink-500 hover:via-rose-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg w-full"
            >
              {loading ? 'Enviando...' : 'Enviar Mensaje de Prueba'}
            </button>
          </div>
        </div>

        {/* Ver mensajes */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-green-900">📨 Mensajes Recibidos ({messageCount})</h4>
            <button
              onClick={fetchMessages}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Actualizar
            </button>
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay mensajes aún. Envía uno de prueba!</p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`p-3 rounded-lg ${
                  msg.direction === 'inbound' 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {msg.direction === 'inbound' ? '👤 Cliente' : '🤖 ABA'}
                      </p>
                      <p className="text-sm mt-1">{msg.text}</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Información */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
          <h4 className="font-medium text-yellow-900 mb-2">ℹ️ Información:</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Este probador simula mensajes de WhatsApp</li>
            <li>• Puedes enviar mensajes de prueba y ver las respuestas</li>
            <li>• Las respuestas son: "Prueba de IA en proceso"</li>
            <li>• Los mensajes se guardan en la base de datos</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppTester;
