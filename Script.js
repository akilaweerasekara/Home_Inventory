// ============================================
// FAMILYSYNC - HOME INVENTORY SYSTEM
// ============================================
// Features:
// 1. NO login required for normal use
// 2. Password only for private inventory access
// 3. Admin can add users (set initial password)
// 4. Users can change their own passwords
// 5. LocalStorage persistence
// 6. Fast access - search works immediately
// ============================================

class FamilySyncApp {
    constructor() {
        this.storageKeys = {
            users: 'familySync_users_v2',
            items: 'familySync_items_v2',
            currentUser: 'familySync_currentUser_v2',
            activities: 'familySync_activities_v2'
        };
        
        this.currentUser = null;
        this.selectedUserForItem = null;
        this.photoData = null;
        this.privateAccessGranted = false;
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateUI();
        
        // Show welcome notification
        setTimeout(() => {
            this.showNotification('success', 'Welcome to FamilySync! Start by searching or adding items.');
        }, 1000);
    }

    loadData() {
        // Load users or create default admin
        let users = this.loadFromStorage(this.storageKeys.users);
        if (!users || users.length === 0) {
            users = this.createDefaultUsers();
            this.saveToStorage(this.storageKeys.users, users);
        }
        
        // Load items or create sample data
        let items = this.loadFromStorage(this.storageKeys.items);
        if (!items || items.length === 0) {
            items = this.createSampleItems();
            this.saveToStorage(this.storageKeys.items, items);
        }
        
        this.users = users;
        this.items = items;
        
        // Set current user to Guest by default
        this.currentUser = { id: 0, name: 'Guest', initials: 'G', avatarColor: '#6c757d', role: 'guest' };
        
        // Update user selection for adding items
        this.updateUserSelection();
    }

    createDefaultUsers() {
        // Create default admin user (password: admin123)
        return [
            {
                id: 1,
                name: 'Admin',
                initials: 'A',
                avatarColor: '#4361ee',
                role: 'admin',
                passwordHash: this.hashPassword('admin123'),
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: 'John',
                initials: 'J',
                avatarColor: '#4ade80',
                role: 'member',
                passwordHash: this.hashPassword('john123'),
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                name: 'Jane',
                initials: 'JA',
                avatarColor: '#f59e0b',
                role: 'member',
                passwordHash: this.hashPassword('jane123'),
                createdAt: new Date().toISOString()
            }
        ];
    }

