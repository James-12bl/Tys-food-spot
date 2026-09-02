import {
  getMeals, addMeal, deleteMeal, updateMeal,
  getGallery, addGalleryItem, deleteGalleryItem, updateGalleryItem,
  getExtras, addExtra, deleteExtra,
  getSides, addSide, deleteSide,
  seedDatabase, showToast, getCart, hidePageLoader
} from './main.js';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
let allMeals = [];
let allGallery = [];
let allExtras = [];
let allSides = [];
let editingMealId = null;
let editingGalleryId = null;

function fileToBase64(file, maxBytes = 1500000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        const scale = Math.min(1, maxWidth / img.width || 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas is not supported in this browser.'));
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let quality = 0.82;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        while (dataUrl.length > maxBytes && quality > 0.25) {
          quality -= 0.08;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        if (dataUrl.length > maxBytes) {
          reject(new Error(`Image is still too large after compression (${Math.round(dataUrl.length / 1024)}KB). Use a smaller file.`));
          return;
        }

        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Unable to read image file.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Unable to read selected file.'));
    reader.readAsDataURL(file);
  });
}

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

  if (mealsStat) mealsStat.textContent = String(allMeals.length);
  if (popularStat) popularStat.textContent = String(allMeals.filter(m => m.popular).length);
  if (galleryStat) galleryStat.textContent = String(allGallery.length);
  if (cartStat) cartStat.textContent = String(getCart().reduce((sum, item) => sum + item.qty, 0));
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
  container.innerHTML = allExtras.map(extra => `
    <label class="extra-check">
      <input type="checkbox" data-name="${extra.name}">
      <span>${extra.name} (+N${extra.price.toLocaleString()})</span>
    </label>
  `).join('');
}

function populateSidesSelect() {
  const container = document.getElementById('sidesSelect');
  if (!container) return;
  container.innerHTML = allSides.map(side => `
    <label class="side-check">
      <input type="checkbox" data-name="${side.name}">
      <span>${side.name} (+N${side.price.toLocaleString()})</span>
    </label>
  `).join('');
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

  console.log('[DEBUG] meal form values', {
    name,
    price,
    desc,
    category,
    rating,
    popular,
    extras,
    sides,
    fileSelected: !!(fileInput && fileInput.files && fileInput.files[0])
  });
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
      setMealDebug('Image file loaded successfully and compressed for Firestore size limits.', 'info');
    } catch (err) {
      console.error('[DEBUG] meal image conversion failed', err);
      setMealDebug(`Image read failed: ${err?.message || err}`, 'error');
      showToast('Image read failed: ' + (err?.message || err));
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

  try {
    if (editingMealId) {
      await updateMeal(editingMealId, meal);
      setMealDebug('Meal updated successfully in Firestore.', 'success');
      showToast('Meal updated successfully!');
    } else {
      await addMeal(meal);
      setMealDebug('Meal added successfully to Firestore.', 'success');
      showToast('Meal added successfully!');
    }
    resetMealForm();
    await loadAllData();
  } catch (err) {
    const message = err?.message || String(err);
    console.error('[DEBUG] meal save failed', err);
    setMealDebug(`Meal ${editingMealId ? 'update' : 'add'} failed: ${message}`, 'error');
    showToast(`Meal ${editingMealId ? 'update' : 'add'} failed. Check debug panel.`);
  }
}

function resetMealForm() {
  const form = document.querySelector('.admin-form');
  if (form) form.reset();
  const fileInput = document.getElementById('mImageFile');
  if (fileInput) fileInput.value = '';
  const hiddenImage = document.getElementById('mImageUrl');
  if (hiddenImage) hiddenImage.value = '';
  const rating = document.getElementById('mRating');
  if (rating) rating.value = '4.5';
  const title = document.getElementById('mealFormTitle');
  if (title) title.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Meal';
  const btn = document.getElementById('submitMealBtn');
  if (btn) btn.innerHTML = '<i class="fas fa-plus"></i> Add Meal';
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
  document.getElementById('mPopular').checked = !!meal.popular;
  const title = document.getElementById('mealFormTitle');
  if (title) title.innerHTML = '<i class="fas fa-edit"></i> Edit Meal';
  const btn = document.getElementById('submitMealBtn');
  if (btn) btn.innerHTML = '<i class="fas fa-save"></i> Update Meal';
  document.querySelectorAll('.extra-check input').forEach(cb => {
    cb.checked = (meal.extras || []).some(e => e.name === cb.dataset.name);
  });
  document.querySelectorAll('.side-check input').forEach(cb => {
    cb.checked = (meal.sides || []).some(s => s.name === cb.dataset.name);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderAdminMeals() {
  const container = document.getElementById('adminMealsList');
  if (!container) return;
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
        <button class="btn-move" onclick="moveMealToGallery('${meal.id}')" title="Move to Gallery"><i class="fas fa-images"></i></button>
        <button class="btn-delete" onclick="confirmDeleteMeal('${meal.id}', '${meal.name.replace(/'/g, "\'")}')" title="Delete"><i class="fas fa-trash"></i></button>
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
      showToast('Image read failed: ' + (err?.message || err));
      return;
    }
  }

  const item = { name, caption, image: imageUrl };
  console.log('[DEBUG] final gallery payload being sent', item);

  try {
    if (editingGalleryId) {
      await updateGalleryItem(editingGalleryId, item);
      showToast('Gallery item updated!');
    } else {
      await addGalleryItem(item);
      showToast('Gallery item added!');
    }
    resetGalleryForm();
    await loadAllData();
  } catch (err) {
    console.error('[DEBUG] gallery save failed', err);
    showToast('Gallery save failed. Check console log.');
  }
}

