const app = {
    cart: [],
    menu: [],
    
    init() {
        this.menu = menuData;
        this.renderMenu(this.menu);
        this.setupEventListeners();
        this.updateCartBadge();
    },
    
    // Core Rendering Methods
    renderMenu(items) {
        const grid = document.getElementById('menuGrid');
        grid.innerHTML = '';
        
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'food-card glass-effect fade-in';
            card.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="card-img" loading="lazy">
                <div class="card-content">
                    <h3 class="card-title">${item.name}</h3>
                    <p class="card-desc">${item.description}</p>
                    <div class="card-footer">
                        <span class="card-price">$${item.price.toFixed(2)}</span>
                        <button class="primary-btn add-btn" aria-label="Add to cart" onclick="app.addToCart(${item.id})">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    renderCart() {
        const container = document.getElementById('cartItemsContainer');
        container.innerHTML = '';

        if (this.cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart-message fade-in">
                    <i class="fa-solid fa-cart-shopping" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3>Your cart is empty</h3>
                    <p>Looks like you haven't added any premium dishes yet.</p>
                </div>
            `;
            document.getElementById('checkoutBtn').disabled = true;
            document.getElementById('checkoutBtn').style.opacity = '0.5';
            document.getElementById('checkoutBtn').style.cursor = 'not-allowed';
            this.updateSummary();
            return;
        }

        document.getElementById('checkoutBtn').disabled = false;
        document.getElementById('checkoutBtn').style.opacity = '1';
        document.getElementById('checkoutBtn').style.cursor = 'pointer';

        this.cart.forEach(item => {
            const el = document.createElement('div');
            el.className = 'cart-item fade-in';
            el.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                </div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="app.updateQuantity(${item.id}, -1)">-</button>
                    <span class="qty-val">${item.quantity}</span>
                    <button class="qty-btn" onclick="app.updateQuantity(${item.id}, 1)">+</button>
                </div>
                <button class="remove-btn" onclick="app.removeFromCart(${item.id})">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            `;
            container.appendChild(el);
        });
        
        this.updateSummary();
    },

    updateSummary() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.05;
        const delivery = subtotal > 0 ? 2.99 : 0;
        const total = subtotal + tax + delivery;

        document.getElementById('subtotalAmount').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('taxAmount').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('deliveryAmount').textContent = `$${delivery.toFixed(2)}`;
        document.getElementById('totalAmount').textContent = `$${total.toFixed(2)}`;
        
        // Update payment screen total preemptively
        document.getElementById('paymentTotalAmount').textContent = `$${total.toFixed(2)}`;
    },

    // Cart Logic
    addToCart(id) {
        const product = this.menu.find(p => p.id === id);
        const existingItem = this.cart.find(item => item.id === id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({ ...product, quantity: 1 });
        }
        
        this.updateCartBadge();
        // Optional: show a micro-toast animation here
    },

    removeFromCart(id) {
        this.cart = this.cart.filter(item => item.id !== id);
        this.updateCartBadge();
        this.renderCart();
    },

    updateQuantity(id, delta) {
        const item = this.cart.find(i => i.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                this.removeFromCart(id);
            } else {
                this.renderCart();
                this.updateCartBadge();
            }
        }
    },

    updateCartBadge() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const badge = document.getElementById('cartBadge');
        badge.textContent = totalItems;
        
        // Animate badge
        badge.style.transform = 'translate(25%, -25%) scale(1.3)';
        setTimeout(() => badge.style.transform = 'translate(25%, -25%) scale(1)', 200);
    },

    // Event Listeners & View Toggling
    setupEventListeners() {
        // Filter Buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const category = e.target.dataset.category;
                if (category === 'all') {
                    this.renderMenu(this.menu);
                } else {
                    this.renderMenu(this.menu.filter(item => item.category === category));
                }
            });
        });
        
        // Cart Icon Click
        document.getElementById('cartIcon').addEventListener('click', () => {
            if(this.cart.length > 0) {
                this.showCart();
            } else {
                // Shake icon if cart empty
                const icon = document.querySelector('#cartIcon i');
                icon.style.transform = 'rotate(-15deg)';
                setTimeout(() => icon.style.transform = 'rotate(15deg)', 100);
                setTimeout(() => icon.style.transform = 'rotate(0)', 200);
            }
        });
        
        // Checkout Proceed
        document.getElementById('checkoutBtn').addEventListener('click', () => {
            if (this.cart.length > 0) {
                this.showPayment();
            }
        });
        
        // Form Submit
        document.getElementById('paymentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processPayment();
        });

        // Basic input formatting for CC
        const ccInput = document.querySelector('input[placeholder="0000 0000 0000 0000"]');
        ccInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let formated = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) {
                    formated += ' ';
                }
                formated += value[i];
            }
            e.target.value = formated;
        });

        const expiryInput = document.querySelector('input[placeholder="MM/YY"]');
        expiryInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    },

    // Navigation
    switchView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    showMain() {
        this.switchView('menuView');
    },

    showCart() {
        this.renderCart();
        this.switchView('cartView');
    },

    showPayment() {
        this.switchView('paymentView');
    },

    // Payment Processing Simulation
    processPayment() {
        const btnText = document.querySelector('.btn-text');
        const spinner = document.querySelector('.spinner');
        const payBtn = document.getElementById('payBtn');
        
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
        payBtn.disabled = true;

        // Simulate network request
        setTimeout(() => {
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
            payBtn.disabled = false;
            
            this.showSuccessModal();
        }, 2000);
    },

    showSuccessModal() {
        const modal = document.getElementById('successModal');
        const receipt = document.getElementById('receiptDetails');
        
        const total = document.getElementById('paymentTotalAmount').textContent;
        const orderId = 'EAT-' + Math.floor(100000 + Math.random() * 900000);
        
        receipt.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem">
                <span class="text-muted">Order ID:</span>
                <strong>${orderId}</strong>
            </div>
            <div style="display:flex; justify-content:space-between;">
                <span class="text-muted">Amount Paid:</span>
                <strong class="text-primary">${total}</strong>
            </div>
        `;
        
        modal.classList.add('active');
    },

    resetApp() {
        this.cart = [];
        this.updateCartBadge();
        document.getElementById('paymentForm').reset();
        document.getElementById('successModal').classList.remove('active');
        this.showMain();
    }
};

// Start application
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
