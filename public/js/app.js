// AirCond CRUD Frontend Logic

class AirCondApp {
    constructor() {
        this.baseUrl = '/api';
        this.token = localStorage.getItem('token');
        this.init();
    }

    init() {
        this.checkAuth();
        this.loadDashboardStats();
        this.loadRecentServices();
        this.bindEvents();
    }

    checkAuth() {
        if (!this.token) {
            window.location.href = '/login';
        }
    }

    async loadDashboardStats() {
        try {
            const res = await fetch(`${this.baseUrl}/stats`);
            const stats = await res.json();
            this.updateStatsUI(stats);
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    }

    updateStatsUI(stats) {
        document.getElementById('stat-customers').textContent = stats.customers || 0;
        document.getElementById('stat-pending').textContent = stats.pending || 0;
        document.getElementById('stat-revenue').textContent = stats.revenue ? 'RM ' + stats.revenue.toFixed(2) : 'RM 0.00';
        document.getElementById('stat-lowstock').textContent = stats.low_stock || 0;
    }

    async loadRecentServices(limit = 5) {
        try {
            const res = await fetch(`${this.baseUrl}/services?limit=${limit}`);
            const services = await res.json();
            this.renderRecentServices(services);
        } catch (err) {
            console.error('Failed to load services:', err);
        }
    }

    renderRecentServices(services) {
        const tbody = document.getElementById('recentServices');
        if (!tbody) return;

        if (services.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-400">No recent services found.</td></tr>';
            return;
        }

        tbody.innerHTML = services.map(s => `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3 font-medium text-gray-900">${s.customer_name || 'N/A'}</td>
                <td class="px-4 py-3">${s.service_type}</td>
                <td class="px-4 py-3">${new Date(s.scheduled_date).toLocaleDateString()}</td>
                <td class="px-4 py-3">
                    <span class="px-3 py-1 rounded-full text-xs ${this.statusColor(s.status)}">
                        ${s.status}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <button onclick="app.editService(${s.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="app.deleteService(${s.id})" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    statusColor(status) {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            in_progress: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }

    async editService(id) {
        // In a real app, this would open a modal with form to edit service
        alert(`Edit service #${id} - to be implemented.`);
    }

    async deleteService(id) {
        if (confirm('Are you sure you want to delete this service?')) {
            try {
                const res = await fetch(`${this.baseUrl}/services/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    this.loadRecentServices();
                } else {
                    alert('Failed to delete service.');
                }
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    bindEvents() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    async logout() {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AirCondApp();
});

// Utility functions
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency: 'MYR'
    }).format(amount);
}

// Expose for inline use
window.AirCondApp = AirCondApp;