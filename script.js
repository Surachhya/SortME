// AUTH: Handle login/signup
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const authSection = document.getElementById("authSection");
const appContent = document.getElementById("appContent");
const welcomeUser = document.getElementById("welcomeUser");
const logoutBtn = document.getElementById("logoutBtn");

// Toggle between login and signup forms
document.getElementById("showSignup").addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none";
    signupForm.style.display = "block";
});
document.getElementById("showLogin").addEventListener("click", (e) => {
    e.preventDefault();
    signupForm.style.display = "none";
    loginForm.style.display = "block";
});

// Get all users from localStorage
function getUsers() {
    return JSON.parse(localStorage.getItem("sort-users") || "{}");
}
// Save all users to localStorage
function saveUsers(users) {
    localStorage.setItem("sort-users", JSON.stringify(users));
}
// Save logged-in user info to localStorage
function setLoggedInUser(email) {
    localStorage.setItem("loggedInUser", JSON.stringify({ email }));
}
// Retrieve logged-in user email from localStorage
function getLoggedInUser() {
    const session = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
    return session.email || null;
}

// Logout function: clear session and reload page
function logout() {
    localStorage.removeItem("loggedInUser");
    location.reload();
}
logoutBtn.addEventListener("click", logout);

// Handle login form submission
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;
    const users = getUsers();

    if (!users[email] || users[email].password !== password) {
        alert("Invalid email or password.");
        return;
    }

    setLoggedInUser(email);
    showApp();
});

// Handle signup form submission
signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("signupEmail").value.trim().toLowerCase();
    const name = document.getElementById("signupName").value.trim();
    const password = document.getElementById("signupPassword").value;
    const users = getUsers();

    if (users[email]) {
        alert("User already exists.");
        return;
    }

    users[email] = { name, password };
    saveUsers(users);
    setLoggedInUser(email);
    showApp();
});

// Show app UI and update navbar after login
function showApp() {
    const email = getLoggedInUser();
    if (!email) return;

    const users = getUsers();
    const user = users[email];
    if (!user) return;

    // Hide auth forms, show app content
    authSection.style.display = "none";
    appContent.style.display = "block";

    // Show welcome message and logout button in navbar
    welcomeUser.innerHTML = `Welcome, <strong>${user.name}</strong>`;
    welcomeUser.style.display = "inline";
    logoutBtn.style.display = "inline-block";
}


// State: all groups
const groups = [];

// Utility to sanitize strings to ID-like keys (for CSS classes, DOM ids)
function sanitizeKey(str) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
}

// Collapse all groups except the one with id groupId
function collapseAllExcept(groupId) {
    document.querySelectorAll('.group-panel').forEach(panel => {
        const header = panel.querySelector('.group-header');
        const icon = header.querySelector('.toggle-icon');
        const content = panel.querySelector('.group-content');

        if (panel.dataset.groupId === groupId) {
            content.classList.add('active');
            header.setAttribute('aria-expanded', 'true');
            icon.textContent = '−';
        } else {
            content.classList.remove('active');
            header.setAttribute('aria-expanded', 'false');
            icon.textContent = '+';
        }
    });
}

