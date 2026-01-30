let PRODUCTS = {};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

let cartItems = [];
let currentCategory = 'all';

async function fetchProducts() {
    const grid = document.getElementById('products-grid');
    if (grid) {
        // Show Skeleton Loading
        grid.innerHTML = `
            <div class="card-skeleton skeleton"></div>
            <div class="card-skeleton skeleton"></div>
            <div class="card-skeleton skeleton"></div>
        `;
    }

    try {
        const response = await fetch('/api/store/products');
        if (!response.ok) {
            throw new Error('Erro ao carregar produtos do servidor.');
        }
        const productsArray = await response.json();
        
        PRODUCTS = {};
        productsArray.forEach(product => {
            PRODUCTS[product.id] = product;
        });
        
        renderProducts(currentCategory);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        const grid = document.getElementById('products-grid');
        if (grid) {
            grid.innerHTML = '<p style="color: white; text-align: center;">Não foi possível carregar os produtos no momento.</p>';
        }
    }
}


function formatCurrency(value) {
    if (value === null || value === undefined) return 'Em breve';
    return currencyFormatter.format(value);
}

function renderProducts(category = 'all') {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.innerHTML = '';

    Object.values(PRODUCTS).forEach((product, index) => {
        // Filter by category
        if (category !== 'all' && product.category !== category) return;

        const card = document.createElement('div');
        card.className = `card fade-in-up delay-${index % 3}`;
        card.setAttribute('data-product-id', product.id);

        const priceDisplay = product.price === 0 ? 'R$ 0,00' : formatCurrency(product.price);
        const buttonText = product.price === 0 ? 'Obter Agora (Grátis)' : 'Adicionar ao Carrinho';
        const buttonDisabled = product.disabled ? 'disabled' : '';
        const buttonClass = product.disabled ? 'btn btn-outline btn-block' : 'btn btn-primary btn-block add-to-cart-btn';
        const buttonLabel = product.disabled ? 'Aguarde novidades' : buttonText;

        card.innerHTML = `
            <div class="icon-box"><i class="${product.icon}"></i></div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="product-footer">
                <div class="product-price-tag">
                    <span class="price-main">${priceDisplay}</span>
                    <span class="price-badge">${product.badge}</span>
                </div>
                <button class="${buttonClass}" 
                        data-product-id="${product.id}" 
                        ${buttonDisabled}>
                    ${buttonLabel}
                </button>
            </div>
        `;

        grid.appendChild(card);
    });

    // Re-attach event listeners for new buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.getAttribute('data-product-id');
            addToCart(productId);
        });
    });
}

function setupCategoryFilters() {
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter
            const category = btn.getAttribute('data-category');
            currentCategory = category;
            renderProducts(category);
        });
    });
}

function updateCartCount() {
    const countEl = document.querySelector('.cart-count');
    if (!countEl) return;
    countEl.textContent = String(cartItems.length);
}

function renderCart() {
    const itemsContainer = document.getElementById('cart-items');
    const totalValueEl = document.getElementById('cart-total-value');

    if (!itemsContainer || !totalValueEl) return;

    itemsContainer.innerHTML = '';

    if (cartItems.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-cart-msg';
        empty.textContent = 'Seu carrinho está vazio';
        itemsContainer.appendChild(empty);
        totalValueEl.textContent = formatCurrency(0);
        updateCartCount();
        return;
    }

    let total = 0;

    cartItems.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-item-row';

        const header = document.createElement('div');
        header.className = 'cart-item-header';

        const info = document.createElement('div');
        info.className = 'cart-item-info';
        info.textContent = item.name;

        const price = document.createElement('div');
        price.className = 'cart-item-price';
        price.textContent = formatCurrency(item.price * item.quantity);

        header.appendChild(info);
        header.appendChild(price);

        const controls = document.createElement('div');
        controls.className = 'cart-item-controls';

        const minusBtn = document.createElement('button');
        minusBtn.className = 'qty-btn';
        minusBtn.innerHTML = '<i class="fas fa-minus"></i>';
        minusBtn.onclick = () => updateQuantity(item.id, -1);

        const qtyInput = document.createElement('input');
        qtyInput.className = 'qty-input';
        qtyInput.type = 'number';
        qtyInput.value = item.quantity;
        qtyInput.readOnly = true;

        const plusBtn = document.createElement('button');
        plusBtn.className = 'qty-btn';
        plusBtn.innerHTML = '<i class="fas fa-plus"></i>';
        plusBtn.onclick = () => updateQuantity(item.id, 1);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
        removeBtn.onclick = () => removeFromCart(item.id);

        controls.appendChild(minusBtn);
        controls.appendChild(qtyInput);
        controls.appendChild(plusBtn);
        controls.appendChild(removeBtn);

        row.appendChild(header);
        row.appendChild(controls);

        itemsContainer.appendChild(row);

        total += (item.price || 0) * item.quantity;
    });

    totalValueEl.textContent = formatCurrency(total);
    updateCartCount();
}

