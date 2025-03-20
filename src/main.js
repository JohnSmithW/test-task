import './style.css';

async function fetchProducts() {
    try {
        const response = await fetch('/data/products.json');
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const img = new Image();
    img.className = 'lazy';
    img.dataset.src = product.image.desktop;
    img.alt = product.name;
    img.style.height = `${200 + Math.random() * 100}px`;

    const content = document.createElement('div');
    content.className = 'content';

    const fullStars = Math.floor(product.rating);
    const hasHalfStar = (product.rating % 1) >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    content.innerHTML = `
  <h3>${product.name}</h3>
  <div class="price">$${product.price.toFixed(2)}</div>
  <div class="rating">
    ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}
    <span class="rating-number">(${product.rating})</span>
  </div>
  <div class="category">${product.category}</div>
  <p>${product.description?.substring(0, 80) || ''}...</p>
`;

    card.append(img, content);
    return card;
}

function renderProducts(products, container) {
    container.innerHTML = '';
    products.forEach((product, index) => {
        const card = createProductCard(product);
        card.style.setProperty('--index', index % 20);
        container.appendChild(card);
    });
    lazyLoadImages();
}

function lazyLoadImages() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img.lazy').forEach(img => observer.observe(img));
}

function sortProducts(products, key) {
    return [...products].sort((a, b) => key === 'price' ? a.price - b.price :
        key === 'rating' ? b.rating - a.rating :
            a.name.localeCompare(b.name));
}

function filterProducts(products, category, min, max) {
    return products.filter(p =>
        (!category || p.category === category) &&
        (!min || p.price >= min) &&
        (!max || p.price <= max)
    );
}

async function init() {
    const data = await fetchProducts();
    if (!data) return;

    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="filters">
      <select class="category">
        <option value="">All Categories</option>
        ${data.categories.map(c => `<option>${c}</option>`).join('')}
      </select>
      <input type="number" class="min" placeholder="Min price">
      <input type="number" class="max" placeholder="Max price">
      <select class="sort">
        <option value="">Sort by</option>
        <option value="price">Price</option>
        <option value="rating">Rating</option>
        <option value="name">Name</option>
      </select>
      <button class="apply">Apply</button>
    </div>
    <div class="product-grid masonry"></div>
  `;

    const grid = app.querySelector('.product-grid');
    const update = () => {
        const category = app.querySelector('.category').value;
        const min = parseFloat(app.querySelector('.min').value);
        const max = parseFloat(app.querySelector('.max').value);
        const sortKey = app.querySelector('.sort').value;

        let filtered = filterProducts(data.products, category, min, max);
        filtered = sortProducts(filtered, sortKey);
        renderProducts(filtered, grid);
    };

    app.querySelector('.apply').addEventListener('click', update);
    renderProducts(data.products, grid);
}

init();