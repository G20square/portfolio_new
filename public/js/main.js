document.addEventListener('DOMContentLoaded', async () => {
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        });
    }



    // Fetch and render data
    fetchProjects();
    fetchSkills();
    fetchCertificates();
});

async function fetchProjects() {
    try {
        const res = await fetch('/api/projects');
        const projects = await res.json();
        const container = document.getElementById('projects-container');
        if (!container) return;

        container.innerHTML = '';
        if (projects.length === 0) {
            container.innerHTML = '<p class="loader">No projects found.</p>';
            return;
        }

        projects.forEach(p => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <div class="project-content">
                    <h3 class="project-title">${p.title}</h3>
                    <p class="project-desc">${p.description}</p>
                    <div class="project-actions">
                        ${p.demo_url ? `<a href="${p.demo_url}" target="_blank" class="btn btn-primary">Demo</a>` : ''}
                        ${p.repo_url ? `<a href="${p.repo_url}" target="_blank" class="btn btn-outline">Code</a>` : ''}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error('Failed to fetch projects', err);
    }
}

async function fetchSkills() {
    try {
        const res = await fetch('/api/skills');
        const skills = await res.json();
        const container = document.getElementById('skills-container');
        if (!container) return;

        container.innerHTML = '';
        if (skills.length === 0) {
            container.innerHTML = '<p class="loader">No skills found.</p>';
            return;
        }

        skills.forEach(s => {
            const card = document.createElement('div');
            card.className = 'skill-card';
            card.innerHTML = `
                <h3 title="${s.category}">${s.name}</h3>
                <span style="font-size:0.8rem; color:var(--sage); border-left: 2px solid var(--olive); padding-left: 10px;">${s.proficiency}%</span>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error('Failed to fetch skills', err);
    }
}

async function fetchCertificates() {
    try {
        const res = await fetch('/api/certificates');
        const certs = await res.json();
        const container = document.getElementById('certificates-container');
        if (!container) return;

        container.innerHTML = '';
        if (certs.length === 0) {
            container.innerHTML = '<p class="loader">No certificates found.</p>';
            return;
        }

        certs.forEach(c => {
            const card = document.createElement('div');
            card.className = 'cert-card';
            card.innerHTML = `
                <h3 style="font-size: 1.5rem; margin-bottom:10px;">${c.title}</h3>
                <p style="margin-bottom: 20px; font-weight: bold; color: var(--sage);">${c.issuer} &bull; ${c.date}</p>
                ${c.url ? `<a href="${c.url}" target="_blank" style="color: var(--forest-green); text-decoration:underline; font-weight:bold;">View Credential</a>` : ''}
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error('Failed to fetch certificates', err);
    }
}
