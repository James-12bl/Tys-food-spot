/* ========== FIREBASE IMPORTS ========== */
import { db, mealsRef, galleryRef, extrasRef, sidesRef, getDocs, getDoc, doc, addDoc, setDoc, deleteDoc, updateDoc, query, orderBy, storage, ref, uploadBytes, getDownloadURL } from './firebase-config.js';

/* ========== LOCAL CACHE ========== */
let mealsCache = [];
let galleryCache = [];
let extrasCache = [];
let sidesCache = [];

/* ========== DEFAULT MEALS ========== */
const DEFAULT_MEALS = [
  { name: "Party Jollof Rice & Chicken", desc: "Smoky party jollof with juicy chicken", price: 4500, rating: 4.8, category: "rice", image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400", popular: true, extras: [], sides: [] },
  { name: "Creamy Chicken Pasta", desc: "Creamy, cheesy & so delicious", price: 4000, rating: 4.7, category: "pasta", image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400", popular: true, extras: [], sides: [] },
  { name: "Grilled Tilapia & Plantain", desc: "Grilled tilapia with fried plantain", price: 5000, rating: 4.9, category: "grills", image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400", popular: true, extras: [], sides: [] },
  { name: "Gizzard & Plantain", desc: "Spicy gizzard with fried plantain", price: 4000, rating: 4.6, category: "grills", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400", popular: true, extras: [], sides: [] },
  { name: "Vegetable Soup & Fufu", desc: "Rich vegetable soup with smooth fufu", price: 3500, rating: 4.5, category: "soups", image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400", popular: false, extras: [], sides: [] },
  { name: "Egusi Soup & Pounded Yam", desc: "Traditional egusi with pounded yam", price: 4000, rating: 4.8, category: "soups", image: "https://images.unsplash.com/photo-1606850780554-b55ea2ce99e7?w=400", popular: false, extras: [], sides: [] },
  { name: "Fried Rice & Turkey", desc: "Classic fried rice with grilled turkey", price: 4800, rating: 4.7, category: "rice", image: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400", popular: false, extras: [], sides: [] },
  { name: "Beef Suya Platter", desc: "Spicy grilled beef suya with onions", price: 3500, rating: 4.9, category: "grills", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400", popular: false, extras: [], sides: [] },
  { name: "Fresh Orange Juice", desc: "100% fresh squeezed orange juice", price: 1200, rating: 4.6, category: "drinks", image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400", popular: false, extras: [], sides: [] },
  { name: "Chapman Cocktail", desc: "Refreshing Nigerian Chapman drink", price: 1500, rating: 4.8, category: "drinks", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400", popular: false, extras: [], sides: [] }
];

const DEFAULT_GALLERY = [
  { name: "Special Platter", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400", caption: "Our signature platter" },
  { name: "Grilled Fish", image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400", caption: "Freshly grilled tilapia" },
  { name: "Rice Bowl", image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400", caption: "Party jollof special" }
];

const DEFAULT_EXTRAS = [
  { name: "Extra Beef", price: 1500 },
  { name: "Extra Chicken", price: 1200 },
  { name: "Extra Fish", price: 1800 },
  { name: "Extra Sauce", price: 500 }
];

const DEFAULT_SIDES = [
  { name: "Plantain", price: 500 },
  { name: "Coleslaw", price: 300 },
  { name: "Salad", price: 400 },
  { name: "Moi Moi", price: 600 }
];

/* ========== SEED DATA ========== */
export async function seedDatabase() {
  const mealSnap = await getDocs(mealsRef);
  if (mealSnap.empty) {
    for (const meal of DEFAULT_MEALS) await addDoc(mealsRef, meal);
  }
  const galSnap = await getDocs(galleryRef);
  if (galSnap.empty) {
    for (const item of DEFAULT_GALLERY) await addDoc(galleryRef, item);
  }
  const extraSnap = await getDocs(extrasRef);
  if (extraSnap.empty) {
    for (const extra of DEFAULT_EXTRAS) await addDoc(extrasRef, extra);
  }
  const sideSnap = await getDocs(sidesRef);
  if (sideSnap.empty) {
    for (const side of DEFAULT_SIDES) await addDoc(sidesRef, side);
  }
  showToast('Database seeded with defaults!');
}

/* ========== MEALS ========== */
export async function getMeals() {
  const snap = await getDocs(query(mealsRef, orderBy('name')));
  mealsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return mealsCache;
}
export function getMealsCached() { return mealsCache; }

export async function addMeal(meal) {
  const docRef = await addDoc(mealsRef, meal);
  return { id: docRef.id, ...meal };
}
export async function deleteMeal(id) {
  await deleteDoc(doc(db, "meals", id));
}
export async function updateMeal(id, data) {
  await updateDoc(doc(db, "meals", id), data);
}

/* ========== GALLERY ========== */
export async function getGallery() {
  const snap = await getDocs(query(galleryRef, orderBy('name')));
  galleryCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return galleryCache;
}
export function getGalleryCached() { return galleryCache; }

export async function addGalleryItem(item) {
  const docRef = await addDoc(galleryRef, item);
  return { id: docRef.id, ...item };
}
export async function deleteGalleryItem(id) {
  await deleteDoc(doc(db, "gallery", id));
}
export async function updateGalleryItem(id, data) {
  await updateDoc(doc(db, "gallery", id), data);
}

/* ========== EXTRAS ========== */
export async function getExtras() {
  const snap = await getDocs(query(extrasRef, orderBy('name')));
  extrasCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return extrasCache;
}
export function getExtrasCached() { return extrasCache; }
export async function addExtra(extra) {
  const docRef = await addDoc(extrasRef, extra);
  return { id: docRef.id, ...extra };
}
export async function deleteExtra(id) {
  await deleteDoc(doc(db, "extras", id));
}

/* ========== SIDES ========== */
export async function getSides() {
  const snap = await getDocs(query(sidesRef, orderBy('name')));
  sidesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return sidesCache;
}
export function getSidesCached() { return sidesCache; }
export async function addSide(side) {
  const docRef = await addDoc(sidesRef, side);
  return { id: docRef.id, ...side };
}
export async function deleteSide(id) {
  await deleteDoc(doc(db, "sides", id));
}

/* ========== IMAGE UPLOAD ========== */
export async function uploadImage(file, path) {
  const storageRef = ref(storage, path + '/' + Date.now() + '_' + file.name);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

/* ========== CART ========== */
function saveCart(cart) {
  localStorage.setItem('tys_cart', JSON.stringify(cart));
}

export function addToCart(mealId, selectedExtras = [], selectedSides = []) {
  const meal = mealsCache.find(m => m.id == mealId);
  if (!meal) return;
  let cart = getCart();
  const extraKey = selectedExtras.map(e => e.name).sort().join(',');
  const sideKey = selectedSides.map(s => s.name).sort().join(',');
  const cartKey = mealId + '|' + extraKey + '|' + sideKey;
  
  const existing = cart.find(item => item.cartKey === cartKey);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      cartKey, id: meal.id, name: meal.name, price: meal.price,
      image: meal.image, qty: 1,
      extras: selectedExtras, sides: selectedSides
    });
  }
  saveCart(cart);
  updateCartBadge();
  showToast(meal.name + " added to cart!");
}

export function removeFromCart(cartKey) {
  let cart = getCart();
  cart = cart.filter(item => item.cartKey !== cartKey);
  saveCart(cart);
  updateCartBadge();
}

export function updateQty(cartKey, qty) {
  let cart = getCart();
  const item = cart.find(i => i.cartKey === cartKey);
  if (item) {
    item.qty = qty;
    if (item.qty <= 0) cart = cart.filter(i => i.cartKey !== cartKey);
  }
  saveCart(cart);
  updateCartBadge();
}

export function clearCart() {
  localStorage.removeItem('tys_cart');
  updateCartBadge();
}

export function getCartTotal() {
  return getCart().reduce((sum, item) => {
    const extraTotal = (item.extras || []).reduce((s, e) => s + e.price, 0);
    const sideTotal = (item.sides || []).reduce((s, s2) => s + s2.price, 0);
    return sum + ((item.price + extraTotal + sideTotal) * item.qty);
  }, 0);
}

export function getCart() { return JSON.parse(localStorage.getItem('tys_cart')) || []; }

function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(b => {
    b.textContent = total;
    b.style.display = total > 0 ? 'flex' : 'none';
  });
}

/* ========== TOAST ========== */
export function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast'; toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

export function hidePageLoader() {
  const loader = document.getElementById('pageLoader');
  if (loader) {
    loader.classList.add('is-hidden');
    document.body.classList.remove('is-loading');
  }
}

/* ========== INIT ========== */
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
});