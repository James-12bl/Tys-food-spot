import { getGallery, getGalleryCached, hidePageLoader } from './main.js';

async function renderGallery() {
  const items = getGalleryCached().length > 0 ? getGalleryCached() : await getGallery();
  const container = document.getElementById('galleryGrid');
  if (items.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px;">No gallery items yet.</p>';
    return;
  }
  container.innerHTML = items.map(item => `
    <div class="gallery-item" onclick="openLightbox('${item.image}', '${item.name}')">
      <img src="${item.image}" alt="${item.name}" loading="lazy">
      <div class="gallery-overlay">
        <span class="gallery-name">${item.name}</span>
        ${item.caption ? `<span style="font-size:11px;opacity:0.9;">${item.caption}</span>` : ''}
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

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await renderGallery();
    window.openLightbox = openLightbox;
    window.closeLightbox = closeLightbox;
  } finally {
    hidePageLoader();
  }
});