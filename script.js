// small helpers
const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));
const safe = s => (s || '').toString().replaceAll('<', '&lt;').replaceAll('>', '&gt;');

document.getElementById('cyear').textContent = new Date().getFullYear();

// Elements
const pageContent = qs('#page-content');
const successView = qs('#success-view');
const submitMeta = qs('#submit-meta');
const contactForm = qs('#contact-form');
const submitBtn = qs('#submit-btn');
const navEnroll = qs('#nav-enroll');
const metaHome = qs('#meta-home');

// Cart elements
const cartCountEl = qs('#cart-count');
const cartListEl = qs('#cart-list');
const cartItemsCountEl = qs('#cart-items-count');
const cartTotalEl = qs('#cart-total');
const cartEmptyEl = qs('#cart-empty');
const openCartBtn = qs('#open-cart');
const continueShoppingBtn = qs('#continue-shopping');
const checkoutBtn = qs('#checkout-btn');

// Modal elements (checkout)
const modalBackdrop = qs('#modal-backdrop');
const modalCancel = qs('#modal-cancel');
const modalSubmit = qs('#modal-submit');
const buyName = qs('#buy-name');
const buyEmail = qs('#buy-email');
const checkoutCount = qs('#checkout-count');
const checkoutSummary = qs('#checkout-summary');

// Success view elements
const successTitle = qs('#success-title');
const successSub = qs('#success-sub');
const successExtra = qs('#success-extra');
const successActions = qs('#success-actions');

// course collection
function readCourseDataFromArticle(article) {
    return {
        id: article.dataset.id || crypto.randomUUID?.() || Math.random().toString(36).slice(2, 9),
        title: article.querySelector('h3')?.textContent?.trim() || 'Untitled Course',
        price: parseFloat(article.dataset.price || '0') || 0,
        level: article.querySelector('.muted')?.textContent?.trim() || ''
    };
}

// maintain cart in-memory
let cart = [];

function saveCartToSession() {
    // save to sessionStorage so refresh keeps cart during session
    try { sessionStorage.setItem('si_cart_v1', JSON.stringify(cart)); } catch (e) { }
}

function loadCartFromSession() {
    try {
        const raw = sessionStorage.getItem('si_cart_v1');
        if (raw) cart = JSON.parse(raw) || [];
    } catch (e) { cart = []; }
}

function addToCart(course, showToast = true) {
    // prevent duplicates by id – if duplicate, ignore or keep single-instance
    if (!cart.find(i => i.id === course.id)) {
        cart.push({ ...course });
        saveCartToSession();
        renderCart();
        updateCartBadge();
    } else {
        // already in cart, inform user
        if (showToast) alert('Course already in cart. You can proceed to Buy or add other courses.');
    }
}

function removeFromCart(courseId) {
    cart = cart.filter(c => c.id !== courseId);
    saveCartToSession();
    renderCart();
    updateCartBadge();
}

function cartTotal() {
    return cart.reduce((s, c) => s + (c.price || 0), 0);
}

function updateCartBadge() {
    cartCountEl.textContent = cart.length;
    cartItemsCountEl.textContent = cart.length;
    cartTotalEl.textContent = cart.length ? '₹' + (cartTotal().toFixed(2)) : '₹0.00';
}

