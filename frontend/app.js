// API Base URL
const API_BASE = 'http://localhost:8000/api';

// Current user state
let currentUser = null;
let authToken = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Bind the login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    
    // Bind the registration form submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
});

// Check if user is authenticated
function checkAuth() {
    authToken = localStorage.getItem('authToken');
    if (authToken) {
        fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Not authenticated');
        })
        .then(user => {
            currentUser = user;
            showAuthenticatedView();
        })
        .catch(() => {
            logout();
        });
    } else {
        showPage('landing');
    }
}

// Show authenticated view
function showAuthenticatedView() {
    document.getElementById('navbar').style.display = 'block';
    
    // Show admin button if user is admin
    if (currentUser.role === 'admin') {
        document.getElementById('adminBtn').style.display = 'block';
    }
    
    showPage('cars');
}

// Page navigation
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show selected page
    const pageMap = {
        'landing': 'landingPage',
        'login': 'loginPage',
        'register': 'registerPage',
        'cars': 'carsPage',
        'dashboard': 'dashboardPage',
        'admin': 'adminPage'
    };
    
    const pageId = pageMap[pageName];
    if (pageId) {
        document.getElementById(pageId).style.display = 'block';
    }
    
    // Load page-specific data
    if (pageName === 'cars') {
        loadCars();
    } else if (pageName === 'dashboard') {
        loadMyRentals();
    } else if (pageName === 'admin') {
        loadAdminData();
    }
}

// Handle login
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Login failed');
        }
        return response.json();
    })
    .then(data => {
        authToken = data.access_token;
        localStorage.setItem('authToken', authToken);
        checkAuth();
        showNotification('Login successful!', 'success');
    })
    .catch(error => {
        showNotification('Login failed. Please check your username and password.', 'error');
    });
}

// Handle registration
function handleRegister(event) {
    event.preventDefault();
    
    const userData = {
        username: document.getElementById('regUsername').value,
        email: document.getElementById('regEmail').value,
        full_name: document.getElementById('regFullName').value,
        password: document.getElementById('regPassword').value
    };
    
    fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Registration failed');
    })
    .then(data => {
        showNotification('Registration successful! Please login.', 'success');
        showPage('login');
    })
    .catch(error => {
        showNotification('Registration failed. Username or email may already exist.', 'error');
    });
}

// Logout
function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    document.getElementById('navbar').style.display = 'none';
    document.getElementById('adminBtn').style.display = 'none';
    showPage('landing');
    showNotification('Logged out successfully', 'info');
}

// Load cars
function loadCars() {
    fetch(`${API_BASE}/cars/?status=available`)
    .then(response => response.json())
    .then(cars => {
        sortCarsList(cars, 'carsGrid');
    })
    .catch(error => {
        showNotification('Failed to load cars', 'error');
    });
}

// Sort cars
function sortCars() {
    loadCars();
}

function sortBrowseCars() {
    loadBrowseCars();
}

function sortCarsList(cars, containerId) {
    const sortValue = document.getElementById(containerId === 'carsGrid' ? 'sortFilter' : 'browseSortFilter').value;
    
    let sortedCars = [...cars];
    
    switch(sortValue) {
        case 'featured':
            sortedCars.sort((a, b) => {
                if (a.is_promoted && !b.is_promoted) return -1;
                if (!a.is_promoted && b.is_promoted) return 1;
                return new Date(b.created_at) - new Date(a.created_at);
            });
            break;
        case 'price_low':
            sortedCars.sort((a, b) => a.rent_price_per_day - b.rent_price_per_day);
            break;
        case 'price_high':
            sortedCars.sort((a, b) => b.rent_price_per_day - a.rent_price_per_day);
            break;
        case 'newest':
            sortedCars.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
    }
    
    displayCars(sortedCars, containerId);
}