function resetGalleryForm() {
  const form = document.getElementById('galleryForm');
  if (form) form.reset();
  const fileInput = document.getElementById('gImageFile');
  if (fileInput) fileInput.value = '';
  const hiddenImage = document.getElementById('gImageUrl');
  if (hiddenImage) hiddenImage.value = '';
  editingGalleryId = null;
  const title = document.getElementById('galleryFormTitle');
  if (title) title.innerHTML = '<i class="fas fa-images"></i> Add Gallery Item';
  const btn = document.getElementById('submitGalleryBtn');
  if (btn) btn.innerHTML = '<i class="fas fa-plus"></i> Add to Gallery';
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
  const title = document.getElementById('galleryFormTitle');
  if (title) title.innerHTML = '<i class="fas fa-edit"></i> Edit Gallery Item';
  const btn = document.getElementById('submitGalleryBtn');
  if (btn) btn.innerHTML = '<i class="fas fa-save"></i> Update Gallery Item';
  window.scrollTo({ top: document.getElementById('gallerySection').offsetTop - 20, behavior: 'smooth' });
}

function moveGalleryToMeal(id) {
  const item = allGallery.find(g => g.id === id);
  if (!item) return;
  if (!confirm('Copy "' + item.name + '" to the Menu? It will stay in Gallery too.')) return;

  const meal = {
    name: item.name,
    desc: item.caption || item.name,
    price: 0,
    rating: 4.5,
    category: 'grills',
    image: item.image,
    popular: false,
    extras: [],
    sides: []
  };

  addMeal(meal).then(() => {
    showToast('Copied to Menu! Edit the price and details before saving.');
    loadAllData();
  }).catch((err) => {
    console.error('[DEBUG] moveGalleryToMeal failed', err);
    showToast('Copy to Menu failed. Check console log.');
  });
}

function moveMealToGallery(id) {
  const meal = allMeals.find(m => m.id === id);
  if (!meal) return;
  if (!confirm('Copy "' + meal.name + '" to Gallery? It will stay in the Menu too.')) return;

  const item = {
    name: meal.name,
    caption: meal.desc || meal.name,
    image: meal.image
  };

  addGalleryItem(item).then(() => {
    showToast('Copied to Gallery! You can still edit the meal in the Menu.');
    loadAllData();
  }).catch((err) => {
    console.error('[DEBUG] moveMealToGallery failed', err);
    showToast('Copy to Gallery failed. Check console log.');
  });
}

function renderGalleryAdmin() {
  const container = document.getElementById('adminGalleryList');
  if (!container) return;
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
        <button class="btn-move" onclick="moveGalleryToMeal('${item.id}')" title="Move to Menu"><i class="fas fa-utensils"></i></button>
        <button class="btn-delete" onclick="confirmDeleteGallery('${item.id}', '${item.name.replace(/'/g, "\'")}')" title="Delete"><i class="fas fa-trash"></i></button>
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
  if (!container) return;
  if (allExtras.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No extras yet.</p>';
    return;
  }

  container.innerHTML = allExtras.map(extra => `
    <div class="admin-meal-item">
      <div class="admin-meal-info" style="flex:1"><h4>${extra.name}</h4><p>+N${extra.price.toLocaleString()}</p></div>
      <div class="admin-meal-actions">
        <button class="btn-delete" onclick="confirmDeleteExtra('${extra.id}', '${extra.name.replace(/'/g, "\'")}')" title="Delete"><i class="fas fa-trash"></i></button>
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
  if (!container) return;
  if (allSides.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No sides yet.</p>';
    return;
  }

  container.innerHTML = allSides.map(side => `
    <div class="admin-meal-item">
      <div class="admin-meal-info" style="flex:1"><h4>${side.name}</h4><p>+N${side.price.toLocaleString()}</p></div>
      <div class="admin-meal-actions">
        <button class="btn-delete" onclick="confirmDeleteSide('${side.id}', '${side.name.replace(/'/g, "\'")}')" title="Delete"><i class="fas fa-trash"></i></button>
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
  const inquiries = JSON.parse(localStorage.getItem('tys_inquiries') || '[]');
  const container = document.getElementById('inquiriesList');
  if (!container) return;
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
  loadAllData().finally(hidePageLoader);
  renderInquiries();

  const mealForm = document.querySelector('.admin-form');
  if (mealForm) mealForm.addEventListener('submit', handleAddMeal);

  const galleryForm = document.getElementById('galleryForm');
  if (galleryForm) galleryForm.addEventListener('submit', handleAddGallery);

  const extraForm = document.getElementById('extraForm');
  if (extraForm) extraForm.addEventListener('submit', handleAddExtra);

  const sideForm = document.getElementById('sideForm');
  if (sideForm) sideForm.addEventListener('submit', handleAddSide);

  const resetBtn = document.getElementById('resetMealsBtn');
  if (resetBtn) resetBtn.addEventListener('click', resetMeals);

  window.editMeal = editMeal;
  window.confirmDeleteMeal = confirmDeleteMeal;
  window.editGalleryItem = editGalleryItem;
  window.moveGalleryToMeal = moveGalleryToMeal;
  window.moveMealToGallery = moveMealToGallery;
  window.confirmDeleteGallery = confirmDeleteGallery;
  window.confirmDeleteExtra = confirmDeleteExtra;
  window.confirmDeleteSide = confirmDeleteSide;
  window.seedDatabase = seedDatabase;
  window.resetMealForm = resetMealForm;
  window.resetGalleryForm = resetGalleryForm;
  window.resetMeals = resetMeals;
});
