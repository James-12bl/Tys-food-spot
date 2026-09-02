import { getMeals, getMealsCached, addToCart, showToast, hidePageLoader } from './main.js';

let currentCategory = 'all';
let selectedExtras = {};
let selectedSides = {};

function setCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.cat === cat));
  const titles = { all: 'All Meals', rice: 'Rice Dishes', pasta: 'Pasta', grills: 'Grills', soups: 'Soups', drinks: 'Drinks' };
  document.getElementById('menuTitle').textContent = titles[cat] || 'All Meals';
  renderMenu();
}

async function renderMenu() {
  const search = document.getElementById('menuSearch').value.toLowerCase();
  let meals = getMealsCached().length > 0 ? getMealsCached() : await getMeals();
  if (currentCategory !== 'all') meals = meals.filter(m => m.category === currentCategory);
  if (search) meals = meals.filter(m => m.name.toLowerCase().includes(search));
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
        <button class="add-btn" onclick="openMealModal('${meal.id}')"><i class="fas fa-plus"></i></button>
      </div>
      <div class="meal-info">
        <h3 class="meal-name">${meal.name}</h3>
        <p class="meal-desc">${meal.desc}</p>
        <div class="meal-footer">
          <span class="meal-price">N${meal.price.toLocaleString()}</span>
          <span class="meal-rating"><i class="fas fa-star"></i> ${meal.rating}</span>
        </div>
        ${(meal.extras || []).length > 0 || (meal.sides || []).length > 0 ? `
          <div style="margin-top:6px;font-size:11px;color:var(--text-muted);">
            ${(meal.extras || []).length > 0 ? `<span><i class="fas fa-plus-circle"></i> ${meal.extras.length} extras</span>` : ''}
            ${(meal.sides || []).length > 0 ? `<span style="margin-left:8px"><i class="fas fa-leaf"></i> ${meal.sides.length} sides</span>` : ''}
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function openMealModal(mealId) {
  const meal = getMealsCached().find(m => m.id === mealId);
  if (!meal) return;
  selectedExtras[mealId] = [];
  selectedSides[mealId] = [];
  
  let extrasHtml = '';
  if ((meal.extras || []).length > 0) {
    extrasHtml = `
      <div style="margin:14px 0 8px;">
        <h4 style="font-size:14px;margin-bottom:8px;"><i class="fas fa-plus-circle"></i> Additional Orders (Extras)</h4>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${meal.extras.map((extra, idx) => `
            <label style="display:flex;align-items:center;gap:6px;padding:8px 12px;background:#f8f9fa;border-radius:8px;cursor:pointer;font-size:13px;">
              <input type="checkbox" onchange="toggleExtra('${mealId}', ${idx}, this.checked)">
              <span>${extra.name} <strong style="color:var(--primary)">+N${extra.price.toLocaleString()}</strong></span>
            </label>
          `).join('')}
        </div>
      </div>`;
  }
  
  let sidesHtml = '';
  if ((meal.sides || []).length > 0) {
    sidesHtml = `
      <div style="margin:14px 0 8px;">
        <h4 style="font-size:14px;margin-bottom:8px;"><i class="fas fa-leaf"></i> Portion / Side Items</h4>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${meal.sides.map((side, idx) => `
            <label style="display:flex;align-items:center;gap:6px;padding:8px 12px;background:#f8f9fa;border-radius:8px;cursor:pointer;font-size:13px;">
              <input type="checkbox" onchange="toggleSide('${mealId}', ${idx}, this.checked)">
              <span>${side.name} <strong style="color:var(--primary)">+N${side.price.toLocaleString()}</strong></span>
            </label>
          `).join('')}
        </div>
      </div>`;
  }
  
  const modal = document.createElement('div');
  modal.id = 'mealModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:16px;max-width:420px;width:90%;max-height:85vh;overflow-y:auto;padding:20px;position:relative;">
      <button onclick="closeMealModal()" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:20px;cursor:pointer;color:#999;"><i class="fas fa-times"></i></button>
      <img src="${meal.image}" style="width:100%;height:200px;object-fit:cover;border-radius:12px;margin-bottom:12px;" alt="${meal.name}">
      <h3 style="font-size:20px;margin-bottom:4px;">${meal.name}</h3>
      <p style="color:var(--text-muted);font-size:13px;margin-bottom:8px;">${meal.desc}</p>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <span style="font-size:22px;font-weight:700;color:var(--primary);">N${meal.price.toLocaleString()}</span>
        <span style="font-size:13px;color:#ffc107;"><i class="fas fa-star"></i> ${meal.rating}</span>
      </div>
      ${extrasHtml}
      ${sidesHtml}
      <button onclick="addMealToCart('${mealId}')" style="width:100%;margin-top:16px;padding:14px;background:var(--primary);color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;">
        <i class="fas fa-shopping-cart"></i> Add to Cart
      </button>
    </div>`;
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

function closeMealModal() {
  const modal = document.getElementById('mealModal');
  if (modal) { modal.remove(); document.body.style.overflow = ''; }
}

function toggleExtra(mealId, idx, checked) {
  const meal = getMealsCached().find(m => m.id === mealId);
  if (!meal || !meal.extras[idx]) return;
  if (checked) selectedExtras[mealId].push(meal.extras[idx]);
  else selectedExtras[mealId] = selectedExtras[mealId].filter(e => e.name !== meal.extras[idx].name);
}

function toggleSide(mealId, idx, checked) {
  const meal = getMealsCached().find(m => m.id === mealId);
  if (!meal || !meal.sides[idx]) return;
  if (checked) selectedSides[mealId].push(meal.sides[idx]);
  else selectedSides[mealId] = selectedSides[mealId].filter(s => s.name !== meal.sides[idx].name);
}

function addMealToCart(mealId) {
  addToCart(mealId, selectedExtras[mealId] || [], selectedSides[mealId] || []);
  closeMealModal();
}

function filterMenu() { renderMenu(); }

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await getMeals();
    const urlParams = new URLSearchParams(window.location.search);
    const cat = urlParams.get('cat') || 'all';
    setCategory(cat);
    window.setCategory = setCategory;
    window.openMealModal = openMealModal;
    window.closeMealModal = closeMealModal;
    window.toggleExtra = toggleExtra;
    window.toggleSide = toggleSide;
    window.addMealToCart = addMealToCart;
  } finally {
    hidePageLoader();
  }
});