function openCartSidebar() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.style.display = 'block';
    if (overlay) overlay.style.display = 'block';
}

function closeCartSidebar() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}

function openCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    const overlay = document.getElementById('overlay');
    if (modal) modal.style.display = 'block';
    if (overlay) overlay.style.display = 'block';
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    const overlay = document.getElementById('overlay');
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}

function showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';
    if (type === 'info') iconClass = 'fa-info-circle';

    let title = 'Sucesso';
    if (type === 'error') title = 'Erro';
    if (type === 'info') title = 'Informação';

    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${iconClass}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;

    // Close button logic
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.add('hiding');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('hiding');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }
    }, 5000);

    container.appendChild(toast);
}

function updateQuantity(productId, change) {
    const item = cartItems.find(item => item.id === productId);
    if (!item) return;

    const newQty = item.quantity + change;
    if (newQty >= 1 && newQty <= 99) {
        item.quantity = newQty;
        renderCart();
    }
}

function removeFromCart(productId) {
    cartItems = cartItems.filter(item => item.id !== productId);
    renderCart();
    showToast('Item removido do carrinho.', 'info');
}

function addToCart(productId) {
    const product = PRODUCTS[productId];
    if (!product) return;

    const existingItem = cartItems.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < 99) {
            existingItem.quantity++;
            showToast('Quantidade atualizada no carrinho!', 'info');
        } else {
            showToast('Limite de 99 itens atingido.', 'error');
            return;
        }
    } else {
        cartItems.push({ ...product, quantity: 1 });
        showToast('Produto adicionado ao carrinho!', 'success');
    }
    
    renderCart();
    openCartSidebar();
}

async function submitOrder(name, email) {
    // Expand cart items based on quantity for the backend
    const itemsPayload = [];
    cartItems.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
            itemsPayload.push({
                id: item.id,
                name: item.name,
                price: item.price
            });
        }
    });

    const payload = {
        name,
        email,
        items: itemsPayload
    };

    const response = await fetch('/api/store/order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    let data = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok || !data || data.ok !== true) {
        const message = data && data.error ? data.error : 'Erro ao processar seu pedido. Tente novamente.';
        throw new Error(message);
    }

    return data;
}

function setupAccordion() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isActive = item.classList.contains('active');
            
            // Close all items
            document.querySelectorAll('.accordion-item').forEach(i => {
                i.classList.remove('active');
            });
            
            // If clicked item wasn't active, open it
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

function setupScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1
    });

    reveals.forEach(element => {
        observer.observe(element);
    });
}

