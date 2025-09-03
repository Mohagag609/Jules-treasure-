// Treasury System - Optimized Application JavaScript

// Cache for data
const dataCache = {
    safes: { data: null, timestamp: 0 },
    customers: { data: null, timestamp: 0 },
    suppliers: { data: null, timestamp: 0 },
    vouchers: { data: null, timestamp: 0 }
};

const CACHE_DURATION = 30000; // 30 seconds

// Global Variables
let currentPage = 'dashboard';
let editingId = null;
let isLoading = false;

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadDashboard();
});

// Setup Event Listeners
function setupEventListeners() {
    // Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    // Menu Links
    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            navigateToPage(page);
        });
    });
}

// Initialize App
function initializeApp() {
    updateActiveMenu('dashboard');
}

// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainWrapper = document.getElementById('mainWrapper');
    
    sidebar.classList.toggle('collapsed');
    mainWrapper.classList.toggle('expanded');
}

// Navigate to Page
function navigateToPage(page) {
    if (isLoading) return;
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show selected page
    const pageElement = document.getElementById(`${page}-page`);
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    updateActiveMenu(page);
    updatePageTitle(page);
    loadPageData(page);
    currentPage = page;
}

// Update Active Menu
function updateActiveMenu(page) {
    document.querySelectorAll('.menu-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
}

// Update Page Title
function updatePageTitle(page) {
    const titles = {
        'dashboard': 'لوحة التحكم',
        'safes': 'الخزائن المتدرجة',
        'customers': 'العملاء',
        'suppliers': 'الموردين',
        'vouchers': 'السندات',
        'reports': 'التقارير',
        'settings': 'الإعدادات'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titles[page] || 'نظام الخزينة';
    }
}

// Load Page Data with caching
async function loadPageData(page) {
    if (isLoading) return;
    
    switch(page) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'safes':
            await loadSafes();
            break;
        case 'customers':
            await loadCustomers();
            break;
        case 'suppliers':
            await loadSuppliers();
            break;
        case 'vouchers':
            await loadVouchers();
            break;
    }
}

// Check cache validity
function isCacheValid(cacheKey) {
    const cache = dataCache[cacheKey];
    return cache.data && (Date.now() - cache.timestamp < CACHE_DURATION);
}

// Update cache
function updateCache(cacheKey, data) {
    dataCache[cacheKey] = {
        data: data,
        timestamp: Date.now()
    };
}

// Load Dashboard
async function loadDashboard() {
    try {
        showLoading();
        
        const promises = [];
        
        // Load from cache or fetch
        if (!isCacheValid('safes')) {
            promises.push(fetch('/api/safes/tree').then(r => r.json()).then(data => {
                updateCache('safes', data);
                return data;
            }));
        }
        
        if (!isCacheValid('customers')) {
            promises.push(fetch('/api/customers/tree').then(r => r.json()).then(data => {
                updateCache('customers', data);
                return data;
            }));
        }
        
        if (!isCacheValid('suppliers')) {
            promises.push(fetch('/api/suppliers/tree').then(r => r.json()).then(data => {
                updateCache('suppliers', data);
                return data;
            }));
        }
        
        // Always fetch fresh vouchers
        promises.push(fetch('/api/vouchers?limit=5').then(r => r.json()));
        
        if (promises.length > 0) {
            await Promise.all(promises);
        }
        
        // Update stats from cache
        const safes = dataCache.safes.data || [];
        const customers = dataCache.customers.data || [];
        const suppliers = dataCache.suppliers.data || [];
        
        document.getElementById('totalBalance').textContent = formatNumber(calculateTotal(safes));
        document.getElementById('totalCustomers').textContent = countItems(customers);
        document.getElementById('totalSuppliers').textContent = countItems(suppliers);
        
        // Load recent transactions
        const vouchersRes = await fetch('/api/vouchers?limit=5');
        const vouchers = await vouchersRes.json();
        renderRecentTransactions(vouchers);
        document.getElementById('totalVouchers').textContent = vouchers.length;
        
        drawBalanceChart();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showAlert('خطأ في تحميل البيانات', 'danger');
    } finally {
        hideLoading();
    }
}

