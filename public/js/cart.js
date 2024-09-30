
//working code
let cart = [];
const userLoggedIn = sessionStorage.getItem('userLoggedIn') === 'true';

// Load cart from storage or server
function loadCart() {
    if (userLoggedIn) {
        fetch('/cart-items')
            .then(response => response.json())
            .then(data => {
                cart = data.cartItems.map(item => ({
                    id: item.productId,
                    name: item.name,
                    quantity: item.quantity
                }));
                updateCart();
            })
            .catch(error => console.error('Error fetching cart items:', error));
    } else {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            try {
                cart = JSON.parse(storedCart);
                cart = cart.filter(item => item && item.id && item.name && item.quantity);
                localStorage.setItem('cart', JSON.stringify(cart));
            } catch (e) {
                console.error('Error parsing cart from storage:', e);
                cart = [];
                localStorage.removeItem('cart');
            }
        } else {
            cart = [];
        }
        updateCart();
    }
}

function toggleCart() {
    const cartSideWindow = document.getElementById('cart-side-window');
    cartSideWindow.classList.toggle('active');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartEmptyMessage = document.getElementById('cart-empty-message');

    // Check if cart is empty
    if (cart.length === 0) {
        cartItemsContainer.style.display = 'none';
        cartEmptyMessage.style.display = 'block';
    } else {
        cartItemsContainer.style.display = 'block';
        cartEmptyMessage.style.display = 'none';
    }
}
//test code
function addToCart(productId, productName, productPrice) {
    const existingProduct = cart.find(item => item.id === productId);
    const maxItems = 3;

    if (!userLoggedIn && cart.length >= maxItems) {
        alert(`You can only add up to ${maxItems} items to the cart if not logged in.`);
        return;
    }

    if (existingProduct) {
        existingProduct.quantity++;
        existingProduct.totalPrice = existingProduct.quantity * productPrice; // Update totalPrice based on current quantity
    } else {
        cart.push({ id: productId, name: productName, quantity: 1, totalPrice: productPrice });
        document.getElementById(`cart-buttons-${productId}`).innerHTML = `
            <div class="quantity">
                <button onclick="updateQuantity('${productId}', -1)">-</button>
                <input type="number" id="quantity-input-${productId}" value="1" min="1" readonly>
                <button onclick="updateQuantity('${productId}', 1)">+</button>
            </div>
        `;
    }

    saveCart();
    updateCart();
}


//taking blank array for fetching the list of about to removed items
let removedItems = [];

function saveCart() {
    if (userLoggedIn) {
        fetch('/save-cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartItems: cart, removedItems: removedItems })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                console.log(data.message);
                // Clear removedItems after successful save
                removedItems = [];
            } else {
                console.error('Error saving cart:', data.error);
            }
        })
        .catch(error => console.error('Error saving cart:', error));
    } else {
        localStorage.setItem('cart', JSON.stringify(cart));
        // Clear removedItems for non-logged-in user as well
        removedItems = [];
    }
}

function updateCart() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    cartCount.innerText = cart.reduce((total, item) => total + item.quantity, 0);
    cartItems.innerHTML = '';

    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item');
        cartItem.innerHTML = `
            <span>${item.name} (${item.quantity})</span>
            <button onclick="removeFromCart('${item.id}', '${item.name}')">Remove</button>
        `;
        cartItems.appendChild(cartItem);
    });
}

function removeFromCart(productId, productName) {
    cart = cart.filter(item => item.id !== productId);
    removedItems.push(productId); // Track removed item
    saveCart();
    updateCart();
    document.getElementById(`cart-buttons-${productId}`).innerHTML = `
        <button class="button" onclick="addToCart('${productId}', '${productName}',${productPrice})">Add to Cart</button>
    `;
}

function updateQuantity(productId, change) {
    const existingProduct = cart.find(item => item.id === productId);
    if (existingProduct) {
        existingProduct.quantity += change;
        if (existingProduct.quantity <= 0) {
            removeFromCart(productId, existingProduct.name);
        } else {
            document.getElementById(`quantity-input-${productId}`).value = existingProduct.quantity;
        }
        saveCart();
        updateCart();
    }
}

function navigateToProduct(productId) {
    window.location.href = `/product-description?productId=${productId}`;
}

document.addEventListener('DOMContentLoaded', loadCart);

document.addEventListener('DOMContentLoaded', () => {
    if (document.cookie.split(';').some((item) => item.trim().startsWith('transferCart='))) {
        const cart = localStorage.getItem('cart');
        if (cart) {
            sessionStorage.setItem('cart', cart);
            localStorage.removeItem('cart');
        }
        document.cookie = 'transferCart=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
    }
});

function getCartFromLocalStorage() {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        try {
            return JSON.parse(storedCart);
        } catch (e) {
            console.error('Error parsing cart from local storage:', e);
            return [];
        }
    }
    return [];
}