// Create a new group panel DOM from group data and append to container
function renderGroup(group, showForm) {
    const container = document.getElementById('groupsContainer');

    // Create panel
    const panel = document.createElement('section');
    panel.className = 'group-panel';
    panel.dataset.groupId = group.id;

    // Header
    const header = document.createElement('header');
    header.className = 'group-header';
    header.tabIndex = 0;
    header.setAttribute('role', 'button');
    header.setAttribute('aria-expanded', 'false');
    header.setAttribute('aria-controls', `content-${group.id}`);
    header.innerHTML = `
        <span>${group.title}</span>
        <span class="toggle-icon">+</span>
      `;
    panel.appendChild(header);

    // Content div (hidden initially)
    const content = document.createElement('div');
    content.className = 'group-content';
    content.id = `content-${group.id}`;

    // Add Item form inside content
    const addItemDiv = document.createElement('div');
    addItemDiv.className = 'input-inline';
    addItemDiv.innerHTML = `
        <input type="text" placeholder="Item name" aria-label="Item name" />
        <select aria-label="Category">
          <option value="${group.categories[0]}">${group.categories[0]}</option>
          <option value="${group.categories[1]}">${group.categories[1]}</option>
        </select>
        <button type="button">Add Item</button>
      `;
    content.appendChild(addItemDiv);

    // Container for boxes: available items, category 1 box, category 2 box
    const boxesDiv = document.createElement('div');
    boxesDiv.className = 'container';
    boxesDiv.innerHTML = `
        <div class="box" data-box="source" aria-label="Available items"></div>
        <div class="box" data-box="category1" aria-label="${group.categories[0]} container"><h3>${group.categories[0]}</h3></div>
        <div class="box" data-box="category2" aria-label="${group.categories[1]} container"><h3>${group.categories[1]}</h3></div>
      `;
    content.appendChild(boxesDiv);

    panel.appendChild(content);
    container.appendChild(panel);

    // Event listeners for header toggle
    header.addEventListener('click', () => {
        const isExpanded = header.getAttribute('aria-expanded') === 'true';
        if (isExpanded) {
            // Collapse
            content.classList.remove('active');
            header.setAttribute('aria-expanded', 'false');
            header.querySelector('.toggle-icon').textContent = '+';
        } else {
            collapseAllExcept(group.id);
        }
    });
    header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            header.click();
        }
    });

    // Add initial items (empty for now)
    group.items = group.items || [];

    // Add items to source box
    const sourceBox = boxesDiv.querySelector('[data-box="source"]');
    group.items.forEach(it => {
        const div = createItemDiv(it.name, it.category, group);
        sourceBox.appendChild(div);
    });

    // Setup add item button
    const addBtn = addItemDiv.querySelector('button');
    const itemNameInput = addItemDiv.querySelector('input');
    const categorySelect = addItemDiv.querySelector('select');

    addBtn.addEventListener('click', () => {
        const name = itemNameInput.value.trim();
        const cat = categorySelect.value;
        if (!name) return;
        // Add item to group's item list
        group.items.push({ name, category: cat });

        // Create DOM item
        const newItem = createItemDiv(name, cat, group);
        sourceBox.appendChild(newItem);
        itemNameInput.value = '';
        itemNameInput.focus();

        saveState();
    });

    let selectedItem = null;

    // Enable click-select only within this group's source box
    boxesDiv.addEventListener("click", (e) => {
        const clickedItem = e.target.closest('.item');
        const clickedBox = e.target.closest('.box');

        if (!clickedBox) return;

        const boxType = clickedBox.dataset.box;

        // Case 1: Click on an item in the source to select/deselect
        if (boxType === 'source' && clickedItem) {
            // Deselect if already selected
            if (selectedItem === clickedItem) {
                clickedItem.classList.remove('selected-item');
                selectedItem = null;
            } else {
                // Remove selection from previous, if any
                if (selectedItem) selectedItem.classList.remove('selected-item');
                selectedItem = clickedItem;
                selectedItem.classList.add('selected-item');
            }
            return;
        }

        // Case 2: Click on a target box to drop selected item
        if (selectedItem && clickedBox.classList.contains('box') && boxType !== 'source') {
            const targetCategory =
                boxType === 'category1' ? group.categories[0] :
                    boxType === 'category2' ? group.categories[1] : null;

            const itemCategory = selectedItem.dataset.category;

            if (!targetCategory) return;

            if (itemCategory === targetCategory) {
                // Success
                selectedItem.classList.remove('category-1', 'category-2', 'selected-item');
                selectedItem.classList.add(boxType === 'category1' ? 'category-1' : 'category-2');
                clickedBox.appendChild(selectedItem);
                saveState();
            } else {
                // Invalid
                clickedBox.classList.add("invalid-drop");
                setTimeout(() => clickedBox.classList.remove("invalid-drop"), 500);
            }

            // Clear selection
            selectedItem.classList.remove('selected-item');
            selectedItem = null;
        }
    });




    // Drag & Drop logic for boxes inside this group
    boxesDiv.querySelectorAll('.box').forEach(box => {
        box.addEventListener('dragover', (e) => e.preventDefault());
        box.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedItem = document.querySelector('.dragging');
            if (!draggedItem) return;
            const boxType = box.getAttribute('data-box');

            // Determine target category based on boxType
            let targetCategory = null;
            if (boxType === 'category1') targetCategory = group.categories[0];
            else if (boxType === 'category2') targetCategory = group.categories[1];
            else if (boxType === 'source') targetCategory = 'source';

            const itemCategory = draggedItem.dataset.category;

            if (targetCategory === 'source' || itemCategory === targetCategory) {
                // Move item
                // Update visual classes for color
                draggedItem.classList.remove('category-1', 'category-2');
                if (targetCategory === group.categories[0]) {
                    draggedItem.classList.add('category-1');
                } else if (targetCategory === group.categories[1]) {
                    draggedItem.classList.add('category-2');
                }
                box.appendChild(draggedItem);

                saveState();
            } else {
                // Invalid drop feedback
                box.classList.add('invalid-drop');
                setTimeout(() => box.classList.remove('invalid-drop'), 500);
            }
        });
    });

    // Drag start/end for items inside this panel
    content.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('item')) {
            e.target.classList.add('dragging');
        }
    });

    content.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('item')) {
            e.target.classList.remove('dragging');
        }
    });
}