// Load Safes
async function loadSafes() {
    if (isCacheValid('safes')) {
        renderSafesTree();
        return;
    }
    
    try {
        showLoading();
        const response = await fetch('/api/safes/tree');
        const data = await response.json();
        updateCache('safes', data);
        renderSafesTree();
    } catch (error) {
        console.error('Error loading safes:', error);
        showAlert('خطأ في تحميل الخزائن', 'danger');
    } finally {
        hideLoading();
    }
}

// Load Customers
async function loadCustomers() {
    if (isCacheValid('customers')) {
        renderCustomersTree();
        return;
    }
    
    try {
        showLoading();
        const response = await fetch('/api/customers/tree');
        const data = await response.json();
        updateCache('customers', data);
        renderCustomersTree();
    } catch (error) {
        console.error('Error loading customers:', error);
        showAlert('خطأ في تحميل العملاء', 'danger');
    } finally {
        hideLoading();
    }
}

// Load Suppliers
async function loadSuppliers() {
    if (isCacheValid('suppliers')) {
        renderSuppliersTree();
        return;
    }
    
    try {
        showLoading();
        const response = await fetch('/api/suppliers/tree');
        const data = await response.json();
        updateCache('suppliers', data);
        renderSuppliersTree();
    } catch (error) {
        console.error('Error loading suppliers:', error);
        showAlert('خطأ في تحميل الموردين', 'danger');
    } finally {
        hideLoading();
    }
}

// Load Vouchers
async function loadVouchers(forceRefresh = false) {
    if (!forceRefresh && isCacheValid('vouchers')) {
        renderVouchersTable();
        return;
    }
    
    try {
        showLoading();
        const response = await fetch('/api/vouchers?limit=50');
        const data = await response.json();
        updateCache('vouchers', data);
        renderVouchersTable();
    } catch (error) {
        console.error('Error loading vouchers:', error);
        showAlert('خطأ في تحميل السندات', 'danger');
    } finally {
        hideLoading();
    }
}

// Render functions
function renderRecentTransactions(vouchers) {
    const tbody = document.getElementById('recentTransactions');
    if (!tbody) return;
    
    tbody.innerHTML = vouchers.length === 0 ? 
        '<tr><td colspan="5" class="text-center">لا توجد معاملات</td></tr>' :
        vouchers.map(v => `
            <tr>
                <td>${v.voucher_number}</td>
                <td><span class="badge bg-${v.voucher_type === 'receipt' ? 'success' : 'danger'}">
                    ${v.voucher_type === 'receipt' ? 'قبض' : 'صرف'}
                </span></td>
                <td>${formatMoney(v.amount)}</td>
                <td>${new Date(v.date).toLocaleDateString('ar-EG')}</td>
                <td><span class="badge bg-success">مكتمل</span></td>
            </tr>
        `).join('');
}

function renderSafesTree() {
    const container = document.getElementById('safesTree');
    if (!container) return;
    
    const safes = dataCache.safes.data || [];
    container.innerHTML = safes.length === 0 ?
        '<div class="alert alert-info">لا توجد خزائن</div>' :
        safes.map(safe => createSafeTreeHTML(safe)).join('');
}

function createSafeTreeHTML(safe, level = 0) {
    const childrenHTML = safe.children ? 
        safe.children.map(child => createSafeTreeHTML(child, level + 1)).join('') : '';
    
    return `
        <div class="tree-item ${safe.is_container ? 'parent' : ''}" style="margin-right: ${level * 30}px">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <i class="fas fa-vault me-2 text-primary"></i>
                    <strong>${safe.name}</strong>
                    ${safe.is_container ? '<span class="badge bg-warning ms-2">حاوية</span>' : ''}
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-${safe.balance >= 0 ? 'success' : 'danger'}">
                        ${formatMoney(safe.balance || 0)}
                    </span>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-info" onclick="viewSafe(${safe.id})" title="عرض">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-warning" onclick="editSafe(${safe.id})" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" onclick="deleteSafe(${safe.id})" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn btn-secondary" onclick="printSafe(${safe.id})" title="طباعة">
                            <i class="fas fa-print"></i>
                        </button>
                    </div>
                </div>
            </div>
            ${childrenHTML ? `<div class="tree-children">${childrenHTML}</div>` : ''}
        </div>
    `;
}

