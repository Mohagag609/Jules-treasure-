// متغيرات عامة
let customers = [];
let suppliers = [];
let safes = [];
let categories = [];
let currentEntity = null;
let currentEntityType = null;

// تهيئة التطبيق عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupKeyboardShortcuts();
    setupAutoComplete();
    loadDashboard();
});

// تهيئة التطبيق
function initializeApp() {
    loadCustomers();
    loadSuppliers();
    loadSafes();
    loadCategories();
    loadVouchers();
    
    // تحديث البيانات كل 30 ثانية
    setInterval(loadDashboard, 30000);
}

// اختصارات لوحة المفاتيح
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Alt+N لسند جديد
        if (e.altKey && e.key === 'n') {
            e.preventDefault();
            document.getElementById('voucherType').focus();
        }
        // Alt+T لنوع السند
        if (e.altKey && e.key === 't') {
            e.preventDefault();
            document.getElementById('voucherType').focus();
        }
        // Alt+C للعملاء
        if (e.altKey && e.key === 'c') {
            e.preventDefault();
            document.getElementById('entitySearch').focus();
            currentEntityType = 'customer';
        }
        // Alt+S للموردين
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            document.getElementById('entitySearch').focus();
            currentEntityType = 'supplier';
        }
        // Alt+K للخزينة
        if (e.altKey && e.key === 'k') {
            e.preventDefault();
            document.getElementById('safeSelect').focus();
        }
        // Alt+M للمبلغ
        if (e.altKey && e.key === 'm') {
            e.preventDefault();
            document.getElementById('amount').focus();
        }
        // Alt+D للبيان
        if (e.altKey && e.key === 'd') {
            e.preventDefault();
            document.getElementById('description').focus();
        }
    });
}

// الإكمال التلقائي
function setupAutoComplete() {
    const entitySearch = document.getElementById('entitySearch');
    const suggestions = document.getElementById('entitySuggestions');
    let selectedIndex = -1;
    
    entitySearch.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        if (query.length < 2) {
            suggestions.classList.add('d-none');
            return;
        }
        
        let results = [];
        
        // البحث في العملاء والموردين
        customers.forEach(c => {
            if (c.name.toLowerCase().includes(query) || (c.phone && c.phone.includes(query))) {
                results.push({...c, type: 'customer', label: `عميل: ${c.name}`});
            }
        });
        
        suppliers.forEach(s => {
            if (s.name.toLowerCase().includes(query) || (s.phone && s.phone.includes(query))) {
                results.push({...s, type: 'supplier', label: `مورد: ${s.name}`});
            }
        });
        
        if (results.length > 0) {
            suggestions.innerHTML = '';
            results.slice(0, 5).forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'autocomplete-suggestion';
                div.innerHTML = `<strong>${item.label}</strong><br><small>${item.phone || ''}</small>`;
                div.onclick = function() {
                    selectEntity(item);
                };
                suggestions.appendChild(div);
            });
            suggestions.classList.remove('d-none');
            selectedIndex = -1;
        } else {
            suggestions.classList.add('d-none');
        }
    });
    
    // التنقل بالأسهم
    entitySearch.addEventListener('keydown', function(e) {
        const items = suggestions.querySelectorAll('.autocomplete-suggestion');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            updateSelection(items);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            items[selectedIndex].click();
        } else if (e.key === 'Escape') {
            suggestions.classList.add('d-none');
        }
    });
    
    function updateSelection(items) {
        items.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    // إخفاء الاقتراحات عند النقر خارجها
    document.addEventListener('click', function(e) {
        if (!entitySearch.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.add('d-none');
        }
    });
}

// اختيار كيان (عميل/مورد)
function selectEntity(entity) {
    currentEntity = entity;
    currentEntityType = entity.type;
    document.getElementById('entitySearch').value = entity.name;
    document.getElementById('entitySuggestions').classList.add('d-none');
    
    // تحديث نوع السند تلقائياً
    const voucherType = document.getElementById('voucherType');
    if (entity.type === 'customer' && !voucherType.value) {
        voucherType.value = 'receipt';
    } else if (entity.type === 'supplier' && !voucherType.value) {
        voucherType.value = 'payment';
    }
    
    // الانتقال للحقل التالي
    document.getElementById('safeSelect').focus();
}

