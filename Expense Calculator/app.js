const expenses = [
  { category: 'Groceries', amount: 15000 },
  { category: 'Rent', amount: 40000 },
  { category: 'Transportation', amount: 5000 },
  { category: 'Entertainment', amount: 10000 },
  { category: 'Communication', amount: 2000 },
  { category: 'Gym', amount: 3000 },
];

const tbody = document.querySelector('#expense-table tbody');
const categoryInput = document.getElementById('category-input');
const amountInput = document.getElementById('amount-input');
const addExpenseBtn = document.getElementById('add-expense-btn');
const calculateBtn = document.getElementById('calculate-btn');
const resultsDiv = document.getElementById('results');

function renderExpenses() {
  tbody.innerHTML = '';
  expenses.forEach(({ category, amount }) => {
    const tr = document.createElement('tr');
    const tdCategory = document.createElement('td');
    tdCategory.textContent = category;
    const tdAmount = document.createElement('td');
    tdAmount.textContent = amount.toLocaleString();
    tr.appendChild(tdCategory);
    tr.appendChild(tdAmount);
    tbody.appendChild(tr);
  });
}

function addExpense() {
  const category = categoryInput.value.trim();
  const amount = Number(amountInput.value);

  if (!category) {
    alert('Category cannot be empty.');
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid positive amount.');
    return;
  }

  expenses.push({ category, amount });
  renderExpenses();

  categoryInput.value = '';
  amountInput.value = '';
  resultsDiv.style.display = 'none';
}

function calculate() {
  if (expenses.length === 0) {
    alert('No expenses to calculate.');
    return;
  }
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgDaily = total / 30;
  const top3 = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 3);

  resultsDiv.innerHTML = `
    <p><strong>Total amount of expenses:</strong> $${total.toLocaleString()}</p>
    <p><strong>Average daily expense:</strong> $${avgDaily.toFixed(2)}</p>
    <p><strong>Top 3 largest expenses:</strong></p>
    <ol>
      ${top3
        .map(
          (e) => `<li>${e.category} ($${e.amount.toLocaleString()})</li>`
        )
        .join('')}
    </ol>
  `;
  resultsDiv.style.display = 'block';
}

addExpenseBtn.addEventListener('click', addExpense);
calculateBtn.addEventListener('click', calculate);

// Initial render
renderExpenses();