function renderCustomersTree() {
    const container = document.getElementById('customersTree');
    if (!container) return;
    
    const customers = dataCache.customers.data || [];
    container.innerHTML = customers.length === 0 ?
        '<div class="alert alert-info">لا يوجد عملاء</div>' :
        customers.map(customer => createCustomerTreeHTML(customer)).join('');
}

function createCustomerTreeHTML(customer, level = 0) {
    const branchesHTML = customer.branches ? 
        customer.branches.map(branch => createCustomerTreeHTML(branch, level + 1)).join('') : '';
    
    return `
        <div class="tree-item ${customer.is_group ? 'parent' : ''}" style="margin-right: ${level * 30}px">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <i class="fas fa-user me-2 text-success"></i>
                    <strong>${customer.name}</strong>
                    ${customer.is_group ? '<span class="badge bg-info ms-2">مجموعة</span>' : ''}
                    ${customer.phone ? `<small class="text-muted ms-2">${customer.phone}</small>` : ''}
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-${customer.balance >= 0 ? 'success' : 'danger'}">
                        ${formatMoney(customer.balance || 0)}
                    </span>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-info" onclick="viewCustomer(${customer.id})" title="عرض">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-warning" onclick="editCustomer(${customer.id})" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" onclick="deleteCustomer(${customer.id})" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn btn-secondary" onclick="printCustomer(${customer.id})" title="طباعة">
                            <i class="fas fa-print"></i>
                        </button>
                    </div>
                </div>
            </div>
            ${branchesHTML ? `<div class="tree-children">${branchesHTML}</div>` : ''}
        </div>
    `;
}

function renderSuppliersTree() {
    const container = document.getElementById('suppliersTree');
    if (!container) return;
    
    const suppliers = dataCache.suppliers.data || [];
    container.innerHTML = suppliers.length === 0 ?
        '<div class="alert alert-info">لا يوجد موردين</div>' :
        suppliers.map(supplier => createSupplierTreeHTML(supplier)).join('');
}

function createSupplierTreeHTML(supplier, level = 0) {
    const branchesHTML = supplier.branches ? 
        supplier.branches.map(branch => createSupplierTreeHTML(branch, level + 1)).join('') : '';
    
    return `
        <div class="tree-item ${supplier.is_group ? 'parent' : ''}" style="margin-right: ${level * 30}px">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <i class="fas fa-truck me-2 text-warning"></i>
                    <strong>${supplier.name}</strong>
                    ${supplier.is_group ? '<span class="badge bg-warning ms-2">مجموعة</span>' : ''}
                    ${supplier.phone ? `<small class="text-muted ms-2">${supplier.phone}</small>` : ''}
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-${supplier.balance <= 0 ? 'success' : 'danger'}">
                        ${formatMoney(Math.abs(supplier.balance || 0))}
                    </span>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-info" onclick="viewSupplier(${supplier.id})" title="عرض">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-warning" onclick="editSupplier(${supplier.id})" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" onclick="deleteSupplier(${supplier.id})" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn btn-secondary" onclick="printSupplier(${supplier.id})" title="طباعة">
                            <i class="fas fa-print"></i>
                        </button>
                    </div>
                </div>
            </div>
            ${branchesHTML ? `<div class="tree-children">${branchesHTML}</div>` : ''}
        </div>
    `;
}

