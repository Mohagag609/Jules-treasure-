// Treasury System - Modern Application JavaScript

// Global Variables
let currentPage = 'dashboard';
let safesData = [];
let customersData = [];
let suppliersData = [];
let vouchersData = [];
let editingId = null;

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
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show selected page
    const pageElement = document.getElementById(`${page}-page`);
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    // Update active menu
    updateActiveMenu(page);
    
    // Update page title
    updatePageTitle(page);
    
    // Load page data
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

// Load Page Data
function loadPageData(page) {
    showLoading();
    
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'safes':
            loadSafes();
            break;
        case 'customers':
            loadCustomers();
            break;
        case 'suppliers':
            loadSuppliers();
            break;
        case 'vouchers':
            loadVouchers();
            break;
    }
    
    setTimeout(hideLoading, 500);
}

// ==================== Dashboard Functions ====================
async function loadDashboard() {
    try {
        const [safesRes, customersRes, suppliersRes, vouchersRes] = await Promise.all([
            fetch('/api/safes/tree'),
            fetch('/api/customers/tree'),
            fetch('/api/suppliers/tree'),
            fetch('/api/vouchers?limit=5')
        ]);
        
        const safes = await safesRes.json();
        const customers = await customersRes.json();
        const suppliers = await suppliersRes.json();
        const vouchers = await vouchersRes.json();
        
        // Update stats
        document.getElementById('totalBalance').textContent = formatNumber(calculateTotal(safes));
        document.getElementById('totalCustomers').textContent = countItems(customers);
        document.getElementById('totalSuppliers').textContent = countItems(suppliers);
        document.getElementById('totalVouchers').textContent = vouchers.length;
        
        // Load recent transactions
        renderRecentTransactions(vouchers);
        
        // Draw chart
        drawBalanceChart();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showAlert('خطأ في تحميل البيانات', 'danger');
    }
}

function renderRecentTransactions(vouchers) {
    const tbody = document.getElementById('recentTransactions');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (vouchers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">لا توجد معاملات</td></tr>';
        return;
    }
    
    vouchers.forEach(v => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${v.voucher_number}</td>
            <td>
                <span class="badge bg-${v.voucher_type === 'receipt' ? 'success' : 'danger'}">
                    ${v.voucher_type === 'receipt' ? 'قبض' : 'صرف'}
                </span>
            </td>
            <td>${formatMoney(v.amount)}</td>
            <td>${new Date(v.date).toLocaleDateString('ar-EG')}</td>
            <td><span class="badge bg-success">مكتمل</span></td>
        `;
        tbody.appendChild(row);
    });
}

// ==================== Safes Functions ====================
async function loadSafes() {
    try {
        const response = await fetch('/api/safes/tree');
        safesData = await response.json();
        renderSafesTree();
    } catch (error) {
        console.error('Error loading safes:', error);
        showAlert('خطأ في تحميل الخزائن', 'danger');
    }
}

function renderSafesTree() {
    const container = document.getElementById('safesTree');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (safesData.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لا توجد خزائن</div>';
        return;
    }
    
    safesData.forEach(safe => {
        container.appendChild(createSafeTreeItem(safe));
    });
}

function createSafeTreeItem(safe, level = 0) {
    const div = document.createElement('div');
    div.className = 'tree-item';
    div.style.marginRight = `${level * 30}px`;
    
    if (safe.is_container) {
        div.classList.add('parent');
    }
    
    div.innerHTML = `
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
                    ${!safe.is_container ? `
                        <button class="btn btn-warning" onclick="editSafe(${safe.id})" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-danger" onclick="deleteSafe(${safe.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-secondary" onclick="printSafe(${safe.id})" title="طباعة">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add children
    if (safe.children && safe.children.length > 0) {
        const childrenDiv = document.createElement('div');
        childrenDiv.className = 'tree-children';
        
        safe.children.forEach(child => {
            childrenDiv.appendChild(createSafeTreeItem(child, level + 1));
        });
        
        div.appendChild(childrenDiv);
    }
    
    return div;
}

// Safe Actions
function addSafe() {
    editingId = null;
    document.getElementById('safeModalTitle').textContent = 'إضافة خزينة جديدة';
    document.getElementById('safeForm').reset();
    loadParentSafes();
    const modal = new bootstrap.Modal(document.getElementById('safeModal'));
    modal.show();
}

function editSafe(id) {
    editingId = id;
    const safe = findSafeById(id);
    if (!safe) return;
    
    document.getElementById('safeModalTitle').textContent = 'تعديل خزينة';
    document.getElementById('safeName').value = safe.name;
    document.getElementById('parentSafe').value = safe.parent_safe_id || '';
    document.getElementById('isContainer').checked = safe.is_container;
    
    loadParentSafes();
    const modal = new bootstrap.Modal(document.getElementById('safeModal'));
    modal.show();
}

function viewSafe(id) {
    const safe = findSafeById(id);
    if (!safe) return;
    
    let details = `
        <p><strong>الاسم:</strong> ${safe.name}</p>
        <p><strong>النوع:</strong> ${safe.is_container ? 'حاوية' : 'عادية'}</p>
        <p><strong>الرصيد:</strong> ${formatMoney(safe.balance)}</p>
        <p><strong>المستوى:</strong> ${safe.level}</p>
    `;
    
    if (safe.children && safe.children.length > 0) {
        details += `<p><strong>عدد الفروع:</strong> ${safe.children.length}</p>`;
    }
    
    showModal('تفاصيل الخزينة', details);
}

async function deleteSafe(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الخزينة؟')) return;
    
    try {
        const response = await fetch(`/api/safes/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('تم حذف الخزينة بنجاح', 'success');
            loadSafes();
        } else {
            showAlert('خطأ في حذف الخزينة', 'danger');
        }
    } catch (error) {
        showAlert('خطأ في الاتصال', 'danger');
    }
}

