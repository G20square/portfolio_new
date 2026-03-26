// Run initialization immediately since script is deferred or at the bottom of the body
(async function initAdmin() {
    try {
        const res = await fetch('/api/check-auth');
        const data = await res.json();
        if (data.authenticated) showDashboard();
        else showLogin();
    } catch (err) { showLogin(); }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent standard GET submission
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorEl = document.getElementById('login-error');
            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                if (res.ok) { errorEl.style.display = 'none'; showDashboard(); }
                else { const errData = await res.json(); errorEl.textContent = errData.error || 'Login failed'; errorEl.style.display = 'block'; }
            } catch (err) { errorEl.textContent = 'Network error: ' + err.message; errorEl.style.display = 'block'; }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/logout', { method: 'POST' });
            window.location.reload();
        });
    }

    document.querySelectorAll('.admin-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.currentTarget;
            document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
            target.classList.add('active');
            document.getElementById(target.getAttribute('data-target')).classList.add('active');
        });
    });

    setupForm('add-project-form', '/api/projects', getProjectPayload, 'POST', fetchAdminData);
    setupForm('add-skill-form', '/api/skills', getSkillPayload, 'POST', fetchAdminData);
    setupForm('add-cert-form', '/api/certificates', getCertPayload, 'POST', fetchAdminData);

    // Edit Form submit handling
    const editForm = document.getElementById('edit-form');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const type = document.getElementById('edit-type').value;
            const id = document.getElementById('edit-id').value;
            let payload = {};

            if (type === 'projects') {
                payload = {
                    title: document.getElementById('edit-proj-title').value,
                    description: document.getElementById('edit-proj-desc').value,
                    demo_url: document.getElementById('edit-proj-demo').value,
                    repo_url: document.getElementById('edit-proj-repo').value,
                    image_url: document.getElementById('edit-proj-img').value || ''
                };
            } else if (type === 'skills') {
                payload = {
                    name: document.getElementById('edit-skill-name').value,
                    category: document.getElementById('edit-skill-category').value,
                    proficiency: document.getElementById('edit-skill-prof').value
                };
            } else if (type === 'certificates') {
                payload = {
                    title: document.getElementById('edit-cert-title').value,
                    issuer: document.getElementById('edit-cert-issuer').value,
                    date: document.getElementById('edit-cert-date').value,
                    url: document.getElementById('edit-cert-url').value
                };
            }

            try {
                const res = await fetch(`/api/${type}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    closeEditModal();
                    fetchAdminData();
                } else {
                    alert('Update failed');
                }
            } catch (err) {
                alert('Error updating item');
            }
        });
    }

    const closeModalBtn = document.getElementById('close-modal-btn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeEditModal);

})(); // Execute immediately

function showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('dashboard-screen').classList.add('hidden');
}
function showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
    fetchAdminData();
}

function setupForm(formId, endpoint, payloadExtractor, method = 'POST', callback) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = payloadExtractor();
        try {
            const res = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) { e.target.reset(); callback(); }
            else alert('Action failed');
        } catch (err) { alert('Error with item'); }
    });
}

function getProjectPayload() {
    return {
        title: document.getElementById('proj-title').value,
        description: document.getElementById('proj-desc').value,
        demo_url: document.getElementById('proj-demo').value,
        repo_url: document.getElementById('proj-repo').value,
        image_url: document.getElementById('proj-img').value || ''
    };
}
function getSkillPayload() {
    return {
        name: document.getElementById('skill-name').value,
        category: document.getElementById('skill-category').value,
        proficiency: document.getElementById('skill-prof').value || 80
    };
}
function getCertPayload() {
    return {
        title: document.getElementById('cert-title').value,
        issuer: document.getElementById('cert-issuer').value,
        date: document.getElementById('cert-date').value,
        url: document.getElementById('cert-url').value
    };
}

let cachedData = { projects: [], skills: [], certificates: [] };

async function fetchAdminData() {
    try {
        const pRes = await fetch('/api/projects');
        cachedData.projects = await pRes.json();
        renderAdminList('admin-projects-list', cachedData.projects, 'projects', 'title');
    } catch (e) { console.error(e) }

    try {
        const sRes = await fetch('/api/skills');
        cachedData.skills = await sRes.json();
        renderAdminList('admin-skills-list', cachedData.skills, 'skills', 'name');
    } catch (e) { console.error(e) }

    try {
        const cRes = await fetch('/api/certificates');
        cachedData.certificates = await cRes.json();
        renderAdminList('admin-certs-list', cachedData.certificates, 'certificates', 'title');
    } catch (e) { console.error(e) }
}

function renderAdminList(containerId, items, type, titleField = 'title') {
    const container = document.getElementById(containerId);
    const endpoint = `/api/${type}`;
    if (!container) return;
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<div style="padding: 20px; color: var(--text-secondary); text-align: center;">No items found.</div>';
        return;
    }

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'admin-list-item';
        div.innerHTML = `
            <div><strong>${item[titleField] || 'Unnamed'}</strong></div>
            <div>
                <button class="btn btn-outline btn-edit" data-type="${type}" data-id="${item.id}" style="padding: 5px 15px; margin-right: 10px;">Edit</button>
                <button class="btn btn-danger btn-delete" data-id="${item.id}" style="padding: 5px 15px;">Delete</button>
            </div>
        `;
        container.appendChild(div);
    });

    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this?')) {
                await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
                fetchAdminData();
            }
        });
    });

    container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const typeNode = e.target.getAttribute('data-type');
            openEditModal(typeNode, parseInt(id));
        });
    });
}

function openEditModal(type, id) {
    const item = cachedData[type].find(x => x.id === id);
    if (!item) return;

    document.getElementById('edit-id').value = id;
    document.getElementById('edit-type').value = type;

    const fieldsContainer = document.getElementById('edit-form-fields');
    let html = '';

    if (type === 'projects') {
        html = `
            <div class="form-group"><input type="text" id="edit-proj-title" class="form-control" value="${item.title || ''}" required></div>
            <div class="form-group"><textarea id="edit-proj-desc" class="form-control" rows="3" required>${item.description || ''}</textarea></div>
            <div class="form-group"><input type="text" id="edit-proj-demo" class="form-control" placeholder="Demo URL" value="${item.demo_url || ''}"></div>
            <div class="form-group"><input type="text" id="edit-proj-repo" class="form-control" placeholder="Repo URL" value="${item.repo_url || ''}"></div>
            <div class="form-group"><input type="text" id="edit-proj-img" class="form-control" placeholder="Image URL (Optional)" value="${item.image_url || ''}"></div>
        `;
    } else if (type === 'skills') {
        html = `
            <div class="form-group"><input type="text" id="edit-skill-name" class="form-control" value="${item.name || ''}" required></div>
            <div class="form-group"><input type="text" id="edit-skill-category" class="form-control" value="${item.category || ''}" required></div>
            <div class="form-group"><input type="number" id="edit-skill-prof" class="form-control" value="${item.proficiency || 80}" required></div>
        `;
    } else if (type === 'certificates') {
        html = `
            <div class="form-group"><input type="text" id="edit-cert-title" class="form-control" value="${item.title || ''}" required></div>
            <div class="form-group"><input type="text" id="edit-cert-issuer" class="form-control" value="${item.issuer || ''}" required></div>
            <div class="form-group"><input type="text" id="edit-cert-date" class="form-control" value="${item.date || ''}"></div>
            <div class="form-group"><input type="text" id="edit-cert-url" class="form-control" placeholder="URL" value="${item.url || ''}"></div>
        `;
    }

    fieldsContainer.innerHTML = html;
    document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}