// حفظ السند السريع
document.getElementById('quickEntryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const voucherType = document.getElementById('voucherType').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value;
    const safeId = document.getElementById('safeSelect').value;
    
    if (!voucherType || !amount || !safeId) {
        Swal.fire('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    const data = {
        voucher_type: voucherType,
        amount: amount,
        description: description
    };
    
    // تحديد الخزائن والكيانات حسب نوع السند
    if (voucherType === 'receipt') {
        data.safe_to_id = parseInt(safeId);
        if (currentEntity && currentEntity.type === 'customer') {
            data.customer_id = currentEntity.id;
        }
    } else if (voucherType === 'payment') {
        data.safe_from_id = parseInt(safeId);
        if (currentEntity && currentEntity.type === 'supplier') {
            data.supplier_id = currentEntity.id;
        }
    } else if (voucherType === 'transfer') {
        // للتحويل نحتاج خزينتين
        data.safe_from_id = parseInt(safeId);
        // يمكن إضافة حقل آخر للخزينة المستقبلة
    }
    
    try {
        const response = await fetch('/api/vouchers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // إظهار رسالة نجاح سريعة
            Swal.fire({
                icon: 'success',
                title: 'تم الحفظ',
                text: `رقم السند: ${result.voucher_number}`,
                timer: 1500,
                showConfirmButton: false
            });
            
            // تنظيف النموذج
            document.getElementById('quickEntryForm').reset();
            currentEntity = null;
            currentEntityType = null;
            
            // تحديث البيانات
            loadVouchers();
            loadDashboard();
            
            // التركيز على الحقل الأول للإدخال التالي
            document.getElementById('voucherType').focus();
        }
    } catch (error) {
        Swal.fire('خطأ', 'حدث خطأ أثناء حفظ السند', 'error');
    }
});

