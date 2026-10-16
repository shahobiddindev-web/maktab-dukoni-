/**
 * Maktab do'koni ilovasi - Asosiy logika va interaktiv boshqaruv
 */

// Ilova holati (State)
let products = [];
let cart = [];
let currentCategory = 'all';
let searchQuery = '';
let sortBy = 'featured';
let priceFilter = 350000;
let inStockOnly = false;
let currentView = 'grid'; // 'grid' | 'table'

// Valyuta formatlash (masalan: 12 500 so'm)
function formatMoney(amount) {
  return Number(amount).toLocaleString('uz-UZ').replace(/,/g, ' ') + " so'm";
}

// Boshlang'ich ma'lumotlarni yuklash
function initApp() {
  const savedProducts = localStorage.getItem('maktab_products');
  if (savedProducts) {
    try {
      products = JSON.parse(savedProducts);
    } catch (e) {
      products = [...INITIAL_PRODUCTS];
    }
  } else {
    products = [...INITIAL_PRODUCTS];
    localStorage.setItem('maktab_products', JSON.stringify(products));
  }

  const savedCart = localStorage.getItem('maktab_cart');
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (e) {
      cart = [];
    }
  }

  // Narx slayderi maksimal qiymatini aniqlash
  const highestPrice = Math.max(...products.map(p => p.price), 300000);
  const priceSlider = document.getElementById('priceRange');
  if (priceSlider) {
    priceSlider.max = Math.ceil(highestPrice / 10000) * 10000;
    priceSlider.value = priceSlider.max;
    priceFilter = Number(priceSlider.value);
    document.getElementById('priceRangeValue').textContent = formatMoney(priceFilter);
  }

  renderCategories();
  renderProducts();
  updateCartBadge();
  setupEventListeners();

  if (window.lucide) {
    lucide.createIcons();
  }
}

