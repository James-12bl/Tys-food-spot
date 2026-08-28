const DEFAULT_IMG = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';

function updateStats() {
  const meals = getMeals();
  document.getElementById('statMeals').textContent = meals.length;
  document.getElementById('statPopular').textContent = meals.filter(m => m.popular).length;
  document.getElementById('statCart').textContent = getCart().reduce((s, i) => s + i.qty, 0);
}

function handleAddMeal(e) {
  e.preventDefault();
  const meal = {
    name: document.getElementById('mName').value.trim(),
    price: parseInt(document.getElementById('mPrice').value),
    desc: document.getElementById('mDesc').value.trim(),
    category: document.getElementById('mCategory').value,
    rating: parseFloat(document.getElementById('mRating').value),
    image: document.getElementById('mImage').value.trim() || DEFAULT_IMG,
    popular: document.getElementById('mPopular').checked
  };
  addMeal(meal);
  showToast('Meal added successfully!');
  document.querySelector('.admin-form').reset();
  document.getElementById('mRating').value = '4.5';
  renderAdminMeals();
  updateStats();
}

function renderAdminMeals() {
  const meals = getMeals();
  const container = document.getElementById('adminMealsList');
  if (meals.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No meals yet.</p>';
    return;
  }
  container.innerHTML = meals.map(meal => `
    <div class="admin-meal-item">
      <img src="${meal.image}" alt="${meal.name}">
      <div class="admin-meal-info">
        <h4>${meal.name}</h4>
        <p>N${meal.price.toLocaleString()} · <i class="fas fa-star" style="color:#ffc107;font-size:10px"></i> ${meal.rating}</p>
        <span class="cat-tag">${meal.category}</span>
        ${meal.popular ? '<span class="cat-tag" style="background:#fff3e0;color:#e8913a;margin-left:4px">Popular</span>' : ''}
      </div>
      <div class="admin-meal-actions">
        <button class="btn-delete" onclick="confirmDelete(${meal.id}, '${meal.name.replace(/'/g, "\'")}')" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function confirmDelete(id, name) {
  if (confirm('Are you sure you want to delete "' + name + '"?')) {
    deleteMeal(id);
    showToast('Meal deleted successfully!');
    renderAdminMeals();
    updateStats();
  }
}

function resetMeals() {
  if (confirm('Reset all meals to default? This will remove any custom meals.')) {
    localStorage.removeItem('tys_meals');
    getMeals();
    showToast('Meals reset to default!');
    renderAdminMeals();
    updateStats();
  }
}

function renderInquiries() {
  const inquiries = JSON.parse(localStorage.getItem('tys_inquiries')) || [];
  const container = document.getElementById('inquiriesList');
  if (inquiries.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No inquiries yet.</p>';
    return;
  }
  container.innerHTML = inquiries.slice().reverse().map((inq) => `
    <div class="inquiry-item">
      <div class="inquiry-header">
        <h4>${inq.name}</h4>
        <span>${new Date(inq.date).toLocaleDateString()}</span>
      </div>
      <p><i class="fas fa-envelope" style="color:var(--accent);margin-right:4px"></i> ${inq.email}</p>
      <p><i class="fas fa-tag" style="color:var(--primary);margin-right:4px"></i> ${inq.subject}</p>
      <div class="inquiry-msg">${inq.message}</div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderAdminMeals();
  renderInquiries();
  updateStats();
});
