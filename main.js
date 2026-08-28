/* ========== LOCAL STORAGE MEALS ========== */
const DEFAULT_MEALS = [
  {
    id: 1,
    name: "Party Jollof Rice & Chicken",
    desc: "Smoky party jollof with juicy chicken",
    price: 4500,
    rating: 4.8,
    category: "rice",
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400",
    popular: true
  },
  {
    id: 2,
    name: "Creamy Chicken Pasta",
    desc: "Creamy, cheesy & so delicious",
    price: 4000,
    rating: 4.7,
    category: "pasta",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400",
    popular: true
  },
  {
    id: 3,
    name: "Grilled Tilapia & Plantain",
    desc: "Grilled tilapia with fried plantain",
    price: 5000,
    rating: 4.9,
    category: "grills",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400",
    popular: true
  },
  {
    id: 4,
    name: "Gizzard & Plantain",
    desc: "Spicy gizzard with fried plantain",
    price: 4000,
    rating: 4.6,
    category: "grills",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400",
    popular: true
  },
  {
    id: 5,
    name: "Vegetable Soup & Fufu",
    desc: "Rich vegetable soup with smooth fufu",
    price: 3500,
    rating: 4.5,
    category: "soups",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400",
    popular: false
  },
  {
    id: 6,
    name: "Egusi Soup & Pounded Yam",
    desc: "Traditional egusi with pounded yam",
    price: 4000,
    rating: 4.8,
    category: "soups",
    image: "https://images.unsplash.com/photo-1606850780554-b55ea2ce99e7?w=400",
    popular: false
  },
  {
    id: 7,
    name: "Fried Rice & Turkey",
    desc: "Classic fried rice with grilled turkey",
    price: 4800,
    rating: 4.7,
    category: "rice",
    image: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400",
    popular: false
  },
  {
    id: 8,
    name: "Beef Suya Platter",
    desc: "Spicy grilled beef suya with onions",
    price: 3500,
    rating: 4.9,
    category: "grills",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400",
    popular: false
  },
  {
    id: 9,
    name: "Fresh Orange Juice",
    desc: "100% fresh squeezed orange juice",
    price: 1200,
    rating: 4.6,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400",
    popular: false
  },
  {
    id: 10,
    name: "Chapman Cocktail",
    desc: "Refreshing Nigerian Chapman drink",
    price: 1500,
    rating: 4.8,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400",
    popular: false
  }
];

function getMeals() {
  const stored = localStorage.getItem('tys_meals');
  if (!stored) {
    localStorage.setItem('tys_meals', JSON.stringify(DEFAULT_MEALS));
    return DEFAULT_MEALS;
  }
  return JSON.parse(stored);
}

function saveMeals(meals) {
  localStorage.setItem('tys_meals', JSON.stringify(meals));
}

function addMeal(meal) {
  const meals = getMeals();
  meal.id = Date.now();
  meals.push(meal);
  saveMeals(meals);
  return meal;
}

function deleteMeal(id) {
  let meals = getMeals();
  meals = meals.filter(m => m.id != id);
  saveMeals(meals);
}

function updateMeal(updated) {
  let meals = getMeals();
  const idx = meals.findIndex(m => m.id == updated.id);
  if (idx !== -1) {
    meals[idx] = updated;
    saveMeals(meals);
  }
}

/* ========== CART ========== */
function getCart() {
  return JSON.parse(localStorage.getItem('tys_cart')) || [];
}

function saveCart(cart) {
  localStorage.setItem('tys_cart', JSON.stringify(cart));
}

function addToCart(mealId) {
  const meals = getMeals();
  const meal = meals.find(m => m.id == mealId);
  if (!meal) return;
  let cart = getCart();
  const existing = cart.find(item => item.id == mealId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: meal.id, name: meal.name, price: meal.price, image: meal.image, qty: 1 });
  }
  saveCart(cart);
  updateCartBadge();
  showToast(meal.name + " added to cart!");
}

function removeFromCart(mealId) {
  let cart = getCart();
  cart = cart.filter(item => item.id != mealId);
  saveCart(cart);
  updateCartBadge();
}

function updateQty(mealId, qty) {
  let cart = getCart();
  const item = cart.find(i => i.id == mealId);
  if (item) {
    item.qty = qty;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.id != mealId);
    }
  }
  saveCart(cart);
  updateCartBadge();
}

function clearCart() {
  localStorage.removeItem('tys_cart');
  updateCartBadge();
}

function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(b => {
    b.textContent = total;
    b.style.display = total > 0 ? 'flex' : 'none';
  });
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + (item.price * item.qty), 0);
}

/* ========== TOAST ========== */
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ========== INIT ========== */
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
});
