import { getCart, removeFromCart, updateQty, clearCart, getCartTotal, showToast, hidePageLoader } from './main.js';

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

/* ========== NEW CHECKOUT FLOW ========== */

function checkout() {
  const cart = getCart();
  if (cart.length === 0) return;
  const total = getCartTotal() + 500;
  document.getElementById('modalTotal').textContent = 'N' + total.toLocaleString();
  document.getElementById('paymentModal').classList.add('active');
  document.getElementById('paymentStep1').style.display = 'block';
  document.getElementById('paymentStep2').style.display = 'none';
  document.body.style.overflow = 'hidden';
}

function closePaymentModal() {
  document.getElementById('paymentModal').classList.remove('active');
  document.body.style.overflow = '';
}

function showPaymentSent() {
  document.getElementById('paymentStep1').style.display = 'none';
  document.getElementById('paymentStep2').style.display = 'block';
}

function copyAccountNumber() {
  const acc = '5288079233';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(acc).then(() => showToast('Account number copied!'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = acc;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Account number copied!');
  }
}

function completeOrderOnWhatsApp() {
  const cart = getCart();
  const subtotal = getCartTotal();
  const delivery = 500;
  const total = subtotal + delivery;
  
  let msg = `🍽️ *New Order from Ty's Food Spot*\n\n*Order Items:*\n`;
  cart.forEach((item, i) => {
    const extraTotal = (item.extras || []).reduce((s, e) => s + e.price, 0);
    const sideTotal = (item.sides || []).reduce((s, s2) => s + s2.price, 0);
    const unitPrice = item.price + extraTotal + sideTotal;
    const lineTotal = unitPrice * item.qty;
    msg += `${i + 1}. ${item.name} x${item.qty} - N${lineTotal.toLocaleString()}\n`;
    if ((item.extras || []).length > 0) msg += `   └ Extras: ${item.extras.map(e => `${e.name} (+N${e.price.toLocaleString()})`).join(', ')}\n`;
    if ((item.sides || []).length > 0) msg += `   └ Sides: ${item.sides.map(s => `${s.name} (+N${s.price.toLocaleString()})`).join(', ')}\n`;
  });
  
  msg += `\n*Subtotal:* N${subtotal.toLocaleString()}\n`;
  msg += `*Delivery Fee:* N${delivery.toLocaleString()}\n`;
  msg += `*Total:* N${total.toLocaleString()}\n\n`;
  msg += `✅ *Payment Status:* I have made payment to Moniepoint Account 5288079233 (Ighere Tracy).\n`;
  msg += `📎 *Please find attached screenshot of transaction as proof of payment.*\n\n`;
  msg += `Thank you!`;
  
  const url = `https://wa.me/2348153218274?text=${encodeURIComponent(msg)}`;
  clearCart();
  renderCart();
  closePaymentModal();
  window.open(url, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    renderCart();
    window.changeQty = changeQty;
    window.removeItem = removeItem;
    window.checkout = checkout;
    window.closePaymentModal = closePaymentModal;
    window.showPaymentSent = showPaymentSent;
    window.copyAccountNumber = copyAccountNumber;
    window.completeOrderOnWhatsApp = completeOrderOnWhatsApp;
  } finally {
    hidePageLoader();
  }
});