function renderCart() {
  const cart = getCart();
  const container = document.getElementById('cartItems');
  const emptyEl = document.getElementById('emptyCart');
  const contentEl = document.getElementById('cartContent');

  if (cart.length === 0) {
    contentEl.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }
  contentEl.style.display = 'block';
  emptyEl.style.display = 'none';

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">N${item.price.toLocaleString()}</div>
      </div>
      <div class="cart-qty">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)"><i class="fas fa-minus"></i></button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)"><i class="fas fa-plus"></i></button>
      </div>
      <button class="cart-remove" onclick="removeItem(${item.id})"><i class="fas fa-trash"></i></button>
    </div>
  `).join('');

  const subtotal = getCartTotal();
  document.getElementById('subtotal').textContent = 'N' + subtotal.toLocaleString();
  document.getElementById('total').textContent = 'N' + (subtotal + 500).toLocaleString();
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id == id);
  if (!item) return;
  const newQty = item.qty + delta;
  if (newQty <= 0) {
    removeFromCart(id);
  } else {
    updateQty(id, newQty);
  }
  renderCart();
}

function removeItem(id) {
  removeFromCart(id);
  renderCart();
}

function checkout() {
  const cart = getCart();
  if (cart.length === 0) return;
  showToast('Order placed successfully! Thank you.');
  clearCart();
  renderCart();
}

document.addEventListener('DOMContentLoaded', renderCart);