// Display cars
function displayCars(cars, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    cars.forEach(car => {
        const statusClass = `status-${car.status}`;
        const canRent = car.status === 'available' && currentUser && currentUser.role === 'user';
        const canEdit = currentUser && currentUser.role === 'admin';
        
        // Handle image display - only show main image
        let imageHtml = '';
        if (car.image_urls && car.image_urls.length > 0) {
            imageHtml = `<img src="${car.image_urls[0]}" alt="${car.name}" onclick="showCarDetail(${car.id})">`;
        } else {
            imageHtml = '🚗';
        }
        
        // Calculate discounted price
        const discount = car.discount_percentage || 0;
        const originalPrice = car.rent_price_per_day;
        const discountedPrice = discount > 0 ? (originalPrice * (1 - discount / 100)).toFixed(2) : originalPrice;
        
        const carCard = document.createElement('div');
        carCard.className = 'car-card';
        carCard.innerHTML = `
            <div class="car-image">${imageHtml}</div>
            <div class="car-info">
                ${car.is_promoted ? '<span class="promo-badge">⭐ Featured</span>' : ''}
                <h3>${car.name}</h3>
                <p class="car-brand">${car.brand} ${car.model}</p>
                <div class="car-details">
                    <span>📅 ${car.year || 'N/A'}</span>
                    <span>👥 ${car.seats} seats</span>
                    <span>⚙️ ${car.transmission || 'N/A'}</span>
                    <span>⛽ ${car.fuel_type || 'N/A'}</span>
                </div>
                <p class="car-price">
                    ${discount > 0 ? `<span class="original-price">$${originalPrice}/day</span>` : ''}
                    $${discountedPrice}/day
                    ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
                </p>
                <span class="car-status ${statusClass}">${car.status.toUpperCase()}</span>
                ${car.description ? `<p style="margin-top: 0.5rem; color: #666;">${car.description}</p>` : ''}
                <div class="car-actions">
                    ${canRent ? `<button class="btn-rent" onclick="showRentModal(${car.id})">Rent Now</button>` : ''}
                    ${canEdit ? `
                        <button class="btn-edit" onclick="showEditCarModal(${car.id})">Edit</button>
                        <button class="btn-delete" onclick="deleteCar(${car.id})">Delete</button>
                    ` : ''}
                </div>
            </div>
        `;
        container.appendChild(carCard);
    });
}