// Kategoriya tugmachalarini chizish
function renderCategories() {
  const container = document.getElementById('categoriesContainer');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat => {
    const count = cat.id === 'all' 
      ? products.length 
      : products.filter(p => p.category === cat.id).length;
    const isActive = currentCategory === cat.id;

    return `
      <button 
        onclick="selectCategory('${cat.id}')"
        class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
          isActive 
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-600/30' 
            : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 shadow-sm'
        }"
      >
        <i data-lucide="${cat.icon}" class="w-4 h-4"></i>
        <span>${cat.name}</span>
        <span class="text-xs px-2 py-0.5 rounded-full ${
          isActive ? 'bg-blue-700/60 text-white' : 'bg-slate-100 text-slate-600'
        }">${count}</span>
      </button>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function selectCategory(categoryId) {
  currentCategory = categoryId;
  renderCategories();
  renderProducts();
}

// Mahsulotlarni filtrlash va saralash
function getFilteredProducts() {
  return products.filter(product => {
    // Kategoriya tekshiruvi
    const matchesCategory = currentCategory === 'all' || product.category === currentCategory;

    // Qidiruv tekshiruvi (nomi, kodi, tavsifi)
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      product.name.toLowerCase().includes(q) || 
      product.code.toLowerCase().includes(q) || 
      (product.description && product.description.toLowerCase().includes(q));

    // Narx tekshiruvi
    const matchesPrice = product.price <= priceFilter;

    // Mavjudlik tekshiruvi
    const matchesStock = !inStockOnly || product.stock > 0;

    return matchesCategory && matchesSearch && matchesPrice && matchesStock;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'rating-desc') return b.rating - a.rating;
    if (sortBy === 'stock-desc') return b.stock - a.stock;
    return a.id - b.id; // Tavsiya etilgan
  });
}

// Mahsulotlar ro'yxatini chiqarish
function renderProducts() {
  const container = document.getElementById('productsContainer');
  const countDisplay = document.getElementById('productsCountDisplay');
  const items = getFilteredProducts();

  if (countDisplay) {
    countDisplay.textContent = `${items.length} ta mahsulot topildi`;
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <div class="w-16 h-16 mx-auto mb-4 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
          <i data-lucide="package-search" class="w-8 h-8"></i>
        </div>
        <h3 class="text-lg font-bold text-slate-800">Bunday mahsulot topilmadi</h3>
        <p class="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Qidiruv so'zini o'zgartiring yoki filtrlarni (kategoriya, narx chegarasi) tozalang.
        </p>
        <button 
          onclick="resetFilters()"
          class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
        >
          Filtrlarni tozalash
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  if (currentView === 'grid') {
    container.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";
    container.innerHTML = items.map(product => {
      const isDiscount = product.oldPrice && product.oldPrice > product.price;
      const discountPercent = isDiscount ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
      const isOutOfStock = product.stock <= 0;
      const isLowStock = product.stock > 0 && product.stock <= 15;

      return `
        <div class="product-card bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-lg flex flex-col overflow-hidden group">
          <!-- Rasm va teglar -->
          <div class="relative h-48 bg-slate-100 overflow-hidden cursor-pointer" onclick="openProductDetail(${product.id})">
            <img 
              src="${product.image}" 
              alt="${product.name}" 
              loading="lazy"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onerror="this.src='https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=500&q=80'"
            />
            
            <div class="absolute top-3 left-3 flex flex-col gap-1">
              ${product.badge ? `
                <span class="px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide uppercase bg-blue-600 text-white shadow-sm">
                  ${product.badge}
                </span>
              ` : ''}
              ${isDiscount ? `
                <span class="px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-500 text-white shadow-sm">
                  -${discountPercent}%
                </span>
              ` : ''}
            </div>

            <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-mono font-bold text-slate-700 shadow-sm border border-slate-200/50">
              ${product.code}
            </div>

            <!-- Tezkor ko'rish tugmasi hover paytida -->
            <button 
              class="absolute inset-0 m-auto w-10 h-10 bg-white/90 text-slate-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-white hover:text-blue-600"
              title="Batafsil ma'lumot"
            >
              <i data-lucide="eye" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Ma'lumot qismi -->
          <div class="p-4 flex-1 flex flex-col justify-between">
            <div>
              <!-- Kategoriya va reyting -->
              <div class="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span class="font-medium uppercase tracking-wider text-blue-600">${getCategoryName(product.category)}</span>
                <span class="flex items-center gap-1 font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                  <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i>
                  ${product.rating}
                  <span class="text-slate-400 font-normal">(${product.reviews})</span>
                </span>
              </div>

              <!-- Nomi -->
              <h4 
                onclick="openProductDetail(${product.id})"
                class="font-bold text-slate-900 line-clamp-2 hover:text-blue-600 transition cursor-pointer text-base leading-snug" 
                title="${product.name}"
              >
                ${product.name}
              </h4>

              <!-- Qisqa tavsif -->
              <p class="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                ${product.description || ''}
              </p>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100">
              <!-- Qoldiq statusi -->
              <div class="flex items-center justify-between text-xs mb-2">
                ${isOutOfStock 
                  ? `<span class="text-rose-600 font-semibold flex items-center gap-1"><i data-lucide="alert-circle" class="w-3 h-3"></i> Qolmagan</span>`
                  : isLowStock 
                    ? `<span class="text-amber-600 font-semibold flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> Kam qoldi (${product.stock} ${product.unit})</span>`
                    : `<span class="text-emerald-600 font-medium flex items-center gap-1"><i data-lucide="check-circle" class="w-3 h-3"></i> Mavjud: ${product.stock} ${product.unit}</span>`
                }
              </div>

              <!-- Narx va Savatga tugmasi -->
              <div class="flex items-center justify-between gap-2">
                <div>
                  <div class="text-lg font-extrabold text-slate-900 leading-tight">
                    ${formatMoney(product.price)}
                  </div>
                  ${isDiscount ? `
                    <div class="text-xs text-slate-400 line-through">
                      ${formatMoney(product.oldPrice)}
                    </div>
                  ` : ''}
                </div>

                <button 
                  onclick="addToCart(${product.id})"
                  ${isOutOfStock ? 'disabled' : ''}
                  class="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition duration-200 ${
                    isOutOfStock 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95'
                  }"
                  title="Savatchaga qo'shish"
                >
                  <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                  <span>Qo'shish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    // Jadval (Narxnoma / Price List) ko'rinishi
    container.className = "w-full overflow-x-auto bg-white rounded-2xl border border-slate-200/90 shadow-sm";
    container.innerHTML = `
      <table class="w-full text-left text-sm text-slate-700">
        <thead class="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
          <tr>
            <th class="py-3.5 px-4">Artikul</th>
            <th class="py-3.5 px-4">Mahsulot nomi</th>
            <th class="py-3.5 px-4">Kategoriya</th>
            <th class="py-3.5 px-4 text-center">Birlik</th>
            <th class="py-3.5 px-4 text-center">Mavjudlik</th>
            <th class="py-3.5 px-4 text-right">Narxi</th>
            <th class="py-3.5 px-4 text-right">Amal</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${items.map(p => `
            <tr class="hover:bg-slate-50/80 transition">
              <td class="py-3 px-4 font-mono text-xs font-bold text-slate-600">${p.code}</td>
              <td class="py-3 px-4 font-semibold text-slate-900">
                <div class="flex items-center gap-3">
                  <img src="${p.image}" class="w-9 h-9 rounded-lg object-cover border border-slate-200" onerror="this.src='https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=100&q=80'" />
                  <div>
                    <span class="hover:text-blue-600 cursor-pointer" onclick="openProductDetail(${p.id})">${p.name}</span>
                    ${p.badge ? `<span class="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">${p.badge}</span>` : ''}
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 text-slate-500">${getCategoryName(p.category)}</td>
              <td class="py-3 px-4 text-center text-slate-500">${p.unit}</td>
              <td class="py-3 px-4 text-center">
                <span class="px-2 py-1 rounded-full text-xs font-semibold ${
                  p.stock > 15 ? 'bg-emerald-50 text-emerald-700' : p.stock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                }">
                  ${p.stock > 0 ? `${p.stock} ${p.unit}` : 'Qolmagan'}
                </span>
              </td>
              <td class="py-3 px-4 text-right">
                <span class="font-bold text-slate-900">${formatMoney(p.price)}</span>
                ${p.oldPrice && p.oldPrice > p.price ? `<div class="text-[11px] text-slate-400 line-through">${formatMoney(p.oldPrice)}</div>` : ''}
              </td>
              <td class="py-3 px-4 text-right">
                <button 
                  onclick="addToCart(${p.id})"
                  ${p.stock <= 0 ? 'disabled' : ''}
                  class="p-2 rounded-xl text-xs font-semibold transition ${
                    p.stock <= 0 ? 'text-slate-300' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  }"
                  title="Savatga qo'shish"
                >
                  <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  if (window.lucide) lucide.createIcons();
}