function setupStore() {
    const cartSidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    const checkoutModal = document.getElementById('checkout-modal');

    if (cartSidebar) cartSidebar.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    if (checkoutModal) checkoutModal.style.display = 'none';

    const cartBtn = document.getElementById('cart-btn');
    const closeCartBtn = document.getElementById('close-cart');
    const checkoutBtn = document.getElementById('checkout-btn');
    const closeCheckoutBtn = document.getElementById('close-checkout');
    const paymentForm = document.getElementById('payment-form');

    // Initialize Products and Categories
    fetchProducts();
    setupCategoryFilters();
    setupAccordion();
    setupScrollReveal();

    // Create Toast Container
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);

    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            if (cartItems.length === 0) return;
            renderCart();
            openCartSidebar();
        });
    }

    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', () => {
            closeCartSidebar();
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            closeCartSidebar();
            closeCheckoutModal();
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cartItems.length === 0) return;
            closeCartSidebar();
            openCheckoutModal();
        });
    }

    if (closeCheckoutBtn) {
        closeCheckoutBtn.addEventListener('click', () => {
            closeCheckoutModal();
        });
    }

    if (paymentForm) {
        paymentForm.addEventListener('submit', async event => {
            event.preventDefault();

            if (cartItems.length === 0) {
                showToast('Adicione um produto ao carrinho antes de finalizar.', 'info');
                return;
            }

            const nameInput = document.getElementById('customer-name');
            const emailInput = document.getElementById('customer-email');

            const name = nameInput ? nameInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';

            if (!name || !email) {
                showToast('Preencha seu nome e e-mail para receber o produto.', 'error');
                return;
            }

            const submitButton = paymentForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Enviando...';
            }

            try {
                const data = await submitOrder(name, email);

                if (data.mode === 'free') {
                    showToast('Pedido confirmado! Verifique seu e-mail para acessar o curso.', 'success');
                } else if (data.mode === 'pix' && data.payment && data.payment.qrCode) {
                    // For PIX, we might want to keep a modal or copy logic, but show success toast too
                    showToast('QR Code gerado! Finalize o pagamento pelo app do banco.', 'success');
                    // We can also trigger the copy or show it in a better way. 
                    // For now, let's assume the user handles the modal or UI that shows the code.
                    // The previous alert showed the code. Let's make sure the user can see it.
                    // Ideally, we should render this in the modal, not an alert.
                    // But to follow instructions "replace alerts", we will use toast and maybe render the code in a special element if needed.
                    // However, standard flow usually redirects or shows a dedicated payment screen.
                    // Since I can't easily add a new modal right now without more context, 
                    // I'll stick to the request: "personalizada e temporaria". 
                    // If the code is needed, an alert was bad anyway.
                    // Let's assume the backend or another UI part handles the "viewing" of the code 
                    // or we can put it in the modal body instead of closing it immediately?
                    // Actually, the previous code showed the QR code IN THE ALERT.
                    // I should probably render it in the modal instead of closing it if it's PIX.
                } else {
                    showToast('Pedido recebido. Verifique seu e-mail.', 'success');
                }

                // If it's free, we close. If it's PIX, we might want to show the code.
                // The original code alert logic:
                /*
                } else if (data.mode === 'pix' && data.payment && data.payment.qrCode) {
                    alert('Geramos um pagamento PIX. Copie o código abaixo no seu app do banco:\n\n' + data.payment.qrCode);
                }
                */
               
                // Let's modify logic to NOT close modal if PIX, and show the code inside it?
                // Or just copy to clipboard automatically?
                if (data.mode === 'pix' && data.payment && data.payment.qrCode) {
                     // Advanced: Replace modal content with QR Code
                     const modalBody = document.querySelector('#checkout-modal .checkout-body') || document.querySelector('#checkout-modal');
                     if(modalBody) {
                        modalBody.innerHTML = `
                            <div style="text-align: center;">
                                <h3 style="margin-bottom: 12px; color: white;">Finalizar Pedido | Pagamento PIX Gerado | Escaneie ou copie o código abaixo:</h3>
                                <textarea readonly style="width: 100%; height: 100px; background: #111; color: white; border: 1px solid #333; padding: 10px; margin-bottom: 15px; border-radius: 4px;">${data.payment.qrCode}</textarea>
                                <button class="btn btn-primary btn-block" onclick="navigator.clipboard.writeText('${data.payment.qrCode}').then(() => showToast('Código PIX copiado!', 'success'))">Copiar Código</button>
                                <button class="btn btn-outline btn-block" style="margin-top: 10px;" onclick="location.reload()">Fechar</button>
                            </div>
                        `;
                     }
                } else {
                    cartItems = [];
                    renderCart();
                    closeCheckoutModal();
                    if (nameInput) nameInput.value = '';
                    if (emailInput) emailInput.value = '';
                }

            } catch (error) {
                showToast(error.message || 'Erro ao finalizar pedido. Tente novamente mais tarde.', 'error');
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Confirmar envio por e-mail';
                }
            }
        });
    }

    renderCart();
}

document.addEventListener('DOMContentLoaded', setupStore);
