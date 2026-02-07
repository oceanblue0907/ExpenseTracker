const list = document.getElementById('list');
const form = document.getElementById('expense-form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const dateInput = document.getElementById('date');
const categoryInput = document.getElementById('category');
const budgetInput = document.getElementById('budget');
const totalAmount = document.getElementById('total-amount');
const balanceMoney = document.getElementById('balance-money');
const clearBtn = document.getElementById('clear-btn');
const downloadBtn = document.getElementById('download-btn');
const monthFilter = document.getElementById('month-filter');

const ctx = document.getElementById('expenseChart').getContext('2d');
let expenseChart;

let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let savedBudget = localStorage.getItem('budget') || '';

function init() {
    budgetInput.value = savedBudget;
    dateInput.valueAsDate = new Date();
    populateFilters();
    renderData();
    initScrollReveal(); // Initialize reveal effect
}

function populateFilters() {
    const months = [...new Set(expenses.map(exp => exp.date.substring(0, 7)))].sort().reverse();
    const currentSelection = monthFilter.value;
    monthFilter.innerHTML = '<option value="all">All Time</option>';
    months.forEach(m => {
        const option = document.createElement('option');
        option.value = m;
        option.textContent = new Date(m + "-01").toLocaleString('default', { month: 'long', year: 'numeric' });
        monthFilter.appendChild(option);
    });
    monthFilter.value = currentSelection;
}

function renderData() {
    list.innerHTML = '';
    const selectedMonth = monthFilter.value;
    
    const filtered = selectedMonth === 'all' 
        ? expenses 
        : expenses.filter(exp => exp.date.startsWith(selectedMonth));

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    filtered.forEach(addExpenseToDOM);
    
    updateValues(filtered);
    updateChart(filtered);
}

function updateValues(filteredData) {
    const totalSpent = filteredData.reduce((acc, item) => (acc += item.amount), 0);
    const budget = +budgetInput.value || 0;
    const remaining = budget - totalSpent;

    totalAmount.innerText = `$${totalSpent.toFixed(2)}`;
    balanceMoney.innerText = `$${remaining.toFixed(2)}`;
    balanceMoney.style.color = remaining < 0 ? "#ef4444" : "#1e293b";
    
    localStorage.setItem('budget', budgetInput.value);
}

function updateChart(filteredData) {
    if (expenseChart) expenseChart.destroy();
    if (filteredData.length === 0) return;

    const categoryTotals = filteredData.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {});

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    expenseChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#0a5b66', '#38bdf8', '#818cf8', '#fb7185', '#fbbf24', '#34d399'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'bottom' } }
        }
    });
}

function addExpense(e) {
    e.preventDefault();
    if (!text.value || !amount.value || !dateInput.value || !categoryInput.value) return;

    const expense = {
        id: Math.floor(Math.random() * 1000000),
        text: text.value,
        category: categoryInput.value,
        amount: +amount.value,
        date: dateInput.value
    };

    expenses.push(expense);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    text.value = '';
    amount.value = '';
    categoryInput.value = '';
    init();
}

function removeExpense(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    init();
}

function addExpenseToDOM(expense) {
    const item = document.createElement('li');
    item.classList.add('list-item-new'); 
    
    item.innerHTML = `
        <div><strong>${expense.date}</strong> [${expense.category}]<br><small>${expense.text}</small></div>
        <div class="item-right">
            <span>-$${Math.abs(expense.amount).toFixed(2)}</span>
            <button class="delete-btn" onclick="removeExpense(${expense.id})">x</button>
        </div>
    `;
    list.appendChild(item);
}

function downloadReport() {
    const selectedMonth = monthFilter.value;
    const filtered = selectedMonth === 'all' 
        ? expenses 
        : expenses.filter(exp => exp.date.startsWith(selectedMonth));

    if (filtered.length === 0) return alert("No data to download.");

    let csvContent = "Date,Category,Description,Amount\n";
    filtered.forEach(exp => {
        const cleanDesc = exp.text.replace(/,/g, ""); 
        csvContent += `${exp.date},${exp.category},${cleanDesc},${exp.amount.toFixed(2)}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Expense_Report_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// Scroll Reveal Logic
function initScrollReveal() {
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

monthFilter.addEventListener('change', renderData);
downloadBtn.addEventListener('click', downloadReport);
clearBtn.addEventListener('click', () => {
    if(confirm('Clear all data?')) {
        expenses = [];
        localStorage.removeItem('expenses');
        monthFilter.value = 'all';
        init();
    }
});

budgetInput.addEventListener('input', () => {
    savedBudget = budgetInput.value;
    renderData();
});

form.addEventListener('submit', addExpense);

init();