    createSampleItems() {
        return [
            {
                id: 1,
                name: "Toolbox",
                location: "Garage shelf - left side",
                category: "tools",
                quantity: 1,
                description: "Complete toolbox with all essential tools",
                type: "family",
                addedBy: 2,
                addedByName: "John",
                photo: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 2,
                name: "First Aid Kit",
                location: "Kitchen cabinet above fridge",
                category: "medicine",
                quantity: 1,
                description: "Emergency medical supplies",
                type: "family",
                addedBy: 3,
                addedByName: "Jane",
                photo: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 3,
                name: "Passport",
                location: "Bedroom safe",
                category: "documents",
                quantity: 1,
                description: "Personal passport",
                type: "private",
                addedBy: 2,
                addedByName: "John",
                photo: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
    }

    // ===== STORAGE METHODS =====
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    }

    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Load error:', e);
            return null;
        }
    }

    // ===== PASSWORD METHODS =====
    hashPassword(password) {
        // Simple hash for demonstration (in real app use stronger hashing)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    verifyPassword(user, password) {
        return user.passwordHash === this.hashPassword(password);
    }

    // ===== UI METHODS =====
    setupEventListeners() {
        // Search input event
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        // Search category change
        const searchCategory = document.getElementById('searchCategory');
        if (searchCategory) {
            searchCategory.addEventListener('change', () => {
                this.performSearch();
            });
        }
    }

    updateUI() {
        // Update current user display
        const avatar = document.getElementById('currentUserAvatar');
        const name = document.getElementById('currentUserName');
        
        if (avatar && name) {
            avatar.textContent = this.currentUser.initials;
            avatar.style.background = this.currentUser.avatarColor;
            name.textContent = this.currentUser.name;
        }

        // Load dashboard if active
        if (document.getElementById('dashboard').classList.contains('active')) {
            this.loadDashboard();
        }
    }

    updateUserSelection() {
        const container = document.getElementById('itemUserSelection');
        if (!container) return;

        // Add Guest option
        let html = `
            <div class="user-option ${this.selectedUserForItem?.id === 0 ? 'selected' : ''}" 
                 onclick="app.selectUserForItem(0)">
                <div class="user-avatar" style="background: #6c757d;">G</div>
                <div class="user-name">Guest</div>
            </div>
        `;

        // Add registered users
        this.users.forEach(user => {
            html += `
                <div class="user-option ${this.selectedUserForItem?.id === user.id ? 'selected' : ''}" 
                     onclick="app.selectUserForItem(${user.id})">
                    <div class="user-avatar" style="background: ${user.avatarColor};">${user.initials}</div>
                    <div class="user-name">${user.name}</div>
                </div>
            `;
        });

        container.innerHTML = html;
        
        // Default to Guest if none selected
        if (!this.selectedUserForItem) {
            this.selectUserForItem(0);
        }
    }

    selectUserForItem(userId) {
        if (userId === 0) {
            this.selectedUserForItem = { id: 0, name: 'Guest', initials: 'G', avatarColor: '#6c757d' };
        } else {
            this.selectedUserForItem = this.users.find(u => u.id === userId);
        }
        this.updateUserSelection();
    }

    // ===== ITEM MANAGEMENT =====
    addItem() {
        const itemName = document.getElementById('itemName').value.trim();
        const itemLocation = document.getElementById('itemLocation').value.trim();
        const itemCategory = document.getElementById('itemCategory').value || 'other';
        const itemQuantity = parseInt(document.getElementById('itemQuantity').value) || 1;
        const itemDescription = document.getElementById('itemDescription').value.trim();
        const inventoryType = document.querySelector('input[name="inventoryType"]:checked').value;

        // Validate
        if (!itemName || !itemLocation) {
            this.showNotification('error', 'Please fill in item name and location');
            return;
        }

        if (!this.selectedUserForItem) {
            this.showNotification('error', 'Please select who is adding this item');
            return;
        }

        // Check if private item but user is Guest
        if (inventoryType === 'private' && this.selectedUserForItem.id === 0) {
            this.showNotification('error', 'Guest cannot add private items. Please select a registered user.');
            return;
        }

        // Check if private item requires password
        if (inventoryType === 'private' && this.selectedUserForItem.id > 0) {
            this.showPasswordModalForAddItem({
                name: itemName,
                location: itemLocation,
                category: itemCategory,
                quantity: itemQuantity,
                description: itemDescription,
                type: inventoryType
            });
            return;
        }

        // Add the item
        this.saveItem({
            name: itemName,
            location: itemLocation,
            category: itemCategory,
            quantity: itemQuantity,
            description: itemDescription,
            type: inventoryType
        });
    }

    saveItem(itemData) {
        const newItem = {
            id: this.items.length + 1,
            ...itemData,
            addedBy: this.selectedUserForItem.id,
            addedByName: this.selectedUserForItem.name,
            photo: this.photoData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.items.push(newItem);
        this.saveToStorage(this.storageKeys.items, this.items);
        
        // Reset form
        document.getElementById('addItemForm').reset();
        document.getElementById('photoPreview').style.display = 'none';
        document.getElementById('photoPreview').src = '';
        this.photoData = null;

        // Show success message
        const message = itemData.type === 'family' 
            ? `"${itemData.name}" added to Family Inventory`
            : `"${itemData.name}" added to your Private Inventory`;
        
        this.showNotification('success', message);

        // Switch to appropriate tab
        if (itemData.type === 'family') {
            this.switchTab('familyInventory');
        } else {
            this.switchTab('privateInventory');
        }
    }

    // ===== SEARCH =====
    performSearch() {
        const query = document.getElementById('searchInput').value.toLowerCase().trim();
        const category = document.getElementById('searchCategory').value;
        
        const results = this.items.filter(item => {
            // Skip private items unless user has access
            if (item.type === 'private') {
                // User can see their own private items if access granted
                if (this.privateAccessGranted && item.addedBy === this.currentUser.id) {
                    // Continue filtering
                } else {
                    return false;
                }
            }
            
            // Category filter
            if (category && item.category !== category) {
                return false;
            }
            
            // Search query
            if (!query) return true;
            
            return (
                item.name.toLowerCase().includes(query) ||
                item.location.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query)
            );
        });

        this.displayItems('searchResults', results);
    }

    // ===== DISPLAY METHODS =====
    displayItems(containerId, items) {
        const container = document.getElementById(containerId);
        
        if (!items || items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-box-open"></i>
                    </div>
                    <h3 class="empty-state-title">No items found</h3>
                    <p class="empty-state-text">
                        Try adding some items or adjusting your search criteria.
                    </p>
                    <button class="btn btn-primary" onclick="app.switchTab('addItem')">
                        <i class="fas fa-plus-circle"></i> Add New Item
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = items.map(item => this.createItemCard(item)).join('');
    }

    createItemCard(item) {
        const isPrivate = item.type === 'private';
        const isOwner = this.currentUser && item.addedBy === this.currentUser.id;
        
        // Format date
        const date = new Date(item.createdAt);
        const dateStr = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        // Category icon mapping
        const categoryIcons = {
            documents: 'fa-file-alt',
            tools: 'fa-tools',
            electronics: 'fa-plug',
            kitchen: 'fa-utensils',
            clothing: 'fa-tshirt',
            medicine: 'fa-first-aid',
            valuables: 'fa-gem',
            other: 'fa-box'
        };
        
        const categoryIcon = categoryIcons[item.category] || 'fa-box';
        
        return `
            <div class="inventory-card ${isPrivate ? 'private' : ''}">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">${item.name}</h3>
                        <span class="card-category">
                            <i class="fas ${categoryIcon}"></i> ${item.category}
                        </span>
                    </div>
                    ${isPrivate ? `
                        <span class="private-badge">
                            <i class="fas fa-lock"></i> Private
                        </span>
                    ` : ''}
                </div>
                
                <div class="card-body">
                    <div class="card-info">
                        <i class="fas fa-map-marker-alt"></i>
                        <span><strong>Location:</strong> ${item.location}</span>
                    </div>
                    
                    <div class="card-info">
                        <i class="fas fa-box"></i>
                        <span><strong>Quantity:</strong> ${item.quantity}</span>
                    </div>
                    
                    ${item.photo ? `
                        <img src="${item.photo}" class="card-photo" alt="${item.name}">
                    ` : ''}
                    
                    ${item.description ? `
                        <p class="card-description">${item.description}</p>
                    ` : ''}
                </div>
                
                <div class="card-footer">
                    <div class="card-date">
                        <i class="far fa-calendar"></i> ${dateStr} by ${item.addedByName}
                        ${isOwner ? ' <i class="fas fa-user-check" style="color: var(--success);"></i>' : ''}
                    </div>
                    
                    <div class="card-actions">
                        <button class="btn btn-success btn-sm" onclick="app.markAsFound(${item.id})">
                            <i class="fas fa-check"></i> Found
                        </button>
                        ${isOwner ? `
                            <button class="btn btn-warning btn-sm" onclick="app.editItem(${item.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="app.deleteItem(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // ===== DASHBOARD =====
    loadDashboard() {
        // Calculate stats
        const totalItems = this.items.length;
        const familyItems = this.items.filter(item => item.type === 'family').length;
        const categories = [...new Set(this.items.map(item => item.category))].length;
        
        // Update stats
        const statsHTML = `
            <div class="stat-card">
                <div class="stat-value">${totalItems}</div>
                <div class="stat-label">Total Items</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${familyItems}</div>
                <div class="stat-label">Family Items</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${categories}</div>
                <div class="stat-label">Categories</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.users.length}</div>
                <div class="stat-label">Family Members</div>
            </div>
        `;
        
        document.getElementById('dashboardStats').innerHTML = statsHTML;
        
        // Show recent items (family items + user's private items if access granted)
        const recentItems = this.items
            .filter(item => {
                if (item.type === 'family') return true;
                if (item.type === 'private' && this.privateAccessGranted && item.addedBy === this.currentUser.id) {
                    return true;
                }
                return false;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 6);
        
        this.displayItems('recentItems', recentItems);
    }

    // ===== TAB MANAGEMENT =====
    switchTab(tabId) {
        // Update tabs
        document.querySelectorAll('.tab').forEach(tab => {
            if (tab.getAttribute('data-target') === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            if (section.id === tabId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
        
        // Load content
        switch(tabId) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'familyInventory':
                const familyItems = this.items.filter(item => item.type === 'family');
                this.displayItems('familyItems', familyItems);
                break;
            case 'privateInventory':
                if (this.privateAccessGranted && this.currentUser.id > 0) {
                    const privateItems = this.items.filter(item => 
                        item.type === 'private' && item.addedBy === this.currentUser.id
                    );
                    this.displayItems('privateItems', privateItems);
                }
                break;
            case 'searchItems':
                this.performSearch();
                break;
        }
    }

    // ===== PRIVATE INVENTORY ACCESS =====
    showPrivateAccessModal() {
        if (this.privateAccessGranted && this.currentUser.id > 0) {
            this.switchTab('privateInventory');
            return;
        }

        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h2 class="modal-title"><i class="fas fa-lock"></i> Access Private Inventory</h2>
                        <button class="modal-close" onclick="app.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="margin-bottom: 20px; color: var(--gray);">
                            Select your account and enter password to access private items
                        </p>
                        
                        <div class="form-group">
                            <label class="form-label">Select User</label>
                            <div class="user-selection" id="privateAccessUserSelection">
                                ${this.users.map(user => `
                                    <div class="user-option" onclick="app.selectPrivateAccessUser(${user.id})">
                                        <div class="user-avatar" style="background: ${user.avatarColor};">${user.initials}</div>
                                        <div class="user-name">${user.name}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="form-group" id="passwordGroup" style="display: none;">
                            <label class="form-label">Password</label>
                            <input type="password" class="form-control" id="privateAccessPassword" placeholder="Enter your password">
                        </div>
                        
                        <div style="display: flex; gap: 15px; margin-top: 30px;">
                            <button class="btn btn-primary" id="privateAccessButton" onclick="app.verifyPrivateAccess()" disabled>
                                <i class="fas fa-key"></i> Access Private Items
                            </button>
                            <button class="btn" onclick="app.closeModal()" style="background: var(--light);">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalsContainer').innerHTML = modalHTML;
        this.privateAccessSelectedUser = null;
    }

    selectPrivateAccessUser(userId) {
        this.privateAccessSelectedUser = this.users.find(u => u.id === userId);
        
        // Update UI
        document.querySelectorAll('#privateAccessUserSelection .user-option').forEach(option => {
            option.classList.remove('selected');
        });
        event.target.closest('.user-option').classList.add('selected');
        
        document.getElementById('passwordGroup').style.display = 'block';
        document.getElementById('privateAccessButton').disabled = false;
    }

    verifyPrivateAccess() {
        if (!this.privateAccessSelectedUser) {
            this.showNotification('error', 'Please select a user');
            return;
        }

        const password = document.getElementById('privateAccessPassword').value;
        if (!password) {
            this.showNotification('error', 'Please enter password');
            return;
        }

        if (this.verifyPassword(this.privateAccessSelectedUser, password)) {
            this.privateAccessGranted = true;
            this.currentUser = this.privateAccessSelectedUser;
            this.updateUI();
            this.closeModal();
            
            // Update private tab icon
            const privateTab = document.querySelector('.tab[data-target="privateInventory"]');
            privateTab.innerHTML = '<i class="fas fa-unlock"></i> Private Items';
            
            // Switch to private inventory
            this.switchTab('privateInventory');
            
            this.showNotification('success', `Welcome ${this.currentUser.name}! Private inventory unlocked.`);
        } else {
            this.showNotification('error', 'Incorrect password');
        }
    }

    // ===== ADMIN FUNCTIONS =====
    showAdminModal() {
        // Check if current user is admin
        const adminUser = this.users.find(u => u.role === 'admin');
        
        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h2 class="modal-title"><i class="fas fa-cog"></i> Admin Panel</h2>
                        <button class="modal-close" onclick="app.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="admin-panel">
                            <h3 style="margin-bottom: 20px; color: var(--primary-dark);">
                                <i class="fas fa-users"></i> Family Members
                            </h3>
                            
                            <div class="users-grid">
                                ${this.users.map(user => `
                                    <div class="user-card">
                                        <div class="user-card-avatar" style="background: ${user.avatarColor}">
                                            ${user.initials}
                                        </div>
                                        <h3 class="user-card-name">${user.name}</h3>
                                        <span class="user-card-role">${user.role}</span>
                                        <div style="margin-top: 15px;">
                                            <button class="btn btn-warning btn-sm" onclick="app.showChangePasswordModal(${user.id})" 
                                                    ${user.role === 'admin' && this.currentUser.id !== user.id ? 'disabled' : ''}>
                                                <i class="fas fa-key"></i> Change Password
                                            </button>
                                            <button class="btn btn-danger btn-sm" onclick="app.showDeleteUserModal(${user.id})" 
                                                    ${user.role === 'admin' ? 'disabled' : ''}>
                                                <i class="fas fa-trash"></i> Remove
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--light-gray);">
                                <h4 style="margin-bottom: 15px; color: var(--primary-dark);">
                                    <i class="fas fa-user-plus"></i> Add New Family Member
                                </h4>
                                
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label class="form-label">Name</label>
                                        <input type="text" class="form-control" id="newUserName" placeholder="Enter name">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Initial Password</label>
                                        <input type="password" class="form-control" id="newUserPassword" placeholder="Set initial password">
                                    </div>
                                </div>
                                
                                <button class="btn btn-primary" onclick="app.addNewUser()" style="margin-top: 10px;">
                                    <i class="fas fa-plus"></i> Add Member
                                </button>
                            </div>
                            
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--light-gray);">
                                <h4 style="margin-bottom: 15px; color: var(--primary-dark);">
                                    <i class="fas fa-database"></i> Data Management
                                </h4>
                                <button class="btn btn-warning" onclick="app.exportData()">
                                    <i class="fas fa-download"></i> Export Data
                                </button>
                                <button class="btn btn-success" onclick="app.importData()" style="margin-left: 10px;">
                                    <i class="fas fa-upload"></i> Import Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalsContainer').innerHTML = modalHTML;
    }

    addNewUser() {
        const name = document.getElementById('newUserName').value.trim();
        const password = document.getElementById('newUserPassword').value.trim();
        
        if (!name) {
            this.showNotification('error', 'Please enter name for new user');
            return;
        }
        
        if (!password) {
            this.showNotification('error', 'Please set initial password');
            return;
        }
        
        if (password.length < 4) {
            this.showNotification('error', 'Password must be at least 4 characters');
            return;
        }
        
        // Create new user
        const newUser = {
            id: this.users.length + 1,
            name: name,
            initials: name.substring(0, 2).toUpperCase(),
            avatarColor: this.getRandomColor(),
            role: 'member',
            passwordHash: this.hashPassword(password),
            createdAt: new Date().toISOString()
        };
        
        this.users.push(newUser);
        this.saveToStorage(this.storageKeys.users, this.users);
        
        // Update UI
        this.updateUserSelection();
        this.showAdminModal(); // Refresh admin panel
        
        this.showNotification('success', `Added new family member: ${name}`);
    }

    showChangePasswordModal(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h2 class="modal-title"><i class="fas fa-key"></i> Change Password</h2>
                        <button class="modal-close" onclick="app.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="margin-bottom: 20px; color: var(--gray);">
                            Changing password for <strong>${user.name}</strong>
                        </p>
                        
                        <div class="form-group">
                            <label class="form-label">Current Password</label>
                            <input type="password" class="form-control" id="currentPassword" placeholder="Enter current password">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">New Password</label>
                            <input type="password" class="form-control" id="newPassword" placeholder="Enter new password">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Confirm New Password</label>
                            <input type="password" class="form-control" id="confirmPassword" placeholder="Confirm new password">
                        </div>
                        
                        <div style="display: flex; gap: 15px; margin-top: 30px;">
                            <button class="btn btn-primary" onclick="app.changeUserPassword(${userId})">
                                <i class="fas fa-save"></i> Change Password
                            </button>
                            <button class="btn" onclick="app.closeModal()" style="background: var(--light);">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalsContainer').innerHTML = modalHTML;
    }

    changeUserPassword(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Verify current password
        if (!this.verifyPassword(user, currentPassword)) {
            this.showNotification('error', 'Current password is incorrect');
            return;
        }

        // Check new password
        if (newPassword.length < 4) {
            this.showNotification('error', 'New password must be at least 4 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification('error', 'New passwords do not match');
            return;
        }

        // Update password
        user.passwordHash = this.hashPassword(newPassword);
        this.saveToStorage(this.storageKeys.users, this.users);
        
        this.closeModal();
        this.showNotification('success', `Password changed for ${user.name}`);
    }

    showDeleteUserModal(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user || user.role === 'admin') return;

        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h2 class="modal-title"><i class="fas fa-trash"></i> Remove Family Member</h2>
                        <button class="modal-close" onclick="app.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="margin-bottom: 20px; color: var(--gray);">
                            To remove <strong>${user.name}</strong>, please enter their password for confirmation.
                        </p>
                        
                        <div class="form-group">
                            <label class="form-label">${user.name}'s Password</label>
                            <input type="password" class="form-control" id="deleteUserPassword" placeholder="Enter ${user.name}'s password">
                        </div>
                        
                        <p style="margin: 20px 0; padding: 15px; background: var(--light); border-radius: 8px; color: var(--danger);">
                            <i class="fas fa-exclamation-triangle"></i> 
                            <strong>Warning:</strong> This will permanently remove ${user.name} from the system. 
                            Their private items will also be removed.
                        </p>
                        
                        <div style="display: flex; gap: 15px; margin-top: 30px;">
                            <button class="btn btn-danger" onclick="app.deleteUser(${userId})">
                                <i class="fas fa-trash"></i> Remove User
                            </button>
                            <button class="btn" onclick="app.closeModal()" style="background: var(--light);">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalsContainer').innerHTML = modalHTML;
    }

    deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user || user.role === 'admin') return;

        const password = document.getElementById('deleteUserPassword').value;
        if (!this.verifyPassword(user, password)) {
            this.showNotification('error', 'Incorrect password');
            return;
        }

        // Remove user's private items
        this.items = this.items.filter(item => 
            !(item.type === 'private' && item.addedBy === userId)
        );

        // Remove user
        this.users = this.users.filter(u => u.id !== userId);
        this.saveToStorage(this.storageKeys.users, this.users);
        this.saveToStorage(this.storageKeys.items, this.items);

        // Update UI
        this.updateUserSelection();
        this.closeModal();
        
        this.showNotification('success', `Removed ${user.name} from family members`);
        
        // Refresh admin panel
        this.showAdminModal();
    }

    // ===== UTILITY METHODS =====
    showPasswordModalForAddItem(itemData) {
        const user = this.selectedUserForItem;
        
        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h2 class="modal-title"><i class="fas fa-lock"></i> Add Private Item</h2>
                        <button class="modal-close" onclick="app.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="margin-bottom: 20px; color: var(--gray);">
                            Enter ${user.name}'s password to add private item
                        </p>
                        
                        <div class="form-group">
                            <label class="form-label">Password for ${user.name}</label>
                            <input type="password" class="form-control" id="addItemPassword" placeholder="Enter password">
                        </div>
                        
                        <div style="display: flex; gap: 15px; margin-top: 30px;">
                            <button class="btn btn-primary" onclick="app.verifyPasswordForAddItem(${JSON.stringify(itemData).replace(/"/g, '&quot;')})">
                                <i class="fas fa-save"></i> Save Private Item
                            </button>
                            <button class="btn" onclick="app.closeModal()" style="background: var(--light);">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalsContainer').innerHTML = modalHTML;
    }

    verifyPasswordForAddItem(itemData) {
        const password = document.getElementById('addItemPassword').value;
        const user = this.selectedUserForItem;

        if (!this.verifyPassword(user, password)) {
            this.showNotification('error', 'Incorrect password');
            return;
        }

        this.closeModal();
        this.saveItem(itemData);
    }

    handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('error', 'File size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.photoData = e.target.result;
            const preview = document.getElementById('photoPreview');
            preview.src = this.photoData;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    markAsFound(itemId) {
        const item = this.items.find(item => item.id === itemId);
        if (item) {
            this.showNotification('success', `Marked "${item.name}" as found!`);
        }
    }

    editItem(itemId) {
        const item = this.items.find(item => item.id === itemId);
        if (item) {
            // In a full implementation, this would open an edit form
            this.showNotification('info', `Edit functionality for "${item.name}" would open here.`);
        }
    }

    deleteItem(itemId) {
        if (!confirm('Are you sure you want to delete this item?')) {
            return;
        }

        const item = this.items.find(item => item.id === itemId);
        if (!item) return;

        // Check permission for private items
        if (item.type === 'private' && item.addedBy !== this.currentUser.id) {
            this.showNotification('error', 'You can only delete your own private items');
            return;
        }

        this.items = this.items.filter(i => i.id !== itemId);
        this.saveToStorage(this.storageKeys.items, this.items);
        
        // Refresh current view
        const activeSection = document.querySelector('.content-section.active').id;
        this.switchTab(activeSection);
        
        this.showNotification('success', `Deleted "${item.name}"`);
    }

    exportData() {
        const data = {
            users: this.users,
            items: this.items,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `familysync-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('success', 'Data exported successfully');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (confirm('This will replace all current data. Continue?')) {
                        if (data.users && data.items) {
                            this.users = data.users;
                            this.items = data.items;
                            this.saveToStorage(this.storageKeys.users, this.users);
                            this.saveToStorage(this.storageKeys.items, this.items);
                            
                            // Update UI
                            this.updateUserSelection();
                            this.loadDashboard();
                            
                            this.showNotification('success', 'Data imported successfully');
                        } else {
                            this.showNotification('error', 'Invalid backup file');
                        }
                    }
                } catch (error) {
                    this.showNotification('error', 'Error reading backup file');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    closeModal() {
        document.getElementById('modalsContainer').innerHTML = '';
    }

    showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}"></i>
            </div>
            <div>
                <strong>${type === 'success' ? 'Success!' : type === 'error' ? 'Error!' : 'Info!'}</strong>
                <p style="margin-top: 5px;">${message}</p>
            </div>
        `;
        
        document.getElementById('modalsContainer').appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getRandomColor() {
        const colors = ['#4361ee', '#4ade80', '#f59e0b', '#4cc9f0', '#9d4edd', '#ff6d00'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

// Initialize app when page loads
window.app = new FamilySyncApp();