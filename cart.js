import { getCart, removeFromCart, updateQty, clearCart, getCartTotal, showToast } from './main.js';

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

  container.innerHTML = cart.map(item => {
    const extraTotal = (item.extras || []).reduce((s, e) => s + e.price, 0);
    const sideTotal = (item.sides || []).reduce((s, s2) => s + s2.price, 0);
    const unitPrice = item.price + extraTotal + sideTotal;
    const lineTotal = unitPrice * item.qty;
    
    let extrasLabel = '';
    if ((item.extras || []).length > 0) extrasLabel = `<div style="font-size:11px;color:#1565c0;margin-top:2px;"><i class="fas fa-plus-circle"></i> ${item.extras.map(e => e.name).join(', ')}</div>`;
    let sidesLabel = '';
    if ((item.sides || []).length > 0) sidesLabel = `<div style="font-size:11px;color:#2d5a2d;margin-top:2px;"><i class="fas fa-leaf"></i> ${item.sides.map(s => s.name).join(', ')}</div>`;
    
    return `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-info" style="flex:1;min-width:0;">
        <div class="cart-item-name">${item.name}</div>
        ${extrasLabel}${sidesLabel}
        <div class="cart-item-price">N${unitPrice.toLocaleString()} each</div>
      </div>
      <div class="cart-qty">
        <button class="qty-btn" onclick="changeQty('${item.cartKey}', -1)"><i class="fas fa-minus"></i></button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty('${item.cartKey}', 1)"><i class="fas fa-plus"></i></button>
      </div>
      <div style="text-align:right;min-width:70px;">
        <div style="font-weight:700;font-size:15px;">N${lineTotal.toLocaleString()}</div>
        <button class="cart-remove" onclick="removeItem('${item.cartKey}')" style="margin-top:4px;"><i class="fas fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');

  const subtotal = getCartTotal();
  document.getElementById('subtotal').textContent = 'N' + subtotal.toLocaleString();
  document.getElementById('total').textContent = 'N' + (subtotal + 500).toLocaleString();
}

function changeQty(cartKey, delta) {
  const cart = getCart();
  const item = cart.find(i => i.cartKey === cartKey);
  if (!item) return;
  const newQty = item.qty + delta;
  if (newQty <= 0) removeFromCart(cartKey);
  else updateQty(cartKey, newQty);
  renderCart();
}

function removeItem(cartKey) {
  removeFromCart(cartKey);
  renderCart();
}

function checkout() {
  if (getCart().length === 0) return;
  showToast('Order placed successfully! Thank you.');
  clearCart();
  renderCart();
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  window.changeQty = changeQty;
  window.removeItem = removeItem;
  window.checkout = checkout;
});