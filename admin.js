import {
  getMeals, addMeal, deleteMeal, updateMeal,
  getGallery, addGalleryItem, deleteGalleryItem, updateGalleryItem,
  getExtras, addExtra, deleteExtra,
  getSides, addSide, deleteSide,
  uploadImage, seedDatabase, showToast, getCart
} from './main.js';

/* ========== BASE64 HELPER ========== */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
let allMeals = [], allGallery = [], allExtras = [], allSides = [];
let editingMealId = null, editingGalleryId = null;

function setMealDebug(message, type = 'info') {
  const panel = document.getElementById('mealDebugPanel');
  if (!panel) return;

  const line = document.createElement('div');
  line.className = `meal-debug-line ${type}`;
  line.textContent = message;
  panel.appendChild(line);
  panel.classList.add('visible');
  panel.scrollTop = panel.scrollHeight;
}

function clearMealDebug() {
  const panel = document.getElementById('mealDebugPanel');
  if (!panel) return;
  panel.innerHTML = '<div class="meal-debug-title">Meal add debug</div><div class="meal-debug-line info">Waiting for meal submit...</div>';
  panel.classList.add('visible');
}

function updateStats() {
  const mealsStat = document.getElementById('statMeals');
  const popularStat = document.getElementById('statPopular');
  const galleryStat = document.getElementById('statGallery');
  const cartStat = document.getElementById('statCart');

  if (mealsStat) mealsStat.textContent = allMeals.length;
  if (popularStat) popularStat.textContent = allMeals.filter(m => m.popular).length;
  if (galleryStat) galleryStat.textContent = allGallery.length;
  if (cartStat) cartStat.textContent = getCart().reduce((s, i) => s + i.qty, 0);
}

async function loadAllData() {
  allMeals = await getMeals();
  allGallery = await getGallery();
  allExtras = await getExtras();
  allSides = await getSides();
  renderAdminMeals();
  renderGalleryAdmin();
  renderExtrasAdmin();
  renderSidesAdmin();
  populateExtrasSelect();
  populateSidesSelect();
  updateStats();
}

async function handleAddMeal(e) {
  e.preventDefault();
  clearMealDebug();
  console.log('[DEBUG] handleAddMeal start');
  setMealDebug('Meal submit started.', 'info');

  const name = document.getElementById('mName').value.trim();
  const price = Number(document.getElementById('mPrice').value);
  const desc = document.getElementById('mDesc').value.trim();
  const category = document.getElementById('mCategory').value;
  const rating = Number(document.getElementById('mRating').value);
  const popular = document.getElementById('mPopular').checked;
  const extras = getSelectedExtras();
  const sides = getSelectedSides();
  const fileInput = document.getElementById('mImageFile');

  console.log('[DEBUG] meal form values', { name, price, desc, category, rating, popular, extras, sides, fileSelected: !!(fileInput && fileInput.files && fileInput.files[0]) });
  setMealDebug(`Values: name="${name || '(empty)'}", price=${price}, category="${category || '(empty)'}", rating=${rating}, extras=${extras.length}, sides=${sides.length}.`, 'info');

  if (!name || !desc || !category || Number.isNaN(price) || Number.isNaN(rating)) {
    const issue = [
      !name ? 'Meal name is empty.' : '',
      !desc ? 'Description is empty.' : '',
      !category ? 'Category is missing.' : '',
      Number.isNaN(price) ? 'Price is invalid.' : '',
      Number.isNaN(rating) ? 'Rating is invalid.' : ''
    ].filter(Boolean).join(' ');
    console.error('[DEBUG] invalid meal data before submit', { name, price, desc, category, rating });
    setMealDebug(`Validation failed: ${issue}`, 'error');
    showToast('Please fill in all meal fields correctly.');
    return;
  }

  let imageUrl = document.getElementById('mImageUrl')?.value?.trim() || DEFAULT_IMG;

  if (fileInput && fileInput.files && fileInput.files[0]) {
    try {
      imageUrl = await fileToBase64(fileInput.files[0]);
      console.log('[DEBUG] meal image converted to base64 successfully');
      setMealDebug('Image file loaded successfully.', 'info');
    } catch (err) {
      console.error('[DEBUG] meal image conversion failed', err);
      setMealDebug(`Image read failed: ${err?.message || err}`, 'error');
      showToast('Image read failed: ' + err.message);
      return;
    }
  }

  const meal = {
    name,
    price,
    desc,
    category,
    rating,
    image: imageUrl,
    popular,
    extras,
    sides
  };

  console.log('[DEBUG] final meal payload being sent', meal);
  setMealDebug(`Sending payload: ${name} | N${price} | ${category} | rating ${rating} | image=${imageUrl ? 'present' : 'missing'}.`, 'info');

  if (editingMealId) {
    updateMeal(editingMealId, meal).then(() => {
      setMealDebug('Meal updated successfully in Firestore.', 'success');
      showToast('Meal updated successfully!');
      resetMealForm(); loadAllData();
    }).catch((err) => {
      const message = err?.message || String(err);
      console.error('[DEBUG] updateMeal failed', err);
      setMealDebug(`Meal update failed: ${message}`, 'error');
      showToast('Meal update failed. Check debug panel.');
    });
  } else {
    addMeal(meal).then(() => {
      setMealDebug('Meal added successfully to Firestore.', 'success');
      showToast('Meal added successfully!');
      resetMealForm(); loadAllData();
    }).catch((err) => {
      const message = err?.message || String(err);
      console.error('[DEBUG] addMeal failed', err);
      setMealDebug(`Meal add failed: ${message}`, 'error');
      showToast('Meal add failed. Check debug panel.');
    });
  }
}

