function renderGallery() {
  const meals = getMeals();
  const container = document.getElementById('galleryGrid');
  container.innerHTML = meals.map(meal => `
    <div class="gallery-item" onclick="openLightbox('${meal.image}', '${meal.name}')">
      <img src="${meal.image}" alt="${meal.name}" loading="lazy">
      <div class="gallery-overlay">
        <span class="gallery-name">${meal.name}</span>
      </div>
    </div>
  `).join('');
}

function openLightbox(src, caption) {
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightboxCaption').textContent = caption;
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', renderGallery);