// تحميل لوحة التحكم
async function loadDashboard() {
    try {
        const response = await fetch('/api/dashboard');
        const data = await response.json();
        
        // تحديث الإحصائيات
        document.getElementById('todayReceipts').textContent = formatMoney(data.today.receipts);
        document.getElementById('todayPayments').textContent = formatMoney(data.today.payments);
        document.getElementById('todayNet').textContent = formatMoney(data.today.net);
        
        // رصيد الخزينة الرئيسية
        const mainSafe = data.safes.find(s => s.is_main);
        if (mainSafe) {
            document.getElementById('mainSafeBalance').textContent = formatMoney(mainSafe.balance);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// تحميل العملاء
async function loadCustomers() {
    try {
        const response = await fetch('/api/customers');
        customers = await response.json();
        
        const tbody = document.getElementById('customersTableBody');
        tbody.innerHTML = '';
        
        customers.forEach(customer => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${customer.name}</td>
                <td>${customer.phone || '-'}</td>
                <td>${customer.address || '-'}</td>
                <td class="${customer.balance >= 0 ? 'text-success' : 'text-danger'}">
                    ${formatMoney(customer.balance)}
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewCustomerStatement(${customer.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCustomer(${customer.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
        });
        
        // تهيئة DataTable
        if ($.fn.DataTable.isDataTable('#customersTable')) {
            $('#customersTable').DataTable().destroy();
        }
        $('#customersTable').DataTable({
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/ar.json'
            },
            order: [[0, 'asc']]
        });
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

// تحميل الموردين
async function loadSuppliers() {
    try {
        const response = await fetch('/api/suppliers');
        suppliers = await response.json();
        
        const tbody = document.getElementById('suppliersTableBody');
        tbody.innerHTML = '';
        
        suppliers.forEach(supplier => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${supplier.name}</td>
                <td>${supplier.phone || '-'}</td>
                <td>${supplier.address || '-'}</td>
                <td class="${supplier.balance >= 0 ? 'text-success' : 'text-danger'}">
                    ${formatMoney(supplier.balance)}
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewSupplierStatement(${supplier.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSupplier(${supplier.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
        });
        
        if ($.fn.DataTable.isDataTable('#suppliersTable')) {
            $('#suppliersTable').DataTable().destroy();
        }
        $('#suppliersTable').DataTable({
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/ar.json'
            },
            order: [[0, 'asc']]
        });
    } catch (error) {
        console.error('Error loading suppliers:', error);
    }
}

// تحميل الخزائن
async function loadSafes() {
    try {
        const response = await fetch('/api/safes');
        safes = await response.json();
        
        // تحديث قائمة الخزائن في النموذج السريع
        const safeSelect = document.getElementById('safeSelect');
        safeSelect.innerHTML = '<option value="">اختر الخزينة</option>';
        
        safes.forEach(safe => {
            const option = document.createElement('option');
            option.value = safe.id;
            option.textContent = safe.name;
            if (safe.is_main) {
                option.textContent += ' (رئيسية)';
            }
            safeSelect.appendChild(option);
        });
        
        // تحديث جدول الخزائن
        const tbody = document.getElementById('safesTableBody');
        tbody.innerHTML = '';
        
        safes.forEach(safe => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${safe.name}</td>
                <td>${safe.is_main ? 'رئيسية' : 'فرعية'}</td>
                <td class="${safe.balance >= 0 ? 'text-success' : 'text-danger'}">
                    ${formatMoney(safe.balance)}
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewSafeMovements(${safe.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${!safe.is_main ? `
                        <button class="btn btn-sm btn-danger" onclick="deleteSafe(${safe.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    ` : ''}
                </td>
            `;
        });
    } catch (error) {
        console.error('Error loading safes:', error);
    }
}

// تحميل الفئات
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        categories = await response.json();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// تحميل السندات
async function loadVouchers() {
    try {
        const response = await fetch('/api/vouchers');
        const vouchers = await response.json();
        
        const tbody = document.getElementById('vouchersTableBody');
        tbody.innerHTML = '';
        
        vouchers.forEach(voucher => {
            const row = tbody.insertRow();
            let entityName = '-';
            if (voucher.customer) {
                entityName = `عميل: ${voucher.customer.name}`;
            } else if (voucher.supplier) {
                entityName = `مورد: ${voucher.supplier.name}`;
            }
            
            let typeClass = '';
            let typeText = '';
            switch(voucher.voucher_type) {
                case 'receipt':
                    typeClass = 'badge-success';
                    typeText = 'قبض';
                    break;
                case 'payment':
                    typeClass = 'badge-danger';
                    typeText = 'صرف';
                    break;
                case 'transfer':
                    typeClass = 'badge-warning';
                    typeText = 'تحويل';
                    break;
            }
            
            row.innerHTML = `
                <td>${voucher.voucher_number}</td>
                <td><span class="badge ${typeClass}">${typeText}</span></td>
                <td>${new Date(voucher.date).toLocaleDateString('ar-EG')}</td>
                <td>${entityName}</td>
                <td>${formatMoney(voucher.amount)}</td>
                <td>${voucher.description || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="printVoucher(${voucher.id})">
                        <i class="bi bi-printer"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteVoucher(${voucher.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
        });
        
        if ($.fn.DataTable.isDataTable('#vouchersTable')) {
            $('#vouchersTable').DataTable().destroy();
        }
        $('#vouchersTable').DataTable({
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/ar.json'
            },
            order: [[0, 'desc']]
        });
    } catch (error) {
        console.error('Error loading vouchers:', error);
    }
}

// حفظ عميل جديد
async function saveCustomer() {
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const address = document.getElementById('customerAddress').value;
    
    if (!name) {
        Swal.fire('خطأ', 'يرجى إدخال اسم العميل', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/customers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, phone, address})
        });
        
        if (response.ok) {
            Swal.fire('نجح', 'تم حفظ العميل بنجاح', 'success');
            $('#customerModal').modal('hide');
            document.getElementById('customerForm').reset();
            loadCustomers();
        }
    } catch (error) {
        Swal.fire('خطأ', 'حدث خطأ أثناء حفظ العميل', 'error');
    }
}

// حفظ مورد جديد
async function saveSupplier() {
    const name = document.getElementById('supplierName').value;
    const phone = document.getElementById('supplierPhone').value;
    const address = document.getElementById('supplierAddress').value;
    
    if (!name) {
        Swal.fire('خطأ', 'يرجى إدخال اسم المورد', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/suppliers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, phone, address})
        });
        
        if (response.ok) {
            Swal.fire('نجح', 'تم حفظ المورد بنجاح', 'success');
            $('#supplierModal').modal('hide');
            document.getElementById('supplierForm').reset();
            loadSuppliers();
        }
    } catch (error) {
        Swal.fire('خطأ', 'حدث خطأ أثناء حفظ المورد', 'error');
    }
}

// حفظ خزينة جديدة
async function saveSafe() {
    const name = document.getElementById('safeName').value;
    const type = document.getElementById('safeType').value;
    
    if (!name) {
        Swal.fire('خطأ', 'يرجى إدخال اسم الخزينة', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/safes', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name, 
                type,
                is_main: type === 'main'
            })
        });
        
        if (response.ok) {
            Swal.fire('نجح', 'تم حفظ الخزينة بنجاح', 'success');
            $('#safeModal').modal('hide');
            document.getElementById('safeForm').reset();
            loadSafes();
        }
    } catch (error) {
        Swal.fire('خطأ', 'حدث خطأ أثناء حفظ الخزينة', 'error');
    }
}

// توليد التقارير
async function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const dateFrom = document.getElementById('reportDateFrom').value;
    const dateTo = document.getElementById('reportDateTo').value;
    const resultDiv = document.getElementById('reportResult');
    
    let url = '';
    switch(reportType) {
        case 'daily':
            url = `/api/reports/daily?date=${dateFrom || new Date().toISOString().split('T')[0]}`;
            break;
        case 'vouchers':
            url = `/api/vouchers?date_from=${dateFrom}&date_to=${dateTo}`;
            break;
        case 'profit_loss':
            url = `/api/reports/profit_loss?date_from=${dateFrom}&date_to=${dateTo}`;
            break;
        default:
            Swal.fire('خطأ', 'يرجى اختيار نوع التقرير', 'error');
            return;
    }
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // عرض التقرير حسب النوع
        if (reportType === 'daily') {
            resultDiv.innerHTML = `
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h5>التقرير اليومي - ${data.date}</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <div class="alert alert-success">
                                    <h6>إجمالي الإيرادات</h6>
                                    <h4>${formatMoney(data.total_receipts)}</h4>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="alert alert-danger">
                                    <h6>إجمالي المصروفات</h6>
                                    <h4>${formatMoney(data.total_payments)}</h4>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="alert alert-info">
                                    <h6>الصافي</h6>
                                    <h4>${formatMoney(data.net)}</h4>
                                </div>
                            </div>
                        </div>
                        <h6>تفاصيل السندات (${data.vouchers_count} سند)</h6>
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>رقم السند</th>
                                    <th>النوع</th>
                                    <th>المبلغ</th>
                                    <th>البيان</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.vouchers.map(v => `
                                    <tr>
                                        <td>${v.voucher_number}</td>
                                        <td>${v.type === 'receipt' ? 'قبض' : 'صرف'}</td>
                                        <td>${formatMoney(v.amount)}</td>
                                        <td>${v.description || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } else if (reportType === 'profit_loss') {
            resultDiv.innerHTML = `
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h5>تقرير الأرباح والخسائر</h5>
                    </div>
                    <div class="card-body">
                        <h6>الإيرادات</h6>
                        <table class="table table-sm">
                            ${Object.entries(data.income.by_category).map(([cat, amount]) => `
                                <tr>
                                    <td>${cat}</td>
                                    <td class="text-end">${formatMoney(amount)}</td>
                                </tr>
                            `).join('')}
                            <tr class="table-success">
                                <th>إجمالي الإيرادات</th>
                                <th class="text-end">${formatMoney(data.income.total)}</th>
                            </tr>
                        </table>
                        
                        <h6 class="mt-3">المصروفات</h6>
                        <table class="table table-sm">
                            ${Object.entries(data.expenses.by_category).map(([cat, amount]) => `
                                <tr>
                                    <td>${cat}</td>
                                    <td class="text-end">${formatMoney(amount)}</td>
                                </tr>
                            `).join('')}
                            <tr class="table-danger">
                                <th>إجمالي المصروفات</th>
                                <th class="text-end">${formatMoney(data.expenses.total)}</th>
                            </tr>
                        </table>
                        
                        <div class="alert ${data.net_profit >= 0 ? 'alert-success' : 'alert-danger'} mt-3">
                            <h5>صافي ${data.net_profit >= 0 ? 'الربح' : 'الخسارة'}: ${formatMoney(Math.abs(data.net_profit))}</h5>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        Swal.fire('خطأ', 'حدث خطأ أثناء توليد التقرير', 'error');
    }
}

// دوال مساعدة
function formatMoney(amount) {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP'
    }).format(amount || 0);
}

function showCustomerModal() {
    $('#customerModal').modal('show');
}

function showSupplierModal() {
    $('#supplierModal').modal('show');
}

function showSafeModal() {
    $('#safeModal').modal('show');
}

function showVoucherModal() {
    // يمكن إضافة نموذج منفصل للسندات إذا لزم الأمر
    document.getElementById('voucherType').focus();
}

async function deleteCustomer(id) {
    const result = await Swal.fire({
        title: 'هل أنت متأكد؟',
        text: 'سيتم حذف العميل وجميع سنداته',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، احذف',
        cancelButtonText: 'إلغاء'
    });
    
    if (result.isConfirmed) {
        try {
            const response = await fetch(`/api/customers/${id}`, {method: 'DELETE'});
            if (response.ok) {
                Swal.fire('تم الحذف', 'تم حذف العميل بنجاح', 'success');
                loadCustomers();
            }
        } catch (error) {
            Swal.fire('خطأ', 'حدث خطأ أثناء الحذف', 'error');
        }
    }
}

async function viewCustomerStatement(id) {
    const dateFrom = prompt('من تاريخ (YYYY-MM-DD):', new Date().getFullYear() + '-01-01');
    const dateTo = prompt('إلى تاريخ (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    
    if (dateFrom && dateTo) {
        try {
            const response = await fetch(`/api/reports/customer/${id}?date_from=${dateFrom}&date_to=${dateTo}`);
            const data = await response.json();
            
            let html = `
                <h5>كشف حساب: ${data.customer.name}</h5>
                <p>الرصيد السابق: ${formatMoney(data.previous_balance)}</p>
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>رقم السند</th>
                            <th>مدين</th>
                            <th>دائن</th>
                            <th>الرصيد</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.transactions.map(t => `
                            <tr>
                                <td>${new Date(t.date).toLocaleDateString('ar-EG')}</td>
                                <td>${t.voucher_number}</td>
                                <td>${formatMoney(t.debit)}</td>
                                <td>${formatMoney(t.credit)}</td>
                                <td>${formatMoney(t.balance)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <p class="text-end"><strong>الرصيد الحالي: ${formatMoney(data.current_balance)}</strong></p>
            `;
            
            Swal.fire({
                title: 'كشف الحساب',
                html: html,
                width: '80%',
                showCloseButton: true
            });
        } catch (error) {
            Swal.fire('خطأ', 'حدث خطأ أثناء جلب البيانات', 'error');
        }
    }
}