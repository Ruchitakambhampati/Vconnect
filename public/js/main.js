// VendorConnect Frontend JavaScript


// Global utilities
const VendorConnect = {
  // Show loading state
  showLoading: (element) => {
    if (element) {
      element.disabled = true;
      const originalText = element.textContent;
      element.dataset.originalText = originalText;
      element.innerHTML = '<span class="loading"></span> Loading...';
    }
  },

  // Hide loading state
  hideLoading: (element) => {
    if (element && element.dataset.originalText) {
      element.disabled = false;
      element.textContent = element.dataset.originalText;
    }
  },

  // Show alert message
  showAlert: (message, type = 'info') => {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    alertContainer.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 5000);
  },

  // Make API request
  apiRequest: async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },

  // Format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  },

  // Format date
  formatDate: (date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }
};

// Contract Management
const ContractManager = {
  // Accept contract
  acceptContract: async (contractId, button) => {
    try {
      VendorConnect.showLoading(button);
      
      const response = await VendorConnect.apiRequest(`/vendor/contract/${contractId}/accept`, {
        method: 'POST'
      });

      if (response.success) {
        VendorConnect.showAlert(response.message, 'success');
        
        // Update UI
        const contractCard = button.closest('.contract-card');
        if (contractCard) {
          contractCard.classList.add('accepted');
          button.textContent = 'Accepted';
          button.classList.remove('btn-primary');
          button.classList.add('btn-success');
          button.disabled = true;
        }
      }
    } catch (error) {
      VendorConnect.showAlert('Failed to accept contract. Please try again.', 'danger');
    } finally {
      VendorConnect.hideLoading(button);
    }
  },

  // Create contract (for wholesalers)
  createContract: async (formData, button) => {
    try {
      VendorConnect.showLoading(button);
      
      const response = await VendorConnect.apiRequest('/wholesaler/contract', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.success) {
        VendorConnect.showAlert(response.message, 'success');
        
        // Reset form and close modal
        const form = button.closest('form');
        if (form) form.reset();
        const modalElement = button.closest('.modal');
if (modalElement) {
  const modal = bootstrap.Modal.getInstance(modalElement);
  if (modal) {
    modal.hide();
  } else {
    // If no instance exists, create one safely
    const newModal = new bootstrap.Modal(modalElement);
    newModal.hide();
  }
} else {
  console.warn('Modal element not found for button:', button);
}

       
        // Reload page to show new contract
        setTimeout(() => location.reload(), 1000);
      }
    } catch (error) {
      VendorConnect.showAlert('Failed to create contract. Please try again.', 'danger');
    } finally {
      VendorConnect.hideLoading(button);
    }
  },

  // Deactivate contract
  deactivateContract: async (contractId, button) => {
    if (!confirm('Are you sure you want to deactivate this contract?')) {
      return;
    }

    try {
      VendorConnect.showLoading(button);
      
      const response = await VendorConnect.apiRequest(`/wholesaler/contract/${contractId}/deactivate`, {
        method: 'POST'
      });

      if (response.success) {
        VendorConnect.showAlert(response.message, 'success');
        
        // Update UI
        const contractCard = button.closest('.contract-card');
        if (contractCard) {
          contractCard.style.opacity = '0.5';
          button.textContent = 'Deactivated';
          button.disabled = true;
        }
      }
    } catch (error) {
      VendorConnect.showAlert('Failed to deactivate contract. Please try again.', 'danger');
    } finally {
      VendorConnect.hideLoading(button);
    }
  }
};