function getCategoryName(categoryId) {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  return cat ? cat.name : categoryId;
}

// Savatchani boshqarish
function addToCart(productId, count = 1) {
  const product = products.find(p => p.id === productId);
  if (!product || product.stock <= 0) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    if (existing.quantity + count <= product.stock) {
      existing.quantity += count;
    } else {
      showToast(`Kechirasiz, omborda bor-yo'g'i ${product.stock} dona mavjud!`, "warning");
      return;
    }
  } else {
    cart.push({ id: productId, quantity: count });
  }

  saveCart();
  updateCartBadge();
  showToast(`"${product.name}" savatchaga qo'shildi!`, "success");
}

function updateCartQuantity(productId, delta) {
  const index = cart.find(item => item.id === productId);
  const product = products.find(p => p.id === productId);
  if (!index || !product) return;

  const newQty = index.quantity + delta;
  if (newQty <= 0) {
    cart = cart.filter(item => item.id !== productId);
  } else if (newQty > product.stock) {
    showToast(`Omborda faqat ${product.stock} dona bor`, "warning");
    return;
  } else {
    index.quantity = newQty;
  }

  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function clearCart() {
  if (confirm("Haqiqatan ham savatchani tozalamoqchimisiz?")) {
    cart = [];
    saveCart();
    updateCartBadge();
    renderCartDrawer();
    showToast("Savatcha tozalandi", "info");
  }
}

function saveCart() {
  localStorage.setItem('maktab_cart', JSON.stringify(cart));
}

function updateCartBadge() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById('cartBadge');
  const countBadge = document.getElementById('cartFloatingCount');
  
  if (badge) {
    badge.textContent = totalItems;
    badge.classList.toggle('hidden', totalItems === 0);
  }
  if (countBadge) {
    countBadge.textContent = totalItems;
  }
}

