/**
 * ========================================================
 * Expense Tracker App — main.js
 * ========================================================
 */

let transactions = [];
let editingId = null;

// Key penyimpanan localStorage dan nama Custom Event
const STORAGE_KEY = 'EXPENSE_TRACKER_APP';
const TRANSACTION_UPDATED_EVENT = 'transaction:updated';

function generateId() {
  return +new Date();
}

function isStorageExist() {
  if (typeof Storage === 'undefined') {
    alert('Browser Anda tidak mendukung Web Storage!');
    return false;
  }
  return true;
}

function saveData() {
  if (isStorageExist()) {
    const parsed = JSON.stringify(transactions);
    localStorage.setItem(STORAGE_KEY, parsed);
    document.dispatchEvent(new Event(TRANSACTION_UPDATED_EVENT));
  }
}

function loadDataFromStorage() {
  const serializedData = localStorage.getItem(STORAGE_KEY);
  let data = JSON.parse(serializedData);

  if (data !== null) {
    transactions = data;
  }

  document.dispatchEvent(new Event(TRANSACTION_UPDATED_EVENT));
}

// Mengambil elemen dari DOM berdasarkan ID di index.html
const incomeList = document.getElementById('incomeList');
const expenseList = document.getElementById('expenseList');
const transactionForm = document.getElementById('transactionForm');
const searchForm = document.getElementById('searchTransactionForm');

function createTransactionElement(transaction) {
  const { id, title, amount, date, type } = transaction;

  const iconElement = document.createElement('div');
  iconElement.classList.add(
    'tracker-transaction-item__icon',
    `tracker-transaction-item__icon--${type}`
  );
  iconElement.innerText = type === 'income' ? '⇣' : '⇡';

  const titleElement = document.createElement('div');
  titleElement.classList.add('tracker-transaction-item__title');
  titleElement.setAttribute('data-testid', 'transactionItemTitle');
  titleElement.innerText = title;

  const dateElement = document.createElement('div');
  dateElement.classList.add('tracker-transaction-item__date');
  dateElement.setAttribute('data-testid', 'transactionItemDate');
  dateElement.innerText = date;

  const typeElement = document.createElement('span');
  typeElement.classList.add('visually-hidden');
  typeElement.setAttribute('data-testid', 'transactionItemType');
  typeElement.innerText = type === 'income' ? 'Pemasukan' : 'Pengeluaran';

  const detailContainer = document.createElement('div');
  detailContainer.classList.add('tracker-transaction-item__detail');
  detailContainer.append(titleElement, dateElement, typeElement);

  const amountElement = document.createElement('div');
  amountElement.classList.add(
    'tracker-transaction-item__amount',
    `tracker-transaction-item__amount--${type}`
  );
  amountElement.setAttribute('data-testid', 'transactionItemAmount');
  amountElement.innerText = `${type === 'income' ? '+' : '-'} Rp ${Number(amount).toLocaleString('id-ID')}`;

  const editTypeButton = document.createElement('button');
  editTypeButton.type = 'button';
  editTypeButton.classList.add('tracker-transaction-item__btn');
  editTypeButton.setAttribute('data-testid', 'transactionItemEditTypeButton');
  editTypeButton.innerText = 'Ubah Tipe';
  editTypeButton.addEventListener('click', () => {
    toggleTransactionType(id);
  });

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.classList.add('tracker-transaction-item__btn');
  editButton.setAttribute('data-testid', 'transactionItemEditButton');
  editButton.innerText = 'Edit';
  editButton.addEventListener('click', () => {
    populateFormForEdit(id);
  });

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.classList.add('tracker-transaction-item__btn');
  deleteButton.setAttribute('data-testid', 'transactionItemDeleteButton');
  deleteButton.innerText = 'Hapus';
  deleteButton.addEventListener('click', () => {
    deleteTransaction(id);
  });

  const actionsContainer = document.createElement('div');
  actionsContainer.classList.add('tracker-transaction-item__actions');
  actionsContainer.append(editTypeButton, editButton, deleteButton);

  const rightContainer = document.createElement('div');
  rightContainer.classList.add('tracker-transaction-item__right');
  rightContainer.append(amountElement, actionsContainer);

  const container = document.createElement('article');
  container.classList.add('tracker-transaction-item');
  container.setAttribute('data-testid', 'transactionItem');
  container.append(iconElement, detailContainer, rightContainer);

  return container;
}

function renderTransactions(filteredTransactions = transactions) {
  if (incomeList) incomeList.innerHTML = '';
  if (expenseList) expenseList.innerHTML = '';

  for (const transaction of filteredTransactions) {
    const transactionElement = createTransactionElement(transaction);
    if (transaction.type === 'income') {
      if (incomeList) incomeList.appendChild(transactionElement);
    } else {
      if (expenseList) expenseList.appendChild(transactionElement);
    }
  }

  updateDashboard();
}

