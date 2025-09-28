// Temporary solution for manual order creation
function createManualOrderSimulation() {
  const manualOrder = window.manualOrderState;
  
  if (!manualOrder || manualOrder.products.length === 0) {
    alert('Debes agregar al menos un producto al pedido');
    return;
  }

  const newOrder = {
    id: `order-${Date.now()}`,
    customerName: manualOrder.customerName,
    customerPhone: manualOrder.customerPhone,
    customerEmail: manualOrder.customerEmail,
    customerAddress: manualOrder.customerAddress,
    items: JSON.stringify(manualOrder.products.map(p => ({
      productId: p.id,
      name: p.name,
      qty: p.quantity,
      price: p.price
    }))),
    totalPrice: manualOrder.totalPrice,
    status: manualOrder.status,
    notes: manualOrder.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Get existing orders from localStorage or empty array
  const existingOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
  
  // Add new order to the beginning
  existingOrders.unshift(newOrder);
  
  // Save back to localStorage
  localStorage.setItem('localOrders', JSON.stringify(existingOrders));
  
  alert('Pedido creado exitosamente');
  
  // Trigger a page refresh to show the new order
  window.location.reload();
}

window.createManualOrderSimulation = createManualOrderSimulation;