function renderCart() {
    cartListEl.innerHTML = '';
    if (!cart.length) {
        cartEmptyEl.style.display = 'block';
        cartListEl.style.display = 'none';
    } else {
        cartEmptyEl.style.display = 'none';
        cartListEl.style.display = 'flex';
        cart.forEach(item => {
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div class="meta">
                    <div style="font-weight:700">${safe(item.title)}</div>
                    <div class="muted-small">${safe(item.level)} • ₹${(item.price || 0).toFixed(2)}</div>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
                    <button class="btn-outline small remove-btn" data-id="${safe(item.id)}">Remove</button>
                </div>
            `;
            cartListEl.appendChild(div);
        });
        // attach remove handlers
        qsa('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.id;
                removeFromCart(id);
            });
        });
    }
    updateCartBadge();
}

// Hook up course cards to add to cart on click
(function attachCourseHandlers() {
    const articles = qsa('.course');
    articles.forEach(article => {
        const courseData = readCourseDataFromArticle(article);
        // add 'click entire card' behaviour except when clicking the button which is handled separately
        article.addEventListener('click', (ev) => {
            // If clicked element is a button inside card, let the button handler handle it separately (we still add to cart)
            if (ev.target.closest('.add-btn')) return;
            addToCart(courseData);
            // go to cart
            goToHash('#cart');
            renderCart();
        });
        // button handler
        const btn = article.querySelector('.add-btn');
        if (btn) {
            btn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                addToCart(courseData);
                goToHash('#cart');
                renderCart();
            });
        }
        // allow keyboard add via Enter when focused
        article.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                addToCart(courseData);
                goToHash('#cart');
                renderCart();
            }
        });
    });
})();

// small helper to scroll to anchors
function goToHash(hash) {
    if (!hash) window.scrollTo({ top: 0, behavior: 'smooth' });
    else {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// open cart button behaviour
openCartBtn.addEventListener('click', () => {
    goToHash('#cart');
    renderCart();
});

continueShoppingBtn.addEventListener('click', () => {
    goToHash('#courses');
});

// checkout flow
checkoutBtn.addEventListener('click', () => {
    if (!cart.length) {
        alert('Your cart is empty. Please add at least one course.');
        return;
    }
    // populate modal summary and show modal
    checkoutCount.textContent = cart.length;
    checkoutSummary.innerHTML = `You're purchasing <strong>${cart.length}</strong> course(s) • <strong>₹${cartTotal().toFixed(2)}</strong>`;
    buyName.value = '';
    buyEmail.value = '';
    modalBackdrop.style.display = 'flex';
    modalBackdrop.setAttribute('aria-hidden', 'false');
    buyName.focus();
});

modalCancel.addEventListener('click', () => {
    modalBackdrop.style.display = 'none';
    modalBackdrop.setAttribute('aria-hidden', 'true');
});

// purchase confirmation - realistic simulation
modalSubmit.addEventListener('click', () => {
    const name = buyName.value.trim();
    const email = buyEmail.value.trim();
    if (!name || !email) {
        alert('Please provide name and email to place the order.');
        return;
    }

    // Email validation for checkout
    if (!isValidEmail(email)) {
        alert('Please enter a valid email address (e.g., user@example.com)');
        return;
    }

    // disable buttons briefly to prevent double clicks
    modalSubmit.disabled = true;
    modalSubmit.textContent = 'Processing...';

    // Small simulated delay for realism
    setTimeout(() => {
        // Build order details
        const orderId = 'SI-' + Math.random().toString(36).slice(2, 9).toUpperCase();
        const date = new Date();
        const items = cart.map(c => ({ title: c.title, price: c.price, level: c.level }));
        const amount = cartTotal();

        // Show success/order confirmation view with order details
        showOrderSuccess({ orderId, date: date.toISOString(), name, email, items, amount });

        // clear cart
        cart = [];
        saveCartToSession();
        renderCart();
        updateCartBadge();

        // reset modal
        modalBackdrop.style.display = 'none';
        modalBackdrop.setAttribute('aria-hidden', 'true');
        modalSubmit.disabled = false;
        modalSubmit.textContent = 'Confirm & pay';
    }, 700);
});

// Show success view for generic forms (existing contact) and orders
function showSuccess(data, pushState = true) {
    // populate tags
    const parts = [];
    if (data.name) parts.push('<div class="tag">Name: ' + safe(data.name) + '</div>');
    if (data.email) parts.push('<div class="tag">Email: ' + safe(data.email) + '</div>');
    if (data.message) {
        const short = data.message.length > 160 ? safe(data.message.substring(0, 160)) + '…' : safe(data.message);
        parts.push('<div class="tag">Message: ' + short + '</div>');
    }
    submitMeta.innerHTML = parts.join('') || '<div class="muted">No details provided.</div>';

    // generic messaging
    successTitle.textContent = 'Thanks – we got your message';
    successSub.innerHTML = 'We appreciate you reaching out. Our team at <strong>Stock Insight</strong> will review your message and get back to you shortly.';
    successExtra.style.display = '';
    successActions.style.display = '';
    successView.style.display = 'flex';
    successView.setAttribute('aria-hidden', 'false');
    pageContent.classList.add('hidden');

    if (pushState) {
        const params = new URLSearchParams({
            view: 'contact',
            name: data.name || '',
            email: data.email || ''
        }).toString();
        history.pushState({ view: 'success', data }, '', window.location.pathname + '?' + params);
    } else {
        history.replaceState({ view: 'success', data }, '', window.location.pathname + window.location.search);
    }
}

// dedicated order success view renderer
function showOrderSuccess(order, pushState = true) {
    // order: { orderId, date, name, email, items, amount }
    const parts = [];
    parts.push('<div class="tag">Order: ' + safe(order.orderId) + '</div>');
    parts.push('<div class="tag">Buyer: ' + safe(order.name) + '</div>');
    parts.push('<div class="tag">Email: ' + safe(order.email) + '</div>');
    parts.push('<div class="tag">Amount: ₹' + (order.amount || 0).toFixed(2) + '</div>');
    parts.push('<div class="tag">Date: ' + safe(new Date(order.date).toLocaleString()) + '</div>');

    // items list as readable HTML in success body below the meta
    const itemsHtml = order.items.map(it => `<li>${safe(it.title)} – ${safe(it.level)} – ₹${(it.price || 0).toFixed(2)}</li>`).join('');
    submitMeta.innerHTML = parts.join('') + '<div style="width:100%;margin-top:8px"><strong style="display:block;margin-bottom:6px">Ordered items</strong><ul style="margin:0;padding-left:18px;color:var(--muted)">' + itemsHtml + '</ul></div>';

    successTitle.textContent = 'Order confirmed';
    successSub.innerHTML = `Thanks <strong>${safe(order.name)}</strong> – your order <strong>${safe(order.orderId)}</strong> has been placed successfully. A confirmation has been sent to <strong>${safe(order.email)}</strong>.`;
    successExtra.style.display = 'block';
    successView.style.display = 'flex';
    successView.setAttribute('aria-hidden', 'false');
    pageContent.classList.add('hidden');

    // update history so user can bookmark result (no PII in path query except minimal)
    if (pushState) {
        const params = new URLSearchParams({
            view: 'order',
            order: order.orderId
        }).toString();
        history.pushState({ view: 'order', order }, '', window.location.pathname + '?' + params);
    } else {
        history.replaceState({ view: 'order', order }, '', window.location.pathname + window.location.search);
    }

    // Accessibility focus
    const heading = successView.querySelector('h1');
    if (heading) heading.focus?.();

    // (Optional) console log
    console.info('Order placed (client):', order);
}

// Hide the success view and return to main content
function hideSuccess(pushState = true) {
    successView.style.display = 'none';
    successView.setAttribute('aria-hidden', 'true');
    pageContent.classList.remove('hidden');
    if (pushState) {
        history.pushState({ view: 'home' }, '', window.location.pathname);
    } else {
        history.replaceState({ view: 'home' }, '', window.location.pathname);
    }
    goToHash('#home');
}

// Email validation function
function isValidEmail(email) {
    // Comprehensive email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Load existing submissions from memory
let contactSubmissions = [];

// Function to download all submissions as a text file
function downloadSubmissionsFile() {
    if (contactSubmissions.length === 0) {
        return; // Nothing to download
    }

    let content = "Stock Insight - Contact Form Submissions\n";
    content += "=".repeat(50) + "\n\n";
    
    contactSubmissions.forEach((submission, index) => {
        content += `Submission #${index + 1}\n`;
        content += "-".repeat(30) + "\n";
        content += `Date & Time: ${submission.timestamp}\n`;
        content += `Name: ${submission.name}\n`;
        content += `Email: ${submission.email}\n`;
        content += `Message: ${submission.message}\n`;
        content += "\n";
    });
    
    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contact-submissions-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Client-side form validation & submission handling (contact)
contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    const formData = new FormData(contactForm);
    const data = {
        name: formData.get('name')?.trim(),
        email: formData.get('email')?.trim(),
        message: formData.get('message')?.trim()
    };

    // basic validation
    if (!data.name || !data.email || !data.message) {
        alert('Please fill all fields before sending.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
        return;
    }

    // Email validation
    if (!isValidEmail(data.email)) {
        alert('Please enter a valid email address (e.g., user@example.com)');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
        return;
    }

    // simulate async work (e.g., sending to server)
    setTimeout(() => {
        // Store submission with timestamp
        const submission = {
            ...data,
            timestamp: new Date().toLocaleString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                dateStyle: 'full',
                timeStyle: 'medium'
            })
        };
        contactSubmissions.push(submission);
        
        // Automatically download the updated file
        downloadSubmissionsFile();
        
        // Show success view
        showSuccess(data, true);

        // reset the form so user doesn't accidentally resubmit
        contactForm.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
    }, 450);
});

// Return Home button on success view
metaHome.addEventListener('click', () => hideSuccess(true));
qs('#meta-explore').addEventListener('click', () => {
    hideSuccess(true);
    goToHash('#courses');
});

// Navbar Enroll button scrolls to contact
navEnroll.addEventListener('click', () => {
    goToHash('#contact');
});

// Handle browser back/forward
window.addEventListener('popstate', (ev) => {
    const state = ev.state;
    if (state && state.view === 'success') {
        // show success (state.data may exist)
        showSuccess(state.data || {}, false);
    } else if (state && state.view === 'order') {
        showOrderSuccess(state.order || {}, false);
    } else {
        // show home
        hideSuccess(false);
    }
});

// If the page loads with query parameters (?name=...&email=...&message=... or ?order=...) show success view
(function initFromURL() {
    loadCartFromSession();
    renderCart();
    updateCartBadge();

    const params = new URLSearchParams(window.location.search);
    const name = params.get('name') || '';
    const email = params.get('email') || '';
    const message = params.get('message') || '';
    const order = params.get('order') || '';
    if (order) {
        // If an order param exists, show a simulated order view with that id (real details won't exist)
        showOrderSuccess({ orderId: order, date: new Date().toISOString(), name: 'Valued customer', email: 'you@example.com', items: [], amount: 0 }, false);
    } else if (name || email || message) {
        // show success populated from URL params
        showSuccess({ name, email, message }, false);
    } else {
        // ensure correct initial history state
        history.replaceState({ view: 'home' }, '', window.location.pathname);
    }
})();
