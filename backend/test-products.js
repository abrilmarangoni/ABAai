// Test script for products endpoint
const fetch = require('node-fetch');

async function testProductsEndpoint() {
  try {
    console.log('🧪 Testing products endpoint...');
    
    // First, let's try to login to get a valid token
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', await loginResponse.text());
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful, token:', loginData.access_token.substring(0, 20) + '...');
    
    // Now test the products endpoint
    const productsResponse = await fetch('http://localhost:4000/api/products', {
      headers: {
        'Authorization': `Bearer ${loginData.access_token}`
      }
    });
    
    console.log('📦 Products response status:', productsResponse.status);
    
    if (productsResponse.ok) {
      const products = await productsResponse.json();
      console.log('✅ Products fetched successfully:', products);
    } else {
      const error = await productsResponse.text();
      console.error('❌ Products fetch failed:', error);
    }
    
    // Test adding a product
    const addProductResponse = await fetch('http://localhost:4000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.access_token}`
      },
      body: JSON.stringify({
        name: 'Café Americano',
        price: 5.50,
        sku: 'CAFE-001',
        available: true
      })
    });
    
    console.log('➕ Add product response status:', addProductResponse.status);
    
    if (addProductResponse.ok) {
      const product = await addProductResponse.json();
      console.log('✅ Product added successfully:', product);
    } else {
      const error = await addProductResponse.text();
      console.error('❌ Add product failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProductsEndpoint();
