
// scripts/verify-finance-v1.js
const BASE_URL = 'http://localhost:3333';

async function run() {
  const timestamp = Date.now();
  const email = `upgradeuser${timestamp}@example.com`;
  
  console.log(`1. Signing up with ${email}...`);
  const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Upgrade User',
      email: email,
      password: 'password123',
      companyName: `Upgrade Co ${timestamp}`
    })
  });
  
  if (!signupRes.ok) {
    console.error('Signup failed:', await signupRes.text());
    return;
  }
  
  console.log('2. Signing in...');
  const signinRes = await fetch(`${BASE_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: 'password123'
    })
  }); 
  
  const signinData = await signinRes.json();
  const token = signinData.token;
  console.log('Token obtained.');

  console.log('3. Applying Settings (Fixed Cost 1000, Profit Goal 5000)...');
  const settingsRes = await fetch(`${BASE_URL}/companies/settings`, {
    method: 'PUT',
    headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        monthlyFixedCost: 1000,
        targetProfitValue: 5000, // Real Value Goal
        defaultTaxRate: 10,
        defaultCardFee: 5
    })
  });
  
  if (!settingsRes.ok) console.error('Settings failed:', await settingsRes.text());

  console.log('4. Creating Expense (Status PENDING)...');
  const expRes = await fetch(`${BASE_URL}/finance/expenses`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        description: 'Rent',
        amount: 2000,
        dueDate: new Date().toISOString(),
        status: 'PENDING'
    })
  });
  
  if (!expRes.ok) console.error('Expense failed:', await expRes.text());
  
  console.log('5. Creating Product (Cost 50)...');
  // Auto Price: Cost 50. Tax 10%, Fee 5%. Margin 0% (since we use Fixed Profit Goal now?)
  // Wait, `calculateSmartPricing` uses `desiredMargin`. Default is 0 if not set.
  // The prompt said "Replacing desiredProfit use-case for goals".
  // But pricing still needs a margin per product to cover the profit goal? 
  // No, `calculateSalesTarget` calculates how MUCH to sell.
  // `calculateSmartPricing` calculates individual unit price.
  // If `desiredProfit` (margin) is 0, the price covers only Cost + Tax + Fee.
  // Contribution Margin would be: Sale - VarCost.
  // If Price = Cost/(1-0.15) -> Price = Cost/0.85. 
  // Sale = 58.82. VarCost = 50 + 8.82 = 58.82. Contribution = 0.
  // If Contribution is 0, we can NEVER reach fixed costs or profit goal. Infinite sales needed.
  // So we MUST have a Markup/Margin on the product.
  // The user didn't specify removing `desiredMargin` from `Company`.
  // So `desiredProfit` (now maybe `defaultMargin`?) should still exist for pricing?
  // I kept `desiredProfit` in schema and mapped it. 
  // Let's set `desiredProfit` (Margin) to 20% to ensure positive contribution.
  
  await fetch(`${BASE_URL}/companies/settings`, {
      method: "PUT",
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ desiredProfit: 20 }) // Set margin for pricing
  });

  const catRes = await fetch(`${BASE_URL}/categories`, { headers: { 'Authorization': `Bearer ${token}` } });
  const categories = await catRes.json();
  const geralCat = categories.data.find(c => c.name === 'Geral');

  const prodRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Product V1',
        costPrice: 50,
        categoryId: geralCat.id,
        unit: 'un'
    })
  });
  // Price should be ~76.92 (Cost 50 / 0.65)
  // CM per unit = 76.92 - (50 + 7.69 + 3.84) = 76.92 - 61.53 = 15.39.
  // Or simply: Sale * Margin% = 76.92 * 0.20 = 15.38.

  console.log('6. Checking Sales Target...');
  const targetRes = await fetch(`${BASE_URL}/companies/targets`, {
      headers: { 'Authorization': `Bearer ${token}` }
  });
  const target = await targetRes.json();
  
  console.log('Target Result:', target);
  
  // Needs: Fixed(1000) + Expense(2000) + Profit(5000) = 8000.
  // CM Ratio = 0.20 (approx).
  // TotalToSell = 8000 / 0.20 = 40,000.
  
  const expectedTotal = 40000;
  const actualTotal = Number(target.totalToSell);
  
  if (actualTotal > 39000 && actualTotal < 41000) {
      console.log(`SUCCESS: Target in expected range (~${expectedTotal}). Got ${actualTotal}`);
  } else {
      console.error(`FAILED: Target mismatch. Expected ~${expectedTotal}, got ${actualTotal}`);
  }
}

run().catch(console.error);
