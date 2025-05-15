const fetch = require('node-fetch');

describe('Fake Store API Product Data Validation', () => {
  let products;

  test('GET /products returns status 200', async () => {
    const response = await fetch('https://fakestoreapi.com/products');
    expect(response.status).toBe(200);
    products = await response.json();
    expect(Array.isArray(products)).toBe(true);
  });

  test('Validate each product for defects', () => {
    const defects = [];

    products.forEach((product, index) => {
      const issues = [];

      if (!product.title || product.title.trim() === '') {
        issues.push('Empty or missing title');
      }

      if (typeof product.price !== 'number' || product.price < 0) {
        issues.push(`Invalid price: ${product.price}`);
      }

      const rating = product.rating;
      if (!rating || typeof rating.rate !== 'number') {
        issues.push('Missing or invalid rating.rate');
      } else if (rating.rate > 5) {
        issues.push(`rating.rate exceeds 5: ${rating.rate}`);
      }

      if (issues.length > 0) {
        defects.push({
          index,
          id: product.id || 'N/A',
          title: product.title || 'N/A',
          issues,
        });
      }
    });

    if (defects.length > 0) {
      console.error('Defective products found:', defects);
    }

    expect(defects.length).toBe(0);
  });
});