// Create item div with drag capabilities and styling based on category index
function createItemDiv(name, category, group) {
    const div = document.createElement('div');
    div.className = 'item';
    div.setAttribute('draggable', 'true');
    div.textContent = name;
    div.dataset.category = category;

    // Add category color class (category-1 or category-2)
    if (category === group.categories[0]) div.classList.add('category-1');
    else if (category === group.categories[1]) div.classList.add('category-2');
    else div.classList.remove('category-1', 'category-2');

    return div;
}

// Save entire groups state in localStorage
function saveState() {
    const email = getLoggedInUser();
    if (!email) return;

    document.querySelectorAll('.group-panel').forEach(panel => {
        const groupId = panel.dataset.groupId;
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        const items = [];
        panel.querySelectorAll('.box').forEach(box => {
            const boxType = box.getAttribute('data-box');
            box.querySelectorAll('.item').forEach(itemDiv => {
                items.push({
                    name: itemDiv.textContent,
                    category: itemDiv.dataset.category,
                    container: boxType
                });
            });
        });

        group.items = items;
    });

    localStorage.setItem(`dragDropGroups-${email}`, JSON.stringify(groups));
}


// Load from localStorage
function loadState() {
    const email = getLoggedInUser();
    if (!email) return;

    const saved = localStorage.getItem(`dragDropGroups-${email}`);
    if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
            parsed.forEach(g => {
                groups.push(g);
            });
        }
    }
}


// On form submit - add new group and render it
document.getElementById('groupForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const title = e.target.groupTitle.value.trim();
    const cat1 = e.target.category1.value.trim();
    const cat2 = e.target.category2.value.trim();

    if (!title || !cat1 || !cat2) return;

    // Check exactly two categories and distinct
    if (cat1.toLowerCase() === cat2.toLowerCase()) {
        alert('Please enter two different categories.');
        return;
    }

    // Create unique ID
    const id = sanitizeKey(title) + '-' + Date.now();

    const group = {
        id,
        title,
        categories: [cat1, cat2],
        items: []
    };
    groups.push(group);

    renderGroup(group);

    // Reset form
    e.target.reset();

    // Expand newly added group and collapse others (with aria and icon fix)
    setTimeout(() => {
        collapseAllExcept(group.id);

        // Explicitly fix header aria and icon for new group
        document.querySelectorAll('.group-panel').forEach(panel => {
            const header = panel.querySelector('.group-header');
            const icon = header.querySelector('.toggle-icon');
            const content = panel.querySelector('.group-content');
            if (panel.dataset.groupId === group.id) {
                header.setAttribute('aria-expanded', 'true');
                icon.textContent = '−';
                content.classList.add('active');
            } else {
                header.setAttribute('aria-expanded', 'false');
                icon.textContent = '+';
                content.classList.remove('active');
            }
        });
    }, 100);

    saveState();
});

// On page load, load saved state and render all groups
window.addEventListener("DOMContentLoaded", () => {
    let email = getLoggedInUser();

    if (email) {
        showApp();
        loadState();
        groups.forEach(group => renderGroup(group));
    } else {
        // Show login/signup forms and hide app content & navbar user info
        authSection.style.display = "block";
        appContent.style.display = "none";
        welcomeUser.style.display = "none";
        logoutBtn.style.display = "none";
    }
});