function printSafe(id) {
    const safe = findSafeById(id);
    if (!safe) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>طباعة خزينة - ${safe.name}</title>
            <style>
                body { font-family: Arial; padding: 20px; }
                h1 { color: #333; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                th { background: #f4f4f4; }
            </style>
        </head>
        <body>
            <h1>تقرير الخزينة: ${safe.name}</h1>
            <table>
                <tr><th>النوع</th><td>${safe.is_container ? 'حاوية' : 'عادية'}</td></tr>
                <tr><th>الرصيد</th><td>${formatMoney(safe.balance)}</td></tr>
                <tr><th>التاريخ</th><td>${new Date().toLocaleDateString('ar-EG')}</td></tr>
            </table>
            <script>window.print();</script>
        </body>
        </html>
    `);
}

async function saveSafe() {
    const name = document.getElementById('safeName').value;
    const parentId = document.getElementById('parentSafe').value;
    const isContainer = document.getElementById('isContainer').checked;
    
    if (!name) {
        showAlert('يرجى إدخال اسم الخزينة', 'warning');
        return;
    }
    
    const data = {
        name: name,
        parent_safe_id: parentId ? parseInt(parentId) : null,
        is_container: isContainer,
        type: parentId ? 'sub-branch' : 'main'
    };
    
    try {
        const url = editingId ? `/api/safes/${editingId}` : '/api/safes';
        const method = editingId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('safeModal')).hide();
            showAlert(editingId ? 'تم تحديث الخزينة بنجاح' : 'تم إضافة الخزينة بنجاح', 'success');
            loadSafes();
        } else {
            showAlert('خطأ في حفظ البيانات', 'danger');
        }
    } catch (error) {
        showAlert('خطأ في الاتصال', 'danger');
    }
}

// ==================== Customers Functions ====================
async function loadCustomers() {
    try {
        const response = await fetch('/api/customers/tree');
        customersData = await response.json();
        renderCustomersTree();
    } catch (error) {
        console.error('Error loading customers:', error);
        showAlert('خطأ في تحميل العملاء', 'danger');
    }
}

function renderCustomersTree() {
    const container = document.getElementById('customersTree');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (customersData.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لا يوجد عملاء</div>';
        return;
    }
    
    customersData.forEach(customer => {
        container.appendChild(createCustomerTreeItem(customer));
    });
}

function createCustomerTreeItem(customer, level = 0) {
    const div = document.createElement('div');
    div.className = 'tree-item';
    div.style.marginRight = `${level * 30}px`;
    
    if (customer.is_group) {
        div.classList.add('parent');
    }
    
    div.innerHTML = `
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
                    <button class="btn btn-primary" onclick="customerStatement(${customer.id})" title="كشف حساب">
                        <i class="fas fa-file-alt"></i>
                    </button>
                    <button class="btn btn-secondary" onclick="printCustomer(${customer.id})" title="طباعة">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add branches
    if (customer.branches && customer.branches.length > 0) {
        const branchesDiv = document.createElement('div');
        branchesDiv.className = 'tree-children';
        
        customer.branches.forEach(branch => {
            branchesDiv.appendChild(createCustomerTreeItem(branch, level + 1));
        });
        
        div.appendChild(branchesDiv);
    }
    
    return div;
}

// Customer Actions
function addCustomer() {
    editingId = null;
    document.getElementById('customerModalTitle').textContent = 'إضافة عميل جديد';
    document.getElementById('customerForm').reset();
    loadParentCustomers();
    const modal = new bootstrap.Modal(document.getElementById('customerModal'));
    modal.show();
}

function editCustomer(id) {
    editingId = id;
    const customer = findCustomerById(id);
    if (!customer) return;
    
    document.getElementById('customerModalTitle').textContent = 'تعديل عميل';
    document.getElementById('customerName').value = customer.name;
    document.getElementById('customerPhone').value = customer.phone || '';
    document.getElementById('customerAddress').value = customer.address || '';
    document.getElementById('parentCustomer').value = customer.parent_customer_id || '';
    document.getElementById('isCustomerGroup').checked = customer.is_group;
    
    loadParentCustomers();
    const modal = new bootstrap.Modal(document.getElementById('customerModal'));
    modal.show();
}

function viewCustomer(id) {
    const customer = findCustomerById(id);
    if (!customer) return;
    
    let details = `
        <p><strong>الاسم:</strong> ${customer.name}</p>
        <p><strong>الهاتف:</strong> ${customer.phone || '-'}</p>
        <p><strong>العنوان:</strong> ${customer.address || '-'}</p>
        <p><strong>الرصيد:</strong> ${formatMoney(customer.balance)}</p>
        <p><strong>النوع:</strong> ${customer.is_group ? 'مجموعة' : 'فردي'}</p>
    `;
    
    if (customer.branches && customer.branches.length > 0) {
        details += `<p><strong>عدد الفروع:</strong> ${customer.branches.length}</p>`;
    }
    
    showModal('تفاصيل العميل', details);
}

async function deleteCustomer(id) {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return;
    
    try {
        const response = await fetch(`/api/customers/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('تم حذف العميل بنجاح', 'success');
            loadCustomers();
        } else {
            showAlert('خطأ في حذف العميل', 'danger');
        }
    } catch (error) {
        showAlert('خطأ في الاتصال', 'danger');
    }
}

async function customerStatement(id) {
    try {
        const response = await fetch(`/api/reports/customer-statement/${id}`);
        const statement = await response.json();
        
        let html = `
            <h5>كشف حساب العميل</h5>
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>التاريخ</th>
                        <th>البيان</th>
                        <th>مدين</th>
                        <th>دائن</th>
                        <th>الرصيد</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        let balance = 0;
        statement.forEach(item => {
            balance += item.debit - item.credit;
            html += `
                <tr>
                    <td>${new Date(item.date).toLocaleDateString('ar-EG')}</td>
                    <td>${item.description}</td>
                    <td>${formatMoney(item.debit)}</td>
                    <td>${formatMoney(item.credit)}</td>
                    <td>${formatMoney(balance)}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        showModal('كشف الحساب', html);
    } catch (error) {
        showAlert('خطأ في تحميل كشف الحساب', 'danger');
    }
}

function printCustomer(id) {
    const customer = findCustomerById(id);
    if (!customer) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>بيانات العميل - ${customer.name}</title>
            <style>
                body { font-family: Arial; padding: 20px; }
                h1 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                th { background: #f4f4f4; }
            </style>
        </head>
        <body>
            <h1>بيانات العميل</h1>
            <table>
                <tr><th>الاسم</th><td>${customer.name}</td></tr>
                <tr><th>الهاتف</th><td>${customer.phone || '-'}</td></tr>
                <tr><th>العنوان</th><td>${customer.address || '-'}</td></tr>
                <tr><th>الرصيد</th><td>${formatMoney(customer.balance)}</td></tr>
                <tr><th>التاريخ</th><td>${new Date().toLocaleDateString('ar-EG')}</td></tr>
            </table>
            <script>window.print();</script>
        </body>
        </html>
    `);
}

async function saveCustomer() {
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const address = document.getElementById('customerAddress').value;
    const parentId = document.getElementById('parentCustomer').value;
    const isGroup = document.getElementById('isCustomerGroup').checked;
    
    if (!name) {
        showAlert('يرجى إدخال اسم العميل', 'warning');
        return;
    }
    
    const data = {
        name: name,
        phone: phone,
        address: address,
        parent_customer_id: parentId ? parseInt(parentId) : null,
        is_group: isGroup
    };
    
    try {
        const url = editingId ? `/api/customers/${editingId}` : '/api/customers';
        const method = editingId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('customerModal')).hide();
            showAlert(editingId ? 'تم تحديث العميل بنجاح' : 'تم إضافة العميل بنجاح', 'success');
            loadCustomers();
        } else {
            showAlert('خطأ في حفظ البيانات', 'danger');
        }
    } catch (error) {
        showAlert('خطأ في الاتصال', 'danger');
    }
}

// ==================== Suppliers Functions ====================
async function loadSuppliers() {
    try {
        const response = await fetch('/api/suppliers/tree');
        suppliersData = await response.json();
        renderSuppliersTree();
    } catch (error) {
        console.error('Error loading suppliers:', error);
        showAlert('خطأ في تحميل الموردين', 'danger');
    }
}

function renderSuppliersTree() {
    const container = document.getElementById('suppliersTree');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (suppliersData.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لا يوجد موردين</div>';
        return;
    }
    
    suppliersData.forEach(supplier => {
        container.appendChild(createSupplierTreeItem(supplier));
    });
}

function createSupplierTreeItem(supplier, level = 0) {
    const div = document.createElement('div');
    div.className = 'tree-item';
    div.style.marginRight = `${level * 30}px`;
    
    if (supplier.is_group) {
        div.classList.add('parent');
    }
    
    div.innerHTML = `
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
                    <button class="btn btn-primary" onclick="supplierStatement(${supplier.id})" title="كشف حساب">
                        <i class="fas fa-file-alt"></i>
                    </button>
                    <button class="btn btn-secondary" onclick="printSupplier(${supplier.id})" title="طباعة">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add branches
    if (supplier.branches && supplier.branches.length > 0) {
        const branchesDiv = document.createElement('div');
        branchesDiv.className = 'tree-children';
        
        supplier.branches.forEach(branch => {
            branchesDiv.appendChild(createSupplierTreeItem(branch, level + 1));
        });
        
        div.appendChild(branchesDiv);
    }
    
    return div;
}

// Supplier Actions - Similar to Customer Actions
function addSupplier() {
    editingId = null;
    document.getElementById('supplierModalTitle').textContent = 'إضافة مورد جديد';
    document.getElementById('supplierForm').reset();
    loadParentSuppliers();
    const modal = new bootstrap.Modal(document.getElementById('supplierModal'));
    modal.show();
}

function editSupplier(id) {
    editingId = id;
    const supplier = findSupplierById(id);
    if (!supplier) return;
    
    document.getElementById('supplierModalTitle').textContent = 'تعديل مورد';
    document.getElementById('supplierName').value = supplier.name;
    document.getElementById('supplierPhone').value = supplier.phone || '';
    document.getElementById('supplierAddress').value = supplier.address || '';
    document.getElementById('parentSupplier').value = supplier.parent_supplier_id || '';
    document.getElementById('isSupplierGroup').checked = supplier.is_group;
    
    loadParentSuppliers();
    const modal = new bootstrap.Modal(document.getElementById('supplierModal'));
    modal.show();
}

async function deleteSupplier(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المورد؟')) return;
    
    try {
        const response = await fetch(`/api/suppliers/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('تم حذف المورد بنجاح', 'success');
            loadSuppliers();
        } else {
            showAlert('خطأ في حذف المورد', 'danger');
        }
    } catch (error) {
        showAlert('خطأ في الاتصال', 'danger');
    }
}