// Load user's rentals
function loadMyRentals() {
    fetch(`${API_BASE}/rentals/`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(rentals => {
        displayRentals(rentals, 'myRentals');
    })
    .catch(error => {
        showNotification('Failed to load rentals', 'error');
    });
}

// Display rentals
function displayRentals(rentals, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (rentals.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No rentals found</p>';
        return;
    }
    
    rentals.forEach(rental => {
        const rentalCard = document.createElement('div');
        rentalCard.className = 'rental-card';
        
        // Calculate estimated cost if total_cost is not set
        let totalCost = rental.total_cost;
        if (!totalCost && rental.start_date) {
            const startDate = new Date(rental.start_date);
            const endDate = rental.end_date ? new Date(rental.end_date) : new Date();
            const hoursDiff = (endDate - startDate) / (1000 * 60 * 60);
            const days = Math.ceil(hoursDiff / 24);
            totalCost = 'N/A (Estimated)';
        }
        
        rentalCard.innerHTML = `
            <div class="rental-header">
                <h3>Rental #${rental.id}</h3>
                <span class="car-status status-${rental.status}">${rental.status.toUpperCase()}</span>
            </div>
            <div class="rental-info">
                <p><strong>Car ID:</strong> ${rental.car_id}</p>
                <p><strong>Start Date:</strong> ${new Date(rental.start_date).toLocaleString()}</p>
                <p><strong>End Date:</strong> ${rental.end_date ? new Date(rental.end_date).toLocaleString() : 'Not set'}</p>
                <p><strong>Total Cost:</strong> $${totalCost}</p>
            </div>
            ${rental.status === 'active' ? `
                <div class="rental-actions">
                    <button class="btn btn-primary" onclick="returnCar(${rental.id})">Return Car</button>
                </div>
            ` : ''}
        `;
        container.appendChild(rentalCard);
    });
}

// Load admin data
function loadAdminData() {
    loadAdminCars();
    loadAdminUsers();
    loadAdminRentals();
}

function loadAdminCars() {
    fetch(`${API_BASE}/cars/`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(cars => {
        displayCars(cars, 'adminCars');
    })
    .catch(error => {
        showNotification('Failed to load cars', 'error');
    });
}

function loadAdminUsers() {
    fetch(`${API_BASE}/users/`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(users => {
        displayUsers(users);
    })
    .catch(error => {
        showNotification('Failed to load users', 'error');
    });
}

function displayUsers(users) {
    const adminContainer = document.getElementById('adminUsers');
    const regularContainer = document.getElementById('regularUsers');
    adminContainer.innerHTML = '';
    regularContainer.innerHTML = '';
    
    // Show BOB section if current user is BOB
    const isBobSection = document.getElementById('isBobSection');
    isBobSection.style.display = currentUser.username === 'BOB' ? 'block' : 'none';
    
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        
        const isBob = currentUser.username === 'BOB';
        const canEditRole = isBob && user.username !== 'BOB';
        
        let roleActions = '';
        if (canEditRole) {
            const currentRole = user.role;
            const newRole = currentRole === 'admin' ? 'user' : 'admin';
            roleActions = `
                <button class="btn btn-edit" onclick="updateUserRole(${user.id}, '${newRole}')">
                    Make ${newRole === 'admin' ? 'Admin' : 'User'}
                </button>
            `;
        }
        
        userCard.innerHTML = `
            <div class="user-info">
                <h4>${user.username}</h4>
                <p>${user.email}</p>
                <p>${user.full_name || 'No name'}</p>
                <span class="user-role-badge ${user.role}">${user.role.toUpperCase()}</span>
            </div>
            <div class="user-actions">
                ${roleActions}
                ${user.id !== currentUser.id ? `
                    <button class="btn btn-delete" onclick="deleteUser(${user.id})">Delete</button>
                ` : ''}
            </div>
        `;
        
        if (user.role === 'admin') {
            adminContainer.appendChild(userCard);
        } else {
            regularContainer.appendChild(userCard);
        }
    });
}

function loadAdminRentals() {
    fetch(`${API_BASE}/rentals/`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(rentals => {
        displayRentals(rentals, 'adminRentals');
    })
    .catch(error => {
        showNotification('Failed to load rentals', 'error');
    });
}

// Dashboard tabs
function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    if (tabName === 'myRentals') {
        document.getElementById('myRentalsTab').style.display = 'block';
        loadMyRentals();
    } else if (tabName === 'browse') {
        document.getElementById('browseTab').style.display = 'block';
        loadBrowseCars();
    }
}

function loadBrowseCars() {
    fetch(`${API_BASE}/cars/?status=available`)
    .then(response => response.json())
    .then(cars => {
        sortCarsList(cars, 'browseCars');
    })
    .catch(error => {
        showNotification('Failed to load cars', 'error');
    });
}

// Admin tabs
function showAdminTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    if (tabName === 'manageCars') {
        document.getElementById('manageCarsTab').style.display = 'block';
        loadAdminCars();
    } else if (tabName === 'manageUsers') {
        document.getElementById('manageUsersTab').style.display = 'block';
        loadAdminUsers();
    } else if (tabName === 'allRentals') {
        document.getElementById('allRentalsTab').style.display = 'block';
        loadAdminRentals();
    }
}

