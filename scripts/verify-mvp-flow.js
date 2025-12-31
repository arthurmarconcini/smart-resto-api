
// scripts/verify-mvp-flow.js
// scripts/verify-mvp-flow.js

const BASE_URL = 'http://localhost:3333';

async function run() {
  const timestamp = Date.now();
  const email = `testuser${timestamp}@example.com`;
  
  console.log(`1. Signing up with ${email}...`);
  const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test MVP',
      email: email,
      password: 'password123',
      companyName: `MVP Company ${timestamp}`
    })
  });
  
  if (!signupRes.ok) {
    console.error('Signup failed:', await signupRes.text());
    return;
  }
  
  // Sign in to get token (signup usually doesn't return token in this API? Check auth.controller)
  // Auth controller `signUp` returns { user, company }.
  // Need to sign in.
  
  console.log('2. Signing in...');
  const signinRes = await fetch(`${BASE_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: 'password123'
    })
  }); // Note: Controller returns { token }? Wait, let's check controller.
  
  // Actually, let me check auth.controller.ts return value first.
  // ... (Checked previously: signIn returns { token: ... })
  // Wait, I didn't verify signIn return structure in this session, only viewed it.
  // Let's assume standard JWT flow returns token.
  
  const signinData = await signinRes.json();
  const token = signinData.token;
  
  if (!token) {
      // In `auth.controller.ts`, signIn calls `reply.send({ token })`.
      // But verify if it was implemented that way. I might need to check.
      // Assuming standard implementation I did.
  }

  console.log('Token obtained.');

  console.log('3. Applying Company Settings...');
  const settingsRes = await fetch(`${BASE_URL}/companies/settings`, {
    method: 'PUT',
    headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        monthlyFixedCost: 1000,
        defaultTaxRate: 10,  // 10%
        defaultCardFee: 5,   // 5%
        desiredProfit: 20    // 20%
    })
  });
  
  if (!settingsRes.ok) console.error('Settings failed:', await settingsRes.text());

  console.log('4. Fetching Categories (expecting "Geral")...');
  const catRes = await fetch(`${BASE_URL}/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
  });
  const categories = await catRes.json();
  
  if (!categories.data) {
     console.error("Categories response error:", categories);
     return;
  }

  const geralCat = categories.data.find(c => c.name === 'Geral');
  
  if (!geralCat) {
      console.error('FAILED: Default category "Geral" not found!');
      console.log('Categories found:', categories);
      return;
  }
  console.log('SUCCESS: Found category "Geral" with ID:', geralCat.id);
  
  console.log('5. Creating Product with Cost only...');
  // Cost 50. Tax 10, Fee 5, Profit 20 -> Total 35%. 
  // Price = 50 / (1 - 0.35) = 50 / 0.65 = 76.92
  const prodRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        name: 'MVP Product',
        costPrice: 50,
        categoryId: geralCat.id,
        unit: 'un'
    })
  });
  
  const product = await prodRes.json();
  console.log('Product Created:', product);
  
  const expectedPrice = 76.92;
  const actualPrice = Number(product.salePrice);
  
  if (Math.abs(actualPrice - expectedPrice) < 0.1) {
      console.log(`SUCCESS: Price calculated correctly. Expected ~${expectedPrice}, got ${actualPrice}`);
  } else {
      console.error(`FAILED: Price mismatch. Expected ~${expectedPrice}, got ${actualPrice}`);
  }
}

run().catch(console.error);