// ==================== Vouchers Functions ====================
async function loadVouchers() {
    try {
        const response = await fetch('/api/vouchers?limit=50');
        vouchersData = await response.json();
        renderVouchersTable();
    } catch (error) {
        console.error('Error loading vouchers:', error);
        showAlert('خطأ في تحميل السندات', 'danger');
    }
}

function renderVouchersTable() {
    const tbody = document.getElementById('vouchersTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (vouchersData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">لا توجد سندات</td></tr>';
        return;
    }
    
    vouchersData.forEach(voucher => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${voucher.voucher_number}</td>
            <td>
                <span class="badge bg-${getVoucherTypeColor(voucher.voucher_type)}">
                    ${getVoucherTypeText(voucher.voucher_type)}
                </span>
            </td>
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
        `;
        tbody.appendChild(row);
    });
}

function addVoucher() {
    editingId = null;
    document.getElementById('voucherModalTitle').textContent = 'إضافة سند جديد';
    document.getElementById('voucherForm').reset();
    loadVoucherFormData();
    const modal = new bootstrap.Modal(document.getElementById('voucherModal'));
    modal.show();
}

async function deleteVoucher(id) {
    if (!confirm('هل أنت متأكد من حذف هذا السند؟')) return;
    
    try {
        const response = await fetch(`/api/vouchers/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('تم حذف السند بنجاح', 'success');
            loadVouchers();
            loadDashboard();
        } else {
            showAlert('خطأ في حذف السند', 'danger');
        }
    } catch (error) {
        showAlert('خطأ في الاتصال', 'danger');
    }
}