// Modal functions
function showAddCarModal() {
    document.getElementById('addCarModal').style.display = 'flex';
    document.getElementById('addCarForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
}

// Image preview functionality
document.getElementById('carImages')?.addEventListener('change', function(e) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    
    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

function showRentModal(carId) {
    document.getElementById('rentCarId').value = carId;
    
    // Set minimum date to current date/time
    const now = new Date();
    const nowString = now.toISOString().slice(0, 16);
    document.getElementById('rentStartDate').min = nowString;
    document.getElementById('rentStartDate').value = nowString;
    
    // Clear end date
    document.getElementById('rentEndDate').value = '';
    
    document.getElementById('rentCarModal').style.display = 'flex';
}

function showEditCarModal(carId) {
    fetch(`${API_BASE}/cars/${carId}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(car => {
        document.getElementById('editCarId').value = car.id;
        document.getElementById('editCarName').value = car.name;
        document.getElementById('editCarBrand').value = car.brand;
        document.getElementById('editCarModel').value = car.model;
        document.getElementById('editCarYear').value = car.year || '';
        document.getElementById('editCarSeats').value = car.seats;
        document.getElementById('editCarTransmission').value = car.transmission || '';
        document.getElementById('editCarFuelType').value = car.fuel_type || '';
        document.getElementById('editCarPrice').value = car.rent_price_per_day;
        document.getElementById('editCarDiscount').value = car.discount_percentage || 0;
        document.getElementById('editCarPromoted').checked = car.is_promoted || false;
        document.getElementById('editCarStatus').value = car.status;
        document.getElementById('editCarDescription').value = car.description || '';
        
        // Display current images
        const currentImagesDiv = document.getElementById('editCarCurrentImages');
        currentImagesDiv.innerHTML = '';
        if (car.image_urls && car.image_urls.length > 0) {
            car.image_urls.forEach((url, index) => {
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                imageItem.innerHTML = `
                    <img src="${url}" alt="Car image">
                    <button type="button" class="delete-image" onclick="deleteCarImage(${car.id}, ${index})">×</button>
                `;
                currentImagesDiv.appendChild(imageItem);
            });
        }
        
        document.getElementById('editCarModal').style.display = 'flex';
    })
    .catch(error => {
        showNotification('Failed to load car details', 'error');
    });
}

function showAddUserModal() {
    document.getElementById('addUserModal').style.display = 'flex';
    document.getElementById('addUserForm').reset();
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
}

// Handle add car
async function handleAddCar(event) {
    event.preventDefault();
    
    const carData = {
        name: document.getElementById('carName').value,
        brand: document.getElementById('carBrand').value,
        model: document.getElementById('carModel').value,
        year: parseInt(document.getElementById('carYear').value) || null,
        seats: parseInt(document.getElementById('carSeats').value),
        transmission: document.getElementById('carTransmission').value || null,
        fuel_type: document.getElementById('carFuelType').value || null,
        rent_price_per_day: parseFloat(document.getElementById('carPrice').value),
        discount_percentage: parseInt(document.getElementById('carDiscount').value) || 0,
        is_promoted: document.getElementById('carPromoted').checked,
        description: document.getElementById('carDescription').value || null,
        image_urls: []
    };
    
    // Create car first
    const response = await fetch(`${API_BASE}/cars/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(carData)
    });
    
    if (!response.ok) {
        throw new Error('Failed to add car');
    }
    
    const car = await response.json();
    
    // Upload images if any
    const imageInput = document.getElementById('carImages');
    if (imageInput.files.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < imageInput.files.length; i++) {
            formData.append('files', imageInput.files[i]);
        }
        
        const uploadResponse = await fetch(`${API_BASE}/cars/${car.id}/upload-images`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        if (!uploadResponse.ok) {
            showNotification('Car added but image upload failed', 'warning');
        }
    }
    
    showNotification('Car added successfully!', 'success');
    closeModal();
    document.getElementById('addCarForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    loadAdminCars();
}

// Handle rent car
function handleRentCar(event) {
    event.preventDefault();
    
    const startDate = new Date(document.getElementById('rentStartDate').value);
    const endDateValue = document.getElementById('rentEndDate').value;
    
    // Validate end date if provided
    if (endDateValue) {
        const endDate = new Date(endDateValue);
        if (endDate <= startDate) {
            showNotification('End date must be after start date', 'error');
            return;
        }
    }
    
    const rentalData = {
        car_id: parseInt(document.getElementById('rentCarId').value),
        start_date: document.getElementById('rentStartDate').value,
        end_date: document.getElementById('rentEndDate').value || null,
        notes: document.getElementById('rentNotes').value || null
    };
    
    fetch(`${API_BASE}/rentals/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(rentalData)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        return response.json().then(err => {
            throw new Error(err.detail || 'Failed to rent car');
        });
    })
    .then(data => {
        showNotification('Car rented successfully!', 'success');
        closeModal();
        document.getElementById('rentCarForm').reset();
        loadMyRentals();
    })
    .catch(error => {
        showNotification(error.message || 'Failed to rent car', 'error');
    });
}

// Return car
function returnCar(rentalId) {
    if (!confirm('Are you sure you want to return this car?')) return;
    
    fetch(`${API_BASE}/rentals/${rentalId}/return`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to return car');
    })
    .then(data => {
        showNotification('Car returned successfully!', 'success');
        loadMyRentals();
    })
    .catch(error => {
        showNotification('Failed to return car', 'error');
    });
}

// Handle edit car
async function handleEditCar(event) {
    event.preventDefault();
    
    const carId = document.getElementById('editCarId').value;
    const carData = {
        name: document.getElementById('editCarName').value,
        brand: document.getElementById('editCarBrand').value,
        model: document.getElementById('editCarModel').value,
        year: parseInt(document.getElementById('editCarYear').value) || null,
        seats: parseInt(document.getElementById('editCarSeats').value),
        transmission: document.getElementById('editCarTransmission').value || null,
        fuel_type: document.getElementById('editCarFuelType').value || null,
        rent_price_per_day: parseFloat(document.getElementById('editCarPrice').value),
        discount_percentage: parseInt(document.getElementById('editCarDiscount').value) || 0,
        is_promoted: document.getElementById('editCarPromoted').checked,
        status: document.getElementById('editCarStatus').value,
        description: document.getElementById('editCarDescription').value || null
    };
    
    const response = await fetch(`${API_BASE}/cars/${carId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(carData)
    });
    
    if (!response.ok) {
        throw new Error('Failed to update car');
    }
    
    // Upload additional images if any
    const imageInput = document.getElementById('editCarImages');
    if (imageInput.files.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < imageInput.files.length; i++) {
            formData.append('files', imageInput.files[i]);
        }
        
        const uploadResponse = await fetch(`${API_BASE}/cars/${carId}/upload-images`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        if (!uploadResponse.ok) {
            showNotification('Car updated but image upload failed', 'warning');
        }
    }
    
    showNotification('Car updated successfully!', 'success');
    closeModal();
    loadAdminCars();
}

// Delete car image
function deleteCarImage(carId, imageIndex) {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    fetch(`${API_BASE}/cars/${carId}/images/${imageIndex}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        showNotification('Image deleted successfully!', 'success');
        showEditCarModal(carId); // Refresh the modal
    })
    .catch(error => {
        showNotification('Failed to delete image', 'error');
    });
}

// Handle add user
function handleAddUser(event) {
    event.preventDefault();
    
    const userData = {
        username: document.getElementById('newUsername').value,
        email: document.getElementById('newEmail').value,
        full_name: document.getElementById('newFullName').value || null,
        password: document.getElementById('newPassword').value,
        role: document.getElementById('newUserRole').value
    };
    
    fetch(`${API_BASE}/users/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(userData)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        return response.json().then(err => {
            throw new Error(err.detail || 'Failed to add user');
        });
    })
    .then(data => {
        showNotification('User added successfully!', 'success');
        closeModal();
        document.getElementById('addUserForm').reset();
        loadAdminUsers();
    })
    .catch(error => {
        showNotification(error.message || 'Failed to add user', 'error');
    });
}

// Update user role
function updateUserRole(userId, newRole) {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    
    fetch(`${API_BASE}/users/${userId}/role?role=${newRole}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        return response.json().then(err => {
            throw new Error(err.detail || 'Failed to update role');
        });
    })
    .then(data => {
        showNotification('Role updated successfully!', 'success');
        loadAdminUsers();
    })
    .catch(error => {
        showNotification(error.message || 'Failed to update role', 'error');
    });
}

// Car detail modal functions
let currentDetailCar = null;
let currentImageIndex = 0;
let isZoomed = false;

function showCarDetail(carId) {
    fetch(`${API_BASE}/cars/${carId}`)
    .then(response => response.json())
    .then(car => {
        currentDetailCar = car;
        currentImageIndex = 0;
        isZoomed = false;
        
        document.getElementById('detailCarName').textContent = car.name;
        document.getElementById('detailCarBrand').textContent = `${car.brand} ${car.model}`;
        document.getElementById('detailYear').textContent = car.year || 'N/A';
        document.getElementById('detailSeats').textContent = car.seats;
        document.getElementById('detailTransmission').textContent = car.transmission || 'N/A';
        document.getElementById('detailFuelType').textContent = car.fuel_type || 'N/A';
        
        // Calculate discounted price
        const discount = car.discount_percentage || 0;
        const originalPrice = car.rent_price_per_day;
        const discountedPrice = discount > 0 ? (originalPrice * (1 - discount / 100)).toFixed(2) : originalPrice;
        
        let priceHtml = `$${discountedPrice}/day`;
        if (discount > 0) {
            priceHtml = `<span class="original-price">$${originalPrice}/day</span> $${discountedPrice}/day <span class="discount-badge">-${discount}%</span>`;
        }
        document.getElementById('detailPrice').innerHTML = priceHtml;
        document.getElementById('detailDescription').textContent = car.description || '';
        
        // Set main image
        if (car.image_urls && car.image_urls.length > 0) {
            const imageUrl = car.image_urls[0];
            // Convert relative URLs to absolute if needed
            const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE.replace('/api', '')}${imageUrl}`;
            document.getElementById('detailMainImage').src = absoluteImageUrl;
        } else {
            document.getElementById('detailMainImage').src = '';
            document.getElementById('detailMainImage').alt = 'No image';
        }
        
        document.getElementById('carDetailModal').style.display = 'flex';
    })
    .catch(error => {
        showNotification('Failed to load car details', 'error');
    });
}

