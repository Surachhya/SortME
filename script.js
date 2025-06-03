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
function renderGroup(group) {
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
    // For each group, save items with their current container
    document.querySelectorAll('.group-panel').forEach(panel => {
        const groupId = panel.dataset.groupId;
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        // Gather items from boxes
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

    localStorage.setItem('dragDropGroups', JSON.stringify(groups));
}

// Load from localStorage
function loadState() {
    const saved = localStorage.getItem('dragDropGroups');
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
window.addEventListener('load', () => {
    loadState();
    groups.forEach(g => renderGroup(g));
});