function printVoucher(id) {
    const voucher = vouchersData.find(v => v.id === id);
    if (!voucher) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>سند ${getVoucherTypeText(voucher.voucher_type)} - ${voucher.voucher_number}</title>
            <style>
                body { font-family: Arial; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                h1 { color: #333; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                th { background: #f4f4f4; }
                .signature { margin-top: 50px; display: flex; justify-content: space-between; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>سند ${getVoucherTypeText(voucher.voucher_type)}</h1>
                <p>رقم السند: ${voucher.voucher_number}</p>
            </div>
            <table>
                <tr><th>التاريخ</th><td>${new Date(voucher.date).toLocaleDateString('ar-EG')}</td></tr>
                <tr><th>المبلغ</th><td>${formatMoney(voucher.amount)}</td></tr>
                <tr><th>البيان</th><td>${voucher.description || '-'}</td></tr>
                <tr><th>الطرف</th><td>${getVoucherEntity(voucher)}</td></tr>
            </table>
            <div class="signature">
                <div>التوقيع: ________</div>
                <div>المستلم: ________</div>
            </div>
            <script>window.print();</script>
        </body>
        </html>
    `);
}

// ==================== Helper Functions ====================
function loadParentSafes() {
    const select = document.getElementById('parentSafe');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- خزينة رئيسية --</option>';
    safesData.forEach(safe => {
        if (safe.is_container && safe.id !== editingId) {
            const option = document.createElement('option');
            option.value = safe.id;
            option.textContent = safe.name;
            select.appendChild(option);
        }
    });
}

function loadParentCustomers() {
    const select = document.getElementById('parentCustomer');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- عميل رئيسي --</option>';
    customersData.forEach(customer => {
        if (customer.is_group && customer.id !== editingId) {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            select.appendChild(option);
        }
    });
}

function loadParentSuppliers() {
    const select = document.getElementById('parentSupplier');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- مورد رئيسي --</option>';
    suppliersData.forEach(supplier => {
        if (supplier.is_group && supplier.id !== editingId) {
            const option = document.createElement('option');
            option.value = supplier.id;
            option.textContent = supplier.name;
            select.appendChild(option);
        }
    });
}

async function loadVoucherFormData() {
    // Load safes
    await loadSafes();
    const safeSelect = document.getElementById('voucherSafe');
    if (safeSelect) {
        safeSelect.innerHTML = '<option value="">اختر الخزينة</option>';
        safesData.forEach(safe => {
            if (!safe.is_container) {
                const option = document.createElement('option');
                option.value = safe.id;
                option.textContent = safe.name;
                safeSelect.appendChild(option);
            }
        });
    }
    
    // Load customers/suppliers based on type
    updateVoucherForm();
}

function updateVoucherForm() {
    const type = document.getElementById('voucherType')?.value;
    const entitySection = document.getElementById('entitySection');
    const entityLabel = document.getElementById('entityLabel');
    const entitySelect = document.getElementById('voucherEntity');
    
    if (!entitySelect) return;
    
    entitySelect.innerHTML = '<option value="">اختر</option>';
    
    if (type === 'receipt') {
        if (entityLabel) entityLabel.textContent = 'العميل';
        customersData.forEach(customer => {
            if (!customer.is_group) {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = customer.name;
                entitySelect.appendChild(option);
            }
        });
        if (entitySection) entitySection.style.display = 'block';
    } else if (type === 'payment') {
        if (entityLabel) entityLabel.textContent = 'المورد';
        suppliersData.forEach(supplier => {
            if (!supplier.is_group) {
                const option = document.createElement('option');
                option.value = supplier.id;
                option.textContent = supplier.name;
                entitySelect.appendChild(option);
            }
        });
        if (entitySection) entitySection.style.display = 'block';
    } else {
        if (entitySection) entitySection.style.display = 'none';
    }
}

// Utility Functions
function findSafeById(id) {
    function search(safes) {
        for (let safe of safes) {
            if (safe.id === id) return safe;
            if (safe.children) {
                const found = search(safe.children);
                if (found) return found;
            }
        }
        return null;
    }
    return search(safesData);
}

function findCustomerById(id) {
    function search(customers) {
        for (let customer of customers) {
            if (customer.id === id) return customer;
            if (customer.branches) {
                const found = search(customer.branches);
                if (found) return found;
            }
        }
        return null;
    }
    return search(customersData);
}

function findSupplierById(id) {
    function search(suppliers) {
        for (let supplier of suppliers) {
            if (supplier.id === id) return supplier;
            if (supplier.branches) {
                const found = search(supplier.branches);
                if (found) return found;
            }
        }
        return null;
    }
    return search(suppliersData);
}

function getVoucherTypeColor(type) {
    switch(type) {
        case 'receipt': return 'success';
        case 'payment': return 'danger';
        case 'transfer': return 'info';
        default: return 'secondary';
    }
}

function getVoucherTypeText(type) {
    switch(type) {
        case 'receipt': return 'قبض';
        case 'payment': return 'صرف';
        case 'transfer': return 'تحويل';
        default: return type;
    }
}

function getVoucherEntity(voucher) {
    if (voucher.customer) return `عميل: ${voucher.customer.name}`;
    if (voucher.supplier) return `مورد: ${voucher.supplier.name}`;
    return '-';
}

function showModal(title, content) {
    const modalHtml = `
        <div class="modal fade" id="infoModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
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
    
    // Remove existing modal if any
    const existingModal = document.getElementById('infoModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('infoModal'));
    modal.show();
    
    // Remove modal after hidden
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
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('show');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
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
            if (children) {
                countRecursive(children);
            }
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
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Export functions for global access
window.addSafe = addSafe;
window.editSafe = editSafe;
window.viewSafe = viewSafe;
window.deleteSafe = deleteSafe;
window.printSafe = printSafe;
window.saveSafe = saveSafe;

window.addCustomer = addCustomer;
window.editCustomer = editCustomer;
window.viewCustomer = viewCustomer;
window.deleteCustomer = deleteCustomer;
window.customerStatement = customerStatement;
window.printCustomer = printCustomer;
window.saveCustomer = saveCustomer;

window.addSupplier = addSupplier;
window.editSupplier = editSupplier;
window.viewSupplier = viewSupplier;
window.deleteSupplier = deleteSupplier;
window.supplierStatement = supplierStatement;
window.printSupplier = printSupplier;
window.saveSupplier = saveSupplier;

window.addVoucher = addVoucher;
window.editVoucher = editVoucher;
window.viewVoucher = viewVoucher;
window.deleteVoucher = deleteVoucher;
window.printVoucher = printVoucher;
window.saveVoucher = saveVoucher;
window.updateVoucherForm = updateVoucherForm;