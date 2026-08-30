import { getMeals, getMealsCached, addToCart } from './main.js';

function toggleSideMenu() {
  document.getElementById('sideMenu').classList.toggle('open');
}

async function renderPopularMeals() {
  const meals = getMealsCached().length > 0 ? getMealsCached() : await getMeals();
  const popular = meals.filter(m => m.popular);
  const container = document.getElementById('popularMeals');
  container.innerHTML = popular.map(meal => `
    <div class="meal-card">
      <div class="meal-img-wrap">
        <img src="${meal.image}" alt="${meal.name}" loading="lazy">
        <span class="meal-badge"><i class="fas fa-star"></i> Popular</span>
        <button class="add-btn" onclick="addToCart('${meal.id}')"><i class="fas fa-plus"></i></button>
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

function searchMeals() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const meals = getMealsCached().filter(m => m.popular && m.name.toLowerCase().includes(query));
  const container = document.getElementById('popularMeals');
  if (query === '') { renderPopularMeals(); return; }
  container.innerHTML = meals.map(meal => `
    <div class="meal-card">
      <div class="meal-img-wrap">
        <img src="${meal.image}" alt="${meal.name}" loading="lazy">
        <span class="meal-badge"><i class="fas fa-star"></i> Popular</span>
        <button class="add-btn" onclick="addToCart('${meal.id}')"><i class="fas fa-plus"></i></button>
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

document.addEventListener('DOMContentLoaded', async () => {
  await getMeals();
  renderPopularMeals();
  window.toggleSideMenu = toggleSideMenu;
});