function closeCarDetail() {
    document.getElementById('carDetailModal').style.display = 'none';
    currentDetailCar = null;
    currentImageIndex = 0;
    isZoomed = false;
    document.getElementById('detailMainImage').style.transform = 'scale(1)';
}

function navigateImage(direction) {
    if (!currentDetailCar || !currentDetailCar.image_urls || currentDetailCar.image_urls.length === 0) return;
    
    currentImageIndex += direction;
    if (currentImageIndex < 0) {
        currentImageIndex = currentDetailCar.image_urls.length - 1;
    } else if (currentImageIndex >= currentDetailCar.image_urls.length) {
        currentImageIndex = 0;
    }
    
    const imageUrl = currentDetailCar.image_urls[currentImageIndex];
    // Convert relative URLs to absolute if needed
    const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE.replace('/api', '')}${imageUrl}`;
    document.getElementById('detailMainImage').src = absoluteImageUrl;
}

function toggleZoom() {
    isZoomed = !isZoomed;
    const img = document.getElementById('detailMainImage');
    if (isZoomed) {
        img.style.transform = 'scale(2)';
        img.style.cursor = 'zoom-out';
    } else {
        img.style.transform = 'scale(1)';
        img.style.cursor = 'zoom-in';
    }
}

function rentFromDetail() {
    if (currentDetailCar) {
        closeCarDetail();
        showRentModal(currentDetailCar.id);
    }
}

// Delete car
function deleteCar(carId) {
    if (!confirm('Are you sure you want to delete this car?')) return;
    
    fetch(`${API_BASE}/cars/${carId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (response.ok) {
            showNotification('Car deleted successfully!', 'success');
            loadAdminCars();
        } else {
            throw new Error('Failed to delete car');
        }
    })
    .catch(error => {
        showNotification('Failed to delete car', 'error');
    });
}

// Delete user
function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    fetch(`${API_BASE}/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (response.ok) {
            showNotification('User deleted successfully!', 'success');
            loadAdminUsers();
        } else {
            throw new Error('Failed to delete user');
        }
    })
    .catch(error => {
        showNotification('Failed to delete user', 'error');
    });
}

// Edit car (placeholder for future implementation)
function editCar(carId) {
    showNotification('Edit functionality coming soon!', 'info');
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal();
    }
}
