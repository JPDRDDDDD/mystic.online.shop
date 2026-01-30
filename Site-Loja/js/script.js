let PRODUCTS = {
    basic_course: {
        id: 'basic_course',
        name: 'Curso de Programação Básica',
        price: 14.99,
        category: 'DevStart',
        description: 'Acesso vitalício ao Curso Completo de Programação. Receba seu link do curso imediatamente.',
        icon: 'fas fa-laptop-code',
        badge: 'Curso Completo',
        disabled: false
    },
    raffle_ticket: {
        id: 'raffle_ticket',
        name: 'Vale Sorteio (R$ 100)',
        price: 0.00,
        category: 'Sorteios',
        description: 'Concorra a R$ 100,00! Ao comprar, você recebe uma Key Aleatória de participação para o sorteio quanto mais comprar maior será suas chances. Lembrando que tem limite de chaves tem apenas 1000 keys disponiveis',
        icon: 'fas fa-ticket-alt',
        badge: 'Sorteio',
        disabled: false
    },
    robux_100: {
        id: 'robux_100',
        name: '100 Robux',
        price: 5.00,
        category: 'Robux',
        description: 'Pacote de 100 Robux. Compre múltiplos para aumentar a quantidade. Entre no Discord para receber.',
        icon: 'fas fa-coins',
        badge: 'Oferta',
        disabled: false
    },
    mystic_credits: {
        id: 'mystic_credits',
        name: 'Créditos Mystic (Em breve)',
        price: null,
        category: 'Mystic',
        description: 'Em breve você poderá comprar créditos e outras vantagens usando o mesmo fluxo de pagamento com QR Code do bot.',
        icon: 'fas fa-gem',
        badge: 'Em breve',
        disabled: true
    }
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

let cartItems = [];
let currentCategory = 'all';

async function fetchProducts() {
    // Renderiza produtos locais imediatamente para garantir visualização
    renderProducts(currentCategory);

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
        console.log('Usando catálogo local (Preview/Offline mode).');
        // Se falhar, mantém os produtos locais já definidos
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
                entry.target.classList.add('visible');
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

    // Mobile Menu Logic
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                if (navMenu.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Close menu when clicking a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }

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
                    cartItems = [];
                    renderCart();
                    closeCheckoutModal();
                    if (nameInput) nameInput.value = '';
                    if (emailInput) emailInput.value = '';
                } else if (data.mode === 'pix' && data.payment && data.payment.qrCode) {
                    showToast('QR Code gerado com sucesso!', 'success');
                    
                    const modalBody = document.querySelector('#checkout-modal .checkout-body');
                    if(modalBody) {
                        const qrImage = data.payment.qrCodeBase64 
                            ? `data:image/png;base64,${data.payment.qrCodeBase64}`
                            : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.payment.qrCode)}`;

                        modalBody.innerHTML = `
                            <div style="text-align: center; color: white; animation: fadeIn 0.5s;">
                                <div style="background: #4bb543; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                                    <i class="fas fa-check" style="font-size: 30px; color: white;"></i>
                                </div>
                                <h3 style="margin-bottom: 10px;">Pedido Criado!</h3>
                                <p style="color: #b3b3b3; margin-bottom: 20px;">Escaneie o QR Code ou copie o código abaixo para pagar.</p>
                                
                                <div style="background: white; padding: 10px; display: inline-block; border-radius: 8px; margin-bottom: 20px;">
                                    <img src="${qrImage}" alt="QR Code Pix" style="width: 200px; height: 200px; display: block;">
                                </div>

                                <div style="position: relative; margin-bottom: 15px;">
                                    <input type="text" id="pix-code" value="${data.payment.qrCode}" readonly 
                                        style="width: 100%; background: #1a1a1a; border: 1px solid #333; padding: 12px; padding-right: 50px; color: #fff; border-radius: 6px; font-family: monospace;">
                                    <button onclick="navigator.clipboard.writeText(document.getElementById('pix-code').value).then(() => showToast('Código copiado!', 'success'))" 
                                        style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); background: #8a2be2; border: none; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                </div>

                                <p style="font-size: 0.9em; color: #888; margin-bottom: 20px;">
                                    Após o pagamento, você receberá a confirmação por e-mail.<br>
                                    <span style="color: #e50914;">⚠️ O pagamento pode levar alguns minutos para ser processado.</span>
                                </p>

                                <button class="btn btn-outline btn-block" onclick="location.reload()">Fechar e Limpar Carrinho</button>
                            </div>
                        `;
                    }
                    
                    // Clear cart in background so if they reload it's empty
                    cartItems = [];
                    renderCart();
                } else {
                    showToast('Pedido recebido. Verifique seu e-mail.', 'success');
                    cartItems = [];
                    renderCart();
                    closeCheckoutModal();
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
