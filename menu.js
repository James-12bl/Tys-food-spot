let currentCategory = 'all';

function setCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('.chip').forEach(c => {
    c.classList.toggle('active', c.dataset.cat === cat);
  });
  const titles = { all: 'All Meals', rice: 'Rice Dishes', pasta: 'Pasta', grills: 'Grills', soups: 'Soups', drinks: 'Drinks' };
  document.getElementById('menuTitle').textContent = titles[cat] || 'All Meals';
  renderMenu();
}

function renderMenu() {
  const search = document.getElementById('menuSearch').value.toLowerCase();
  let meals = getMeals();
  if (currentCategory !== 'all') {
    meals = meals.filter(m => m.category === currentCategory);
  }
  if (search) {
    meals = meals.filter(m => m.name.toLowerCase().includes(search));
  }
  document.getElementById('mealCount').textContent = meals.length + ' items';
  const container = document.getElementById('menuMeals');
  if (meals.length === 0) {
    container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px;">No meals found.</p>';
    return;
  }
  container.innerHTML = meals.map(meal => `
    <div class="meal-card">
      <div class="meal-img-wrap">
        <img src="${meal.image}" alt="${meal.name}" loading="lazy">
        ${meal.popular ? '<span class="meal-badge"><i class="fas fa-star"></i> Popular</span>' : ''}
        <button class="add-btn" onclick="addToCart(${meal.id})"><i class="fas fa-plus"></i></button>
      </div>
      <div class="meal-info">
        <h3 class="meal-name">${meal.name}</h3>
        <p class="meal-desc">${meal.desc}</p>
        <div class="meal-footer">
          <span class="meal-price">N${meal.price.toLocaleString()}</span>
          <span class="meal-rating"><i class="fas fa-star"></i> ${meal.rating}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function filterMenu() {
  renderMenu();
}

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const cat = urlParams.get('cat') || 'all';
  setCategory(cat);
});