// Event Submit Form Input
if (transactionForm) {
  transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Mengambil elemen sesuai ID persis dari index.html
    const titleInput = document.getElementById('transactionFormTitleInput');
    const amountInput = document.getElementById('transactionFormAmountInput');
    const dateInput = document.getElementById('transactionFormDateInput');
    const typeInput = document.getElementById('transactionFormTypeSelect');

    const title = titleInput ? titleInput.value.trim() : '';
    const amount = amountInput ? Number(amountInput.value) : 0;
    const date = dateInput ? dateInput.value : '';
    const type = typeInput ? typeInput.value : 'income';

    if (!title) {
      alert('Judul transaksi tidak boleh kosong!');
      return;
    }

    if (isNaN(amount) || amount < 1) {
      alert('Nominal uang harus berupa angka dan minimal 1 rupiah!');
      return;
    }

    if (editingId !== null) {
      const targetTransaction = transactions.find((item) => item.id === editingId);
      if (targetTransaction) {
        targetTransaction.title = title;
        targetTransaction.amount = amount;
        targetTransaction.date = date;
        targetTransaction.type = type;
      }
      editingId = null;
      resetFormButton();
    } else {
      const newTransaction = {
        id: generateId(),
        title,
        amount,
        date,
        type,
      };
      transactions.push(newTransaction);
    }

    transactionForm.reset();
    saveData();
  });
}

function updateDashboard() {
  const totalIncome = transactions
    .filter((item) => item.type === 'income')
    .reduce((acc, item) => acc + item.amount, 0);

  const totalExpense = transactions
    .filter((item) => item.type === 'expense')
    .reduce((acc, item) => acc + item.amount, 0);

  const totalBalance = totalIncome - totalExpense;

  const balanceElement = document.querySelector('.tracker-summary__balance-amount');
  const incomeElement = document.querySelector('.tracker-summary__stat-amount--income');
  const expenseElement = document.querySelector('.tracker-summary__stat-amount--expense');

  if (balanceElement) balanceElement.innerText = `Rp ${totalBalance.toLocaleString('id-ID')}`;
  if (incomeElement) incomeElement.innerText = `Rp ${totalIncome.toLocaleString('id-ID')}`;
  if (expenseElement) expenseElement.innerText = `Rp ${totalExpense.toLocaleString('id-ID')}`;
}

function deleteTransaction(id) {
  transactions = transactions.filter((item) => item.id !== id);
  if (editingId === id) {
    editingId = null;
    if (transactionForm) transactionForm.reset();
    resetFormButton();
  }
  saveData();
}

function populateFormForEdit(id) {
  const transaction = transactions.find((item) => item.id === id);
  if (!transaction) return;

  const titleInput = document.getElementById('transactionFormTitleInput');
  const amountInput = document.getElementById('transactionFormAmountInput');
  const dateInput = document.getElementById('transactionFormDateInput');
  const typeInput = document.getElementById('transactionFormTypeSelect');
  const submitButton = transactionForm.querySelector('button[type="submit"]');

  if (titleInput) titleInput.value = transaction.title;
  if (amountInput) amountInput.value = transaction.amount;
  if (dateInput) dateInput.value = transaction.date;
  if (typeInput) typeInput.value = transaction.type;

  editingId = id;

  if (submitButton) {
    submitButton.innerText = 'Simpan Perubahan';
  }
}

function resetFormButton() {
  const submitButton = transactionForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.innerText = 'Simpan';
  }
}

document.addEventListener(TRANSACTION_UPDATED_EVENT, () => {
  const searchInput = document.getElementById('searchTransactionFormTitleInput');
  const query = searchInput ? searchInput.value.toLowerCase() : '';

  const filtered = transactions.filter((item) =>
    item.title.toLowerCase().includes(query)
  );

  renderTransactions(filtered);
});

function toggleTransactionType(id) {
  const transaction = transactions.find((item) => item.id === id);
  if (transaction) {
    transaction.type = transaction.type === 'income' ? 'expense' : 'income';
    saveData();
  }
}

// Event Pencarian Realtime & Submit Form Cari
const searchInput = document.getElementById('searchTransactionFormTitleInput');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = transactions.filter((item) =>
      item.title.toLowerCase().includes(query)
    );
    renderTransactions(filtered);
  });
}

if (searchForm) {
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const filtered = transactions.filter((item) =>
      item.title.toLowerCase().includes(query)
    );
    renderTransactions(filtered);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (isStorageExist()) {
    loadDataFromStorage();
  }
});

function setCurrentMonthYear() {
  const dateElement = document.getElementById('currentMonthYear');
  if (dateElement) {
    const now = new Date();
    const options = { month: 'long', year: 'numeric' };
    // Menghasilkan format seperti "September 2026"
    dateElement.innerText = now.toLocaleDateString('id-ID', options);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setCurrentMonthYear(); // Seteel bulan & tahun otomatis
  if (isStorageExist()) {
    loadDataFromStorage();
  }
});