// Order Management
const OrderManager = {
  // Place order
  placeOrder: async (contractId, quantity, button) => {
    try {
      VendorConnect.showLoading(button);
      
      const response = await VendorConnect.apiRequest('/vendor/order', {
        method: 'POST',
        body: JSON.stringify({ contractId, quantity })
      });

      if (response.success) {
        VendorConnect.showAlert(response.message, 'success');
        
        // Close modal and refresh orders
        const modal = bootstrap.Modal.getInstance(button.closest('.modal'));
        if (modal) modal.hide();
        
        setTimeout(() => location.reload(), 1000);
      }
    } catch (error) {
      const errorMessage = error.message.includes('400:') 
        ? error.message.split('400: ')[1] 
        : 'Failed to place order. Please try again.';
      VendorConnect.showAlert(errorMessage, 'danger');
   
    } finally {
      VendorConnect.hideLoading(button);
    }
  },

  // Cancel order
  cancelOrder: async (orderId, button) => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      VendorConnect.showLoading(button);
      
      const response = await VendorConnect.apiRequest(`/vendor/order/${orderId}/cancel`, {
        method: 'POST'
      });

      if (response.success) {
        VendorConnect.showAlert(response.message, 'success');
        
        // Update UI
        const orderRow = button.closest('tr');
        if (orderRow) {
          const statusCell = orderRow.querySelector('.status-badge');
          if (statusCell) {
            statusCell.textContent = 'Cancelled';
            statusCell.className = 'status-badge status-cancelled';
          }
          button.style.display = 'none';
        }
      }
    } catch (error) {
      const errorMessage = error.message.includes('400:') 
        ? error.message.split('400: ')[1] 
        : 'Failed to cancel order. Please try again.';
      VendorConnect.showAlert(errorMessage, 'danger');
    } finally {
      VendorConnect.hideLoading(button);
    }
  },

  // Mark order as delivered (for wholesalers)
  markDelivered: async (orderId, button) => {
    try {
      VendorConnect.showLoading(button);
      
      const response = await VendorConnect.apiRequest(`/wholesaler/order/${orderId}/delivered`, {
        method: 'POST'
      });

      if (response.success) {
        VendorConnect.showAlert(response.message, 'success');
        
        // Update UI
        const orderRow = button.closest('tr');
        if (orderRow) {
          const statusCell = orderRow.querySelector('.status-badge');
          if (statusCell) {
            statusCell.textContent = 'Delivered';
            statusCell.className = 'status-badge status-completed';
          }
          button.textContent = 'Delivered';
          button.disabled = true;
          button.classList.remove('btn-success');
          button.classList.add('btn-secondary');
        }
      }
    } catch (error) {
      VendorConnect.showAlert('Failed to mark as delivered. Please try again.', 'danger');
    } finally {
      VendorConnect.hideLoading(button);
    }
  }
};

// Search functionality
const SearchManager = {
  // Search contracts
  searchContracts: async (query, location = '') => {
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (location) params.append('location', location);
      
      const response = await VendorConnect.apiRequest(`/api/contracts/search?${params}`);
      return response;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  },

  // Debounced search
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// Stats updater
const StatsManager = {
  // Update vendor stats
  updateVendorStats: async () => {
    try {
      const response = await VendorConnect.apiRequest('/api/vendor/stats');
      
      // Update stats cards
      const elements = {
        totalOrders: document.getElementById('total-orders'),
        activeOrders: document.getElementById('active-orders'),
        freeAttempts: document.getElementById('free-attempts'),
        cancellations: document.getElementById('cancellations')
      };

      if (elements.totalOrders) elements.totalOrders.textContent = response.totalOrders;
      if (elements.activeOrders) elements.activeOrders.textContent = response.activeOrders.length;
      if (elements.freeAttempts) elements.freeAttempts.textContent = response.freeAttemptsRemaining;
      if (elements.cancellations) elements.cancellations.textContent = response.cancellationsRemaining;
      
    } catch (error) {
      console.error('Failed to update vendor stats:', error);
    }
  },

  // Update wholesaler stats
  updateWholesalerStats: async () => {
    try {
      const response = await VendorConnect.apiRequest('/api/wholesaler/stats');
      
      // Update stats cards
      const elements = {
        activeContracts: document.getElementById('active-contracts'),
        todayDeliveries: document.getElementById('today-deliveries'),
        todayEarnings: document.getElementById('today-earnings'),
        totalEarnings: document.getElementById('total-earnings')
      };

      if (elements.activeContracts) elements.activeContracts.textContent = response.activeContracts.length;
      if (elements.todayDeliveries) elements.todayDeliveries.textContent = response.todayDeliveries.length;
      if (elements.todayEarnings) elements.todayEarnings.textContent = VendorConnect.formatCurrency(response.todayEarnings);
      if (elements.totalEarnings) elements.totalEarnings.textContent = VendorConnect.formatCurrency(response.totalEarnings);
      
    } catch (error) {
      console.error('Failed to update wholesaler stats:', error);
    }
  }
};

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Initialize search functionality
  const searchInput = document.getElementById('contract-search');
  if (searchInput) {
    const debouncedSearch = SearchManager.debounce(async (query) => {
      const results = await SearchManager.searchContracts(query);
      // Update search results UI here
      console.log('Search results:', results);
    }, 300);

    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });
  }

  // Auto-update stats every 30 seconds
  const currentPath = window.location.pathname;
  if (currentPath.includes('/vendor/dashboard')) {
    StatsManager.updateVendorStats();
    setInterval(StatsManager.updateVendorStats, 30000);
  } else if (currentPath.includes('/wholesaler/dashboard')) {
    StatsManager.updateWholesalerStats();
    setInterval(StatsManager.updateWholesalerStats, 30000);
  }

  // Form validation
  const forms = document.querySelectorAll('.needs-validation');
  forms.forEach(form => {
    form.addEventListener('submit', function(event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    });
  });

  // Add fade-in animation to cards
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('fade-in');
    }, index * 100);
  });
});

// Export for global use
window.VendorConnect = VendorConnect;
window.ContractManager = ContractManager;
window.OrderManager = OrderManager;
window.SearchManager = SearchManager;
window.StatsManager = StatsManager;