function renderVouchersTable() {
    const tbody = document.getElementById('vouchersTable');
    if (!tbody) return;
    
    const vouchers = dataCache.vouchers.data || [];
    tbody.innerHTML = vouchers.length === 0 ?
        '<tr><td colspan="7" class="text-center">لا توجد سندات</td></tr>' :
        vouchers.map(voucher => `
            <tr>
                <td>${voucher.voucher_number}</td>
                <td><span class="badge bg-${getVoucherTypeColor(voucher.voucher_type)}">
                    ${getVoucherTypeText(voucher.voucher_type)}
                </span></td>
                <td>${formatMoney(voucher.amount)}</td>
                <td>${new Date(voucher.date).toLocaleDateString('ar-EG')}</td>
                <td>${voucher.description || '-'}</td>
                <td>${getVoucherEntity(voucher)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-info" onclick="viewVoucher(${voucher.id})" title="عرض">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-warning" onclick="editVoucher(${voucher.id})" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" onclick="deleteVoucher(${voucher.id})" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn btn-secondary" onclick="printVoucher(${voucher.id})" title="طباعة">
                            <i class="fas fa-print"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
}

// CRUD Operations
async function viewSafe(id) {
    try {
        const response = await fetch(`/api/safes/${id}`);
        const safe = await response.json();
        
        showModal('تفاصيل الخزينة', `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>الاسم:</strong> ${safe.name}</p>
                    <p><strong>النوع:</strong> ${safe.is_container ? 'حاوية' : 'عادية'}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>الرصيد:</strong> ${formatMoney(safe.balance)}</p>
                    <p><strong>المستوى:</strong> ${safe.level}</p>
                </div>
            </div>
        `);
    } catch (error) {
        showAlert('خطأ في تحميل البيانات', 'danger');
    }
}

async function editSafe(id) {
    try {
        const response = await fetch(`/api/safes/${id}`);
        const safe = await response.json();
        
        editingId = id;
        document.getElementById('safeModalTitle').textContent = 'تعديل خزينة';
        document.getElementById('safeName').value = safe.name;
        document.getElementById('parentSafe').value = safe.parent_safe_id || '';
        document.getElementById('isContainer').checked = safe.is_container;
        
        await loadParentSafes();
        const modal = new bootstrap.Modal(document.getElementById('safeModal'));
        modal.show();
    } catch (error) {
        showAlert('خطأ في تحميل البيانات', 'danger');
    }
}

async function deleteSafe(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الخزينة؟')) return;
    
    try {
        const response = await fetch(`/api/safes/${id}`, { method: 'DELETE' });
        const result = await response.json();
        
        if (response.ok) {
            showAlert('تم حذف الخزينة بنجاح', 'success');
            dataCache.safes.timestamp = 0; // Invalidate cache
            await loadSafes();
        } else {
            showAlert(result.error || 'خطأ في حذف الخزينة', 'danger');
        }
    } catch (error) {
        showAlert('خطأ في الاتصال', 'danger');
    }
}

async function viewCustomer(id) {
    try {
        const response = await fetch(`/api/customers/${id}`);
        const customer = await response.json();
        
        showModal('تفاصيل العميل', `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>الاسم:</strong> ${customer.name}</p>
                    <p><strong>الهاتف:</strong> ${customer.phone || '-'}</p>
                    <p><strong>العنوان:</strong> ${customer.address || '-'}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>الرصيد:</strong> ${formatMoney(customer.balance)}</p>
                    <p><strong>النوع:</strong> ${customer.is_group ? 'مجموعة' : 'فردي'}</p>
                </div>
            </div>
        `);
    } catch (error) {
        showAlert('خطأ في تحميل البيانات', 'danger');
    }
}

async function editCustomer(id) {
    try {
        const response = await fetch(`/api/customers/${id}`);
        const customer = await response.json();
        
        editingId = id;
        document.getElementById('customerModalTitle').textContent = 'تعديل عميل';
        document.getElementById('customerName').value = customer.name;
        document.getElementById('customerPhone').value = customer.phone || '';
        document.getElementById('customerAddress').value = customer.address || '';
        document.getElementById('parentCustomer').value = customer.parent_customer_id || '';
        document.getElementById('isCustomerGroup').checked = customer.is_group;
        
        await loadParentCustomers();
        const modal = new bootstrap.Modal(document.getElementById('customerModal'));
        modal.show();
    } catch (error) {
        showAlert('خطأ في تحميل البيانات', 'danger');
    }
}

async function deleteCustomer(id) {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return;
    
    try {
        const response = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
        const result = await response.json();
        
        if (response.ok) {
            showAlert('تم حذف العميل بنجاح', 'success');
            dataCache.customers.timestamp = 0;
            await loadCustomers();
        } else {
            showAlert(result.error || 'خطأ في حذف العميل', 'danger');
        }
    } catch (error) {
        showAlert('خطأ في الاتصال', 'danger');
    }
}

async function deleteSupplier(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المورد؟')) return;
    
    try {
        const response = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
        const result = await response.json();
        
        if (response.ok) {
            showAlert('تم حذف المورد بنجاح', 'success');
            dataCache.suppliers.timestamp = 0;
            await loadSuppliers();
        } else {
            showAlert(result.error || 'خطأ في حذف المورد', 'danger');
        }
    } catch (error) {
        showAlert('خطأ في الاتصال', 'danger');
    }
}

async function deleteVoucher(id) {
    if (!confirm('هل أنت متأكد من حذف هذا السند؟')) return;
    
    try {
        const response = await fetch(`/api/vouchers/${id}`, { method: 'DELETE' });
        const result = await response.json();
        
        if (response.ok) {
            showAlert('تم حذف السند بنجاح', 'success');
            dataCache.vouchers.timestamp = 0;
            await loadVouchers(true);
        } else {
            showAlert(result.error || 'خطأ في حذف السند', 'danger');
        }
    } catch (error) {
        showAlert('خطأ في الاتصال', 'danger');
    }
}

// Helper functions
function showModal(title, content) {
    const modalHtml = `
        <div class="modal fade" id="infoModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('infoModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('infoModal'));
    modal.show();
    
    document.getElementById('infoModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alert.style.zIndex = '9999';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alert);
    
    setTimeout(() => alert.remove(), 5000);
}

function showLoading() {
    isLoading = true;
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('show');
}

function hideLoading() {
    isLoading = false;
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('show');
}

function formatMoney(amount) {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP'
    }).format(amount || 0);
}

function formatNumber(num) {
    return new Intl.NumberFormat('ar-EG').format(num || 0);
}

function countItems(items) {
    let count = 0;
    function countRecursive(arr) {
        arr.forEach(item => {
            count++;
            const children = item.children || item.branches;
            if (children) countRecursive(children);
        });
    }
    countRecursive(items);
    return count;
}

function calculateTotal(items) {
    let total = 0;
    items.forEach(item => {
        total += Math.abs(item.balance || 0);
    });
    return total;
}

function getVoucherTypeColor(type) {
    const colors = {
        'receipt': 'success',
        'payment': 'danger',
        'transfer': 'info'
    };
    return colors[type] || 'secondary';
}

function getVoucherTypeText(type) {
    const texts = {
        'receipt': 'قبض',
        'payment': 'صرف',
        'transfer': 'تحويل'
    };
    return texts[type] || type;
}

function getVoucherEntity(voucher) {
    if (voucher.customer) return `عميل: ${voucher.customer.name}`;
    if (voucher.supplier) return `مورد: ${voucher.supplier.name}`;
    return '-';
}

function drawBalanceChart() {
    const ctx = document.getElementById('balanceChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['الخزائن', 'العملاء', 'الموردين'],
            datasets: [{
                data: [45, 30, 25],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Export functions
window.viewSafe = viewSafe;
window.editSafe = editSafe;
window.deleteSafe = deleteSafe;
window.viewCustomer = viewCustomer;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;
window.viewSupplier = viewSupplier;
window.editSupplier = editSupplier;
window.deleteSupplier = deleteSupplier;
window.viewVoucher = viewVoucher;
window.editVoucher = editVoucher;
window.deleteVoucher = deleteVoucher;