// Savatcha panelini chiqarish
function toggleCartDrawer(open = true) {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartBackdrop');
  if (open) {
    renderCartDrawer();
    drawer.classList.remove('translate-x-full');
    backdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } else {
    drawer.classList.add('translate-x-full');
    backdrop.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
}

function renderCartDrawer() {
  const listContainer = document.getElementById('cartItemsList');
  const subtotalEl = document.getElementById('cartSubtotal');
  const totalEl = document.getElementById('cartTotal');
  const discountSavingsEl = document.getElementById('cartDiscountSavings');

  if (cart.length === 0) {
    listContainer.innerHTML = `
      <div class="py-16 text-center text-slate-500">
        <div class="w-16 h-16 mx-auto mb-3 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
          <i data-lucide="shopping-bag" class="w-8 h-8"></i>
        </div>
        <p class="font-semibold text-slate-700">Savatchangiz bo'sh</p>
        <p class="text-xs text-slate-400 mt-1">Dars qurollari va kerakli daftarlarni qo'shing</p>
      </div>
    `;
    subtotalEl.textContent = "0 so'm";
    totalEl.textContent = "0 so'm";
    if (discountSavingsEl) discountSavingsEl.textContent = "0 so'm";
    if (window.lucide) lucide.createIcons();
    return;
  }

  let subtotal = 0;
  let fullRegularTotal = 0;

  listContainer.innerHTML = cart.map(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return '';

    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;
    fullRegularTotal += (product.oldPrice || product.price) * item.quantity;

    return `
      <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <img 
          src="${product.image}" 
          class="w-14 h-14 object-cover rounded-lg border border-slate-200" 
          onerror="this.src='https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=150&q=80'"
        />
        <div class="flex-1 min-w-0">
          <h5 class="text-xs font-bold text-slate-800 truncate" title="${product.name}">${product.name}</h5>
          <div class="text-[11px] text-slate-500 font-mono">${product.code}</div>
          <div class="text-xs font-bold text-blue-600 mt-0.5">${formatMoney(product.price)}</div>
        </div>

        <div class="flex flex-col items-end gap-1.5">
          <button 
            onclick="removeFromCart(${product.id})"
            class="text-slate-400 hover:text-rose-500 p-1"
            title="O'chirish"
          >
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
          
          <div class="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
            <button 
              onclick="updateCartQuantity(${product.id}, -1)" 
              class="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100"
            >-</button>
            <span class="w-7 text-center text-xs font-bold text-slate-800">${item.quantity}</span>
            <button 
              onclick="updateCartQuantity(${product.id}, 1)" 
              class="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100"
            >+</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const savings = Math.max(0, fullRegularTotal - subtotal);
  subtotalEl.textContent = formatMoney(subtotal);
  totalEl.textContent = formatMoney(subtotal);
  if (discountSavingsEl) {
    discountSavingsEl.textContent = formatMoney(savings);
  }

  if (window.lucide) lucide.createIcons();
}

// Mahsulot tafsilotlari modali
function openProductDetail(productId) {
  const p = products.find(item => item.id === productId);
  if (!p) return;

  const modal = document.getElementById('productDetailModal');
  const body = document.getElementById('productDetailContent');

  const isDiscount = p.oldPrice && p.oldPrice > p.price;
  const discountPercent = isDiscount ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

  body.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <div class="relative bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 aspect-square">
        <img 
          src="${p.image}" 
          alt="${p.name}" 
          class="w-full h-full object-cover"
          onerror="this.src='https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80'"
        />
        ${p.badge ? `<span class="absolute top-4 left-4 px-3 py-1 bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow">${p.badge}</span>` : ''}
        ${isDiscount ? `<span class="absolute top-4 right-4 px-2.5 py-1 bg-rose-500 text-white font-bold text-xs rounded-lg shadow">-${discountPercent}%</span>` : ''}
      </div>

      <div class="flex flex-col">
        <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span class="font-bold text-blue-600 uppercase tracking-wider">${getCategoryName(p.category)}</span>
          <span class="font-mono bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 font-semibold">Artikul: ${p.code}</span>
        </div>

        <h3 class="text-xl font-bold text-slate-900 leading-snug">${p.name}</h3>

        <div class="flex items-center gap-2 mt-2">
          <div class="flex text-amber-400">
            ${Array.from({length: 5}, (_, i) => `
              <i data-lucide="star" class="w-4 h-4 ${i < Math.floor(p.rating) ? 'fill-amber-400' : 'text-slate-300'}"></i>
            `).join('')}
          </div>
          <span class="text-xs font-bold text-slate-700">${p.rating}</span>
          <span class="text-xs text-slate-400">(${p.reviews} ta sharh)</span>
        </div>

        <div class="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-baseline justify-between">
          <div>
            <div class="text-xs text-slate-400">Mahsulot narxi:</div>
            <div class="text-2xl font-extrabold text-slate-900">${formatMoney(p.price)}</div>
            ${isDiscount ? `<div class="text-xs text-slate-400 line-through">${formatMoney(p.oldPrice)}</div>` : ''}
          </div>
          <div class="text-right">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold ${
              p.stock > 15 ? 'bg-emerald-100 text-emerald-800' : p.stock > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
            }">
              ${p.stock > 0 ? `Omborda: ${p.stock} ${p.unit}` : 'Qolmagan'}
            </span>
          </div>
        </div>

        <div class="mt-4">
          <h5 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Tavsif:</h5>
          <p class="text-sm text-slate-600 leading-relaxed">${p.description}</p>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
          <button 
            onclick="addToCart(${p.id}); closeModal('productDetailModal')"
            ${p.stock <= 0 ? 'disabled' : ''}
            class="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition ${
              p.stock <= 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 active:scale-98'
            }"
          >
            <i data-lucide="shopping-cart" class="w-4 h-4"></i>
            <span>Savatchaga qo'shish</span>
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

// Narxnoma / Price List Modal (Chop etish uchun qulay)
function openPriceListModal() {
  const modal = document.getElementById('priceListModal');
  const tableBody = document.getElementById('priceListTableBody');
  const dateEl = document.getElementById('priceListDate');
  const totalCountEl = document.getElementById('priceListTotalCount');
  const totalValueEl = document.getElementById('priceListTotalValue');

  if (dateEl) {
    const today = new Date();
    dateEl.textContent = today.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const sortedList = [...products].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  let totalInventoryValue = 0;

  tableBody.innerHTML = sortedList.map((p, index) => {
    totalInventoryValue += p.price * p.stock;
    return `
      <tr class="border-b border-slate-200">
        <td class="py-2 px-3 text-center text-xs text-slate-400 font-mono">${index + 1}</td>
        <td class="py-2 px-3 font-mono text-xs font-semibold text-slate-700">${p.code}</td>
        <td class="py-2 px-3 font-semibold text-slate-900">${p.name}</td>
        <td class="py-2 px-3 text-xs text-slate-600">${getCategoryName(p.category)}</td>
        <td class="py-2 px-3 text-center text-xs text-slate-600">${p.unit}</td>
        <td class="py-2 px-3 text-center text-xs font-semibold ${p.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}">${p.stock}</td>
        <td class="py-2 px-3 text-right font-bold text-slate-900">${formatMoney(p.price)}</td>
      </tr>
    `;
  }).join('');

  if (totalCountEl) totalCountEl.textContent = `${sortedList.length} ta tur`;
  if (totalValueEl) totalValueEl.textContent = formatMoney(totalInventoryValue);

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

// Narxnomani chop etish
function printPriceList() {
  window.print();
}

// Yangi mahsulot qo'shish modali
function openAddProductModal() {
  const form = document.getElementById('addProductForm');
  form.reset();
  document.getElementById('addProductModal').classList.remove('hidden');
}

function handleAddProductSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('newProdName').value.trim();
  const code = document.getElementById('newProdCode').value.trim() || `MB-${Math.floor(1000 + Math.random() * 9000)}`;
  const category = document.getElementById('newProdCategory').value;
  const price = Number(document.getElementById('newProdPrice').value);
  const oldPrice = Number(document.getElementById('newProdOldPrice').value) || null;
  const stock = Number(document.getElementById('newProdStock').value);
  const unit = document.getElementById('newProdUnit').value.trim() || 'dona';
  const badge = document.getElementById('newProdBadge').value.trim();
  const description = document.getElementById('newProdDescription').value.trim();
  const image = document.getElementById('newProdImage').value.trim() || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=500&q=80';

  if (!name || price <= 0) {
    showToast("Iltimos, mahsulot nomi va narxini to'g'ri kiriting!", "error");
    return;
  }

  const newProduct = {
    id: Date.now(),
    code,
    name,
    category,
    price,
    oldPrice,
    stock,
    unit,
    image,
    badge,
    rating: 5.0,
    reviews: 1,
    description: description || "Maktab o'quvchilari uchun maxsus tavsiya etilgan dars quroli."
  };

  products.unshift(newProduct);
  localStorage.setItem('maktab_products', JSON.stringify(products));

  renderCategories();
  renderProducts();
  closeModal('addProductModal');
  showToast("Yangi mahsulot katalogga muvaffaqiyatli qo'shildi!", "success");
}

// Standart mahsulotlarni qayta tiklash
function resetToDefaults() {
  if (confirm("Katalogdagi barcha ma'lumotlarni boshlang'ich holatiga qaytarishni xohlaysizmi?")) {
    products = [...INITIAL_PRODUCTS];
    localStorage.setItem('maktab_products', JSON.stringify(products));
    renderCategories();
    renderProducts();
    showToast("Katalog boshlang'ich holatga qaytarildi", "info");
  }
}

// Buyurtma berish modali
function openCheckoutModal() {
  if (cart.length === 0) {
    showToast("Savatchangiz bo'sh!", "warning");
    return;
  }
  toggleCartDrawer(false);
  const modal = document.getElementById('checkoutModal');
  const summaryEl = document.getElementById('checkoutSummary');

  const total = cart.reduce((sum, item) => {
    const p = products.find(x => x.id === item.id);
    return sum + (p ? p.price * item.quantity : 0);
  }, 0);

  summaryEl.innerHTML = `
    <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 space-y-2">
      <div class="flex justify-between text-xs text-slate-500 font-bold uppercase">
        <span>Mahsulot</span>
        <span>Jami</span>
      </div>
      <div class="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
        ${cart.map(item => {
          const p = products.find(x => x.id === item.id);
          if (!p) return '';
          return `
            <div class="py-1.5 flex justify-between text-xs">
              <span class="text-slate-800 font-medium truncate max-w-[200px]">${p.name} <b class="text-blue-600">x${item.quantity}</b></span>
              <span class="font-bold text-slate-900">${formatMoney(p.price * item.quantity)}</span>
            </div>
          `;
        }).join('')}
      </div>
      <div class="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
        <span>To'lov summasi:</span>
        <span class="text-blue-600">${formatMoney(total)}</span>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

// Buyurtmani yakunlash (Telegram yoki Chek chiqarish)
function submitOrder(channel = 'telegram') {
  const name = document.getElementById('orderCustomerName').value.trim();
  const phone = document.getElementById('orderPhone').value.trim();
  const grade = document.getElementById('orderGrade').value.trim();
  const deliveryType = (document.querySelector('input[name="deliveryMethod"]:checked') || {}).value || 'pickup';
  const notes = document.getElementById('orderNotes').value.trim();

  if (!name || !phone) {
    showToast("Iltimos, ismingiz va telefon raqamingizni kiriting!", "warning");
    return;
  }

  const total = cart.reduce((sum, item) => {
    const p = products.find(x => x.id === item.id);
    return sum + (p ? p.price * item.quantity : 0);
  }, 0);

  // Buyurtma matnini shakllantirish
  let message = `🛒 **MAKTAB DO'KONI BUYURTMASI**\n\n`;
  message += `👤 **O'quvchi/Xaridor:** ${name}\n`;
  message += `📞 **Tel:** ${phone}\n`;
  if (grade) message += `🏫 **Sinf:** ${grade}\n`;
  message += `🚚 **Usul:** ${deliveryType === 'pickup' ? "Do'kondan olib ketish" : "Sinfga yetkazish"}\n`;
  if (notes) message += `📝 **Izoh:** ${notes}\n`;
  message += `\n📦 **Mahsulotlar ro'yxati:**\n`;

  cart.forEach((item, index) => {
    const p = products.find(x => x.id === item.id);
    if (p) {
      message += `${index + 1}. ${p.name} — ${item.quantity} ${p.unit} x ${formatMoney(p.price)} = ${formatMoney(p.price * item.quantity)}\n`;
    }
  });

  message += `\n💰 **JAMI SUMMA: ${formatMoney(total)}**\n`;
  message += `Sana: ${new Date().toLocaleString('uz-UZ')}`;

  if (channel === 'telegram') {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
  } else if (channel === 'copy') {
    navigator.clipboard.writeText(message);
    showToast("Buyurtma matni nusxalandi!", "success");
  }

  // Savatni tozalash va yopish
  cart = [];
  saveCart();
  updateCartBadge();
  closeModal('checkoutModal');
  showToast("Buyurtmangiz qabul qilindi! Rahmat!", "success");
}

// Modalni yopish yordamchisi
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

// Filtrlarni tozalash
function resetFilters() {
  currentCategory = 'all';
  searchQuery = '';
  document.getElementById('searchInput').value = '';
  sortBy = 'featured';
  document.getElementById('sortSelect').value = 'featured';
  inStockOnly = false;
  document.getElementById('stockOnlyCheckbox').checked = false;
  
  const priceSlider = document.getElementById('priceRange');
  if (priceSlider) {
    priceSlider.value = priceSlider.max;
    priceFilter = Number(priceSlider.value);
    document.getElementById('priceRangeValue').textContent = formatMoney(priceFilter);
  }

  renderCategories();
  renderProducts();
}

// Toast xabarlari
function showToast(text, type = "info") {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const bgColors = {
    success: 'bg-emerald-600 text-white',
    warning: 'bg-amber-500 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-slate-800 text-white'
  };

  const icons = {
    success: 'check-circle-2',
    warning: 'alert-triangle',
    error: 'x-circle',
    info: 'info'
  };

  const toast = document.createElement('div');
  toast.className = `toast-enter flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    <i data-lucide="${icons[type] || 'info'}" class="w-4 h-4"></i>
    <span>${text}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// Event listenerlar
function setupEventListeners() {
  // Qidiruv
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderProducts();
    });
  }

  // Saralash
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderProducts();
    });
  }

  // Narx filtri
  const priceRange = document.getElementById('priceRange');
  if (priceRange) {
    priceRange.addEventListener('input', (e) => {
      priceFilter = Number(e.target.value);
      document.getElementById('priceRangeValue').textContent = formatMoney(priceFilter);
      renderProducts();
    });
  }

  // Omborda borlari filtri
  const stockCheckbox = document.getElementById('stockOnlyCheckbox');
  if (stockCheckbox) {
    stockCheckbox.addEventListener('change', (e) => {
      inStockOnly = e.target.checked;
      renderProducts();
    });
  }

  // Ko'rinish almashtirish (Grid / Table)
  const viewGridBtn = document.getElementById('viewGridBtn');
  const viewTableBtn = document.getElementById('viewTableBtn');

  if (viewGridBtn && viewTableBtn) {
    viewGridBtn.addEventListener('click', () => {
      currentView = 'grid';
      viewGridBtn.className = "p-2 rounded-lg bg-blue-600 text-white shadow-sm";
      viewTableBtn.className = "p-2 rounded-lg bg-white text-slate-500 hover:text-slate-800 border border-slate-200";
      renderProducts();
    });

    viewTableBtn.addEventListener('click', () => {
      currentView = 'table';
      viewTableBtn.className = "p-2 rounded-lg bg-blue-600 text-white shadow-sm";
      viewGridBtn.className = "p-2 rounded-lg bg-white text-slate-500 hover:text-slate-800 border border-slate-200";
      renderProducts();
    });
  }

  // Yangi mahsulot formasi
  const addForm = document.getElementById('addProductForm');
  if (addForm) {
    addForm.addEventListener('submit', handleAddProductSubmit);
  }
}

// Dasturni ishga tushirish
document.addEventListener('DOMContentLoaded', initApp);