function resetMealForm() {
  document.querySelector('.admin-form').reset();
  const fileInput = document.getElementById('mImageFile');
  if (fileInput) fileInput.value = '';
  const hiddenImage = document.getElementById('mImageUrl');
  if (hiddenImage) hiddenImage.value = '';
  document.getElementById('mRating').value = '4.5';
  document.getElementById('mealFormTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Add New Meal';
  document.getElementById('submitMealBtn').innerHTML = '<i class="fas fa-plus"></i> Add Meal';
  editingMealId = null;
  document.querySelectorAll('.extra-check input, .side-check input').forEach(cb => cb.checked = false);
}

function editMeal(id) {
  const meal = allMeals.find(m => m.id === id);
  if (!meal) return;
  editingMealId = id;
  document.getElementById('mName').value = meal.name;
  document.getElementById('mPrice').value = meal.price;
  document.getElementById('mDesc').value = meal.desc;
  document.getElementById('mCategory').value = meal.category;
  document.getElementById('mRating').value = meal.rating;
  const hiddenImage = document.getElementById('mImageUrl');
  if (hiddenImage) hiddenImage.value = meal.image === DEFAULT_IMG ? '' : meal.image;
  const fileInput = document.getElementById('mImageFile');
  if (fileInput) fileInput.value = '';
  document.getElementById('mPopular').checked = meal.popular;
  document.getElementById('mealFormTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Meal';
  document.getElementById('submitMealBtn').innerHTML = '<i class="fas fa-save"></i> Update Meal';
  document.querySelectorAll('.extra-check input').forEach(cb => {
    cb.checked = (meal.extras || []).some(e => e.name === cb.dataset.name);
  });
  document.querySelectorAll('.side-check input').forEach(cb => {
    cb.checked = (meal.sides || []).some(s => s.name === cb.dataset.name);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getSelectedExtras() {
  const selected = [];
  document.querySelectorAll('.extra-check input:checked').forEach(cb => {
    const extra = allExtras.find(e => e.name === cb.dataset.name);
    if (extra) selected.push({ name: extra.name, price: extra.price });
  });
  return selected;
}

function getSelectedSides() {
  const selected = [];
  document.querySelectorAll('.side-check input:checked').forEach(cb => {
    const side = allSides.find(s => s.name === cb.dataset.name);
    if (side) selected.push({ name: side.name, price: side.price });
  });
  return selected;
}

function populateExtrasSelect() {
  const container = document.getElementById('extrasSelect');
  if (!container) return;
  container.innerHTML = allExtras.map(e => `
    <label class="extra-check">
      <input type="checkbox" data-name="${e.name}">
      <span>${e.name} (+N${e.price.toLocaleString()})</span>
    </label>
  `).join('');
}

function populateSidesSelect() {
  const container = document.getElementById('sidesSelect');
  if (!container) return;
  container.innerHTML = allSides.map(s => `
    <label class="side-check">
      <input type="checkbox" data-name="${s.name}">
      <span>${s.name} (+N${s.price.toLocaleString()})</span>
    </label>
  `).join('');
}

function renderAdminMeals() {
  const container = document.getElementById('adminMealsList');
  if (allMeals.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No meals yet.</p>';
    return;
  }
  container.innerHTML = allMeals.map(meal => `
    <div class="admin-meal-item">
      <img src="${meal.image}" alt="${meal.name}">
      <div class="admin-meal-info">
        <h4>${meal.name}</h4>
        <p>N${meal.price.toLocaleString()} · <i class="fas fa-star" style="color:#ffc107;font-size:10px"></i> ${meal.rating}</p>
        <span class="cat-tag">${meal.category}</span>
        ${meal.popular ? '<span class="cat-tag" style="background:#fff3e0;color:#e8913a;margin-left:4px">Popular</span>' : ''}
        ${(meal.extras || []).length > 0 ? '<span class="cat-tag" style="background:#e3f2fd;color:#1565c0;margin-left:4px">+' + meal.extras.length + ' extras</span>' : ''}
        ${(meal.sides || []).length > 0 ? '<span class="cat-tag" style="background:#e8f5e9;color:#2d5a2d;margin-left:4px">+' + meal.sides.length + ' sides</span>' : ''}
      </div>
      <div class="admin-meal-actions">
        <button class="btn-edit" onclick="editMeal('${meal.id}')" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="btn-delete" onclick="confirmDeleteMeal('${meal.id}', '${meal.name.replace(/'/g, "\\'")}')" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function confirmDeleteMeal(id, name) {
  if (confirm('Are you sure you want to delete "' + name + '"?')) {
    deleteMeal(id).then(() => { showToast('Meal deleted!'); loadAllData(); });
  }
}

async function resetMeals() {
  try {
    await seedDatabase();
    await loadAllData();
    showToast('Default menu data restored.');
  } catch (err) {
    console.error('[DEBUG] resetMeals failed', err);
    showToast('Reset failed. Check console log.');
  }
}

async function handleAddGallery(e) {
  e.preventDefault();
  console.log('[DEBUG] handleAddGallery start');

  const name = document.getElementById('gName').value.trim();
  const caption = document.getElementById('gCaption').value.trim();
  const fileInput = document.getElementById('gImageFile');
  console.log('[DEBUG] gallery form values', { name, caption, fileSelected: !!(fileInput && fileInput.files && fileInput.files[0]) });

  if (!name) {
    console.error('[DEBUG] invalid gallery data before submit', { name, caption });
    showToast('Please add a gallery name.');
    return;
  }

  let imageUrl = document.getElementById('gImageUrl')?.value?.trim() || DEFAULT_IMG;

  if (fileInput && fileInput.files && fileInput.files[0]) {
    try {
      imageUrl = await fileToBase64(fileInput.files[0]);
      console.log('[DEBUG] gallery image converted to base64 successfully');
    } catch (err) {
      console.error('[DEBUG] gallery image conversion failed', err);
      showToast('Image read failed: ' + err.message);
      return;
    }
  }

  const item = {
    name,
    caption,
    image: imageUrl
  };

  console.log('[DEBUG] final gallery payload being sent', item);

  if (editingGalleryId) {
    updateGalleryItem(editingGalleryId, item).then(() => {
      showToast('Gallery item updated!'); resetGalleryForm(); loadAllData();
    }).catch((err) => {
      console.error('[DEBUG] updateGalleryItem failed', err);
      showToast('Gallery update failed. Check console log.');
    });
  } else {
    addGalleryItem(item).then(() => {
      showToast('Gallery item added!'); resetGalleryForm(); loadAllData();
    }).catch((err) => {
      console.error('[DEBUG] addGalleryItem failed', err);
      showToast('Gallery add failed. Check console log.');
    });
  }
}

function resetGalleryForm() {
  document.getElementById('galleryForm').reset();
  const fileInput = document.getElementById('gImageFile');
  if (fileInput) fileInput.value = '';
  const hiddenImage = document.getElementById('gImageUrl');
  if (hiddenImage) hiddenImage.value = '';
  editingGalleryId = null;
  document.getElementById('galleryFormTitle').innerHTML = '<i class="fas fa-images"></i> Add Gallery Item';
  document.getElementById('submitGalleryBtn').innerHTML = '<i class="fas fa-plus"></i> Add to Gallery';
}

function editGalleryItem(id) {
  const item = allGallery.find(g => g.id === id);
  if (!item) return;
  editingGalleryId = id;
  document.getElementById('gName').value = item.name;
  document.getElementById('gCaption').value = item.caption || '';
  const hiddenImage = document.getElementById('gImageUrl');
  if (hiddenImage) hiddenImage.value = item.image === DEFAULT_IMG ? '' : item.image;
  const fileInput = document.getElementById('gImageFile');
  if (fileInput) fileInput.value = '';
  document.getElementById('galleryFormTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Gallery Item';
  document.getElementById('submitGalleryBtn').innerHTML = '<i class="fas fa-save"></i> Update Gallery Item';
  window.scrollTo({ top: document.getElementById('gallerySection').offsetTop - 20, behavior: 'smooth' });
}

function moveGalleryToMeal(id) {
  const item = allGallery.find(g => g.id === id);
  if (!item) return;
  if (!confirm('Move "' + item.name + '" from Gallery to Meals?')) return;
  const meal = {
    name: item.name, desc: item.caption || item.name, price: 0,
    rating: 4.5, category: 'grills', image: item.image,
    popular: false, extras: [], sides: []
  };
  addMeal(meal).then(() => {
    deleteGalleryItem(id).then(() => {
      showToast('Moved to Meals! Now edit the price & details.'); loadAllData();
    });
  });
}

function renderGalleryAdmin() {
  const container = document.getElementById('adminGalleryList');
  if (allGallery.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No gallery items yet.</p>';
    return;
  }
  container.innerHTML = allGallery.map(item => `
    <div class="admin-meal-item">
      <img src="${item.image}" alt="${item.name}">
      <div class="admin-meal-info">
        <h4>${item.name}</h4>
        <p>${item.caption || ''}</p>
      </div>
      <div class="admin-meal-actions">
        <button class="btn-edit" onclick="editGalleryItem('${item.id}')" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="btn-move" onclick="moveGalleryToMeal('${item.id}')" title="Move to Meals"><i class="fas fa-utensils"></i></button>
        <button class="btn-delete" onclick="confirmDeleteGallery('${item.id}', '${item.name.replace(/'/g, "\\'")}')" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function confirmDeleteGallery(id, name) {
  if (confirm('Delete gallery item "' + name + '"?')) {
    deleteGalleryItem(id).then(() => { showToast('Gallery item deleted!'); loadAllData(); });
  }
}

function handleAddExtra(e) {
  e.preventDefault();
  const extra = { name: document.getElementById('eName').value.trim(), price: parseInt(document.getElementById('ePrice').value) };
  addExtra(extra).then(() => { showToast('Extra added!'); document.getElementById('extraForm').reset(); loadAllData(); });
}

function renderExtrasAdmin() {
  const container = document.getElementById('adminExtrasList');
  if (allExtras.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No extras yet.</p>';
    return;
  }
  container.innerHTML = allExtras.map(extra => `
    <div class="admin-meal-item">
      <div class="admin-meal-info" style="flex:1"><h4>${extra.name}</h4><p>+N${extra.price.toLocaleString()}</p></div>
      <div class="admin-meal-actions">
        <button class="btn-delete" onclick="confirmDeleteExtra('${extra.id}', '${extra.name.replace(/'/g, "\\'")}')" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function confirmDeleteExtra(id, name) {
  if (confirm('Delete extra "' + name + '"?')) {
    deleteExtra(id).then(() => { showToast('Extra deleted!'); loadAllData(); });
  }
}

function handleAddSide(e) {
  e.preventDefault();
  const side = { name: document.getElementById('sName').value.trim(), price: parseInt(document.getElementById('sPrice').value) };
  addSide(side).then(() => { showToast('Side added!'); document.getElementById('sideForm').reset(); loadAllData(); });
}

function renderSidesAdmin() {
  const container = document.getElementById('adminSidesList');
  if (allSides.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No sides yet.</p>';
    return;
  }
  container.innerHTML = allSides.map(side => `
    <div class="admin-meal-item">
      <div class="admin-meal-info" style="flex:1"><h4>${side.name}</h4><p>+N${side.price.toLocaleString()}</p></div>
      <div class="admin-meal-actions">
        <button class="btn-delete" onclick="confirmDeleteSide('${side.id}', '${side.name.replace(/'/g, "\\'")}')" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function confirmDeleteSide(id, name) {
  if (confirm('Delete side "' + name + '"?')) {
    deleteSide(id).then(() => { showToast('Side deleted!'); loadAllData(); });
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
      <div class="inquiry-header"><h4>${inq.name}</h4><span>${new Date(inq.date).toLocaleDateString()}</span></div>
      <p><i class="fas fa-envelope" style="color:var(--accent);margin-right:4px"></i> ${inq.email}</p>
      <p><i class="fas fa-tag" style="color:var(--primary);margin-right:4px"></i> ${inq.subject}</p>
      <div class="inquiry-msg">${inq.message}</div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
  renderInquiries();
  document.querySelector('.admin-form').addEventListener('submit', handleAddMeal);
  document.getElementById('galleryForm').addEventListener('submit', handleAddGallery);
  document.getElementById('extraForm').addEventListener('submit', handleAddExtra);
  document.getElementById('sideForm').addEventListener('submit', handleAddSide);
  document.getElementById('resetMealsBtn')?.addEventListener('click', resetMeals);
  window.editMeal = editMeal;
  window.confirmDeleteMeal = confirmDeleteMeal;
  window.editGalleryItem = editGalleryItem;
  window.moveGalleryToMeal = moveGalleryToMeal;
  window.confirmDeleteGallery = confirmDeleteGallery;
  window.confirmDeleteExtra = confirmDeleteExtra;
  window.confirmDeleteSide = confirmDeleteSide;
  window.seedDatabase = seedDatabase;
  window.resetMealForm = resetMealForm;
  window.resetGalleryForm = resetGalleryForm;
  window.resetMeals = resetMeals;
});