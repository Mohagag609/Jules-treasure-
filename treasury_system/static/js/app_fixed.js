// متغيرات عامة
let customers = [];
let suppliers = [];
let safes = [];
let categories = [];
let currentEntity = null;
let currentEntityType = null;

// تهيئة التطبيق عند التحميل - بدون رسالة تحميل مزعجة
document.addEventListener('DOMContentLoaded', function() {
    // تحميل البيانات بهدوء في الخلفية
    loadInitialData();
    setupKeyboardShortcuts();
    setupAutoComplete();
    
    // تحديث الإحصائيات
    loadDashboard();
    
    // تحديث دوري كل دقيقة
    setInterval(loadDashboard, 60000);
});

// تحميل البيانات الأولية بدون إزعاج
async function loadInitialData() {
    // تحميل بدون مؤشرات مزعجة
    Promise.all([
        loadCustomers(false),
        loadSuppliers(false),
        loadSafes(false),
        loadCategories(),
        loadVouchers(false)
    ]).catch(err => console.log('Some data failed to load, but continuing...'));
}

// اختصارات لوحة المفاتيح
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key === 'n') {
            e.preventDefault();
            document.getElementById('voucherType').focus();
        }
        if (e.altKey && e.key === 'c') {
            e.preventDefault();
            document.getElementById('entitySearch').focus();
            currentEntityType = 'customer';
        }
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            document.getElementById('entitySearch').focus();
            currentEntityType = 'supplier';
        }
        if (e.altKey && e.key === 'm') {
            e.preventDefault();
            document.getElementById('amount').focus();
        }
    });
}

// الإكمال التلقائي
function setupAutoComplete() {
    const entitySearch = document.getElementById('entitySearch');
    const suggestions = document.getElementById('entitySuggestions');
    let selectedIndex = -1;
    
    if (!entitySearch) return;
    
    entitySearch.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        if (query.length < 2) {
            suggestions.classList.add('d-none');
            return;
        }
        
        let results = [];
        
        // البحث في العملاء والموردين
        customers.forEach(c => {
            if (c.name.toLowerCase().includes(query)) {
                results.push({...c, type: 'customer', label: `عميل: ${c.name}`});
            }
        });
        
        suppliers.forEach(s => {
            if (s.name.toLowerCase().includes(query)) {
                results.push({...s, type: 'supplier', label: `مورد: ${s.name}`});
            }
        });
        
        if (results.length > 0) {
            suggestions.innerHTML = '';
            results.slice(0, 5).forEach(item => {
                const div = document.createElement('div');
                div.className = 'autocomplete-suggestion';
                div.innerHTML = `<strong>${item.label}</strong><br><small>${item.phone || ''}</small>`;
                div.onclick = function() {
                    selectEntity(item);
                };
                suggestions.appendChild(div);
            });
            suggestions.classList.remove('d-none');
        } else {
            suggestions.classList.add('d-none');
        }
    });
    
    // إخفاء عند النقر خارجها
    document.addEventListener('click', function(e) {
        if (!entitySearch.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.add('d-none');
        }
    });
}

// اختيار كيان
function selectEntity(entity) {
    currentEntity = entity;
    currentEntityType = entity.type;
    document.getElementById('entitySearch').value = entity.name;
    document.getElementById('entitySuggestions').classList.add('d-none');
    
    const voucherType = document.getElementById('voucherType');
    if (entity.type === 'customer' && !voucherType.value) {
        voucherType.value = 'receipt';
    } else if (entity.type === 'supplier' && !voucherType.value) {
        voucherType.value = 'payment';
    }
    
    document.getElementById('safeSelect').focus();
}

// حفظ السند السريع
document.getElementById('quickEntryForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    const voucherType = document.getElementById('voucherType').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value;
    const safeId = document.getElementById('safeSelect').value;
    
    if (!voucherType || !amount || !safeId) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    // إظهار مؤشر تحميل بسيط
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'جاري الحفظ...';
    
    const data = {
        voucher_type: voucherType,
        amount: amount,
        description: description
    };
    
    // تحديد الخزائن والكيانات
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
        data.safe_from_id = parseInt(safeId);
    }
    
    try {
        const response = await fetch('/api/vouchers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // رسالة نجاح بسيطة
            showSuccessMessage(`تم حفظ السند رقم ${result.voucher_number}`);
            
            // تنظيف النموذج
            this.reset();
            currentEntity = null;
            currentEntityType = null;
            
            // تحديث البيانات
            loadVouchers(false);
            loadDashboard();
            updateTablesQuietly();
            
            // التركيز للإدخال التالي
            document.getElementById('voucherType').focus();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('حدث خطأ أثناء حفظ السند');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

// رسالة نجاح بسيطة
function showSuccessMessage(message) {
    // إنشاء رسالة نجاح صغيرة
    const toast = document.createElement('div');
    toast.className = 'alert alert-success position-fixed top-0 end-0 m-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <i class="bi bi-check-circle me-2"></i>${message}
    `;
    document.body.appendChild(toast);
    
    // إخفاء بعد 3 ثواني
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// تحديث الجداول بهدوء
function updateTablesQuietly() {
    loadCustomers(false);
    loadSuppliers(false);
    loadSafes(false);
}

// تحميل لوحة التحكم
async function loadDashboard() {
    try {
        const response = await fetch('/api/dashboard');
        const data = await response.json();
        
        // تحديث الإحصائيات
        const todayReceipts = document.getElementById('todayReceipts');
        const todayPayments = document.getElementById('todayPayments');
        const todayNet = document.getElementById('todayNet');
        const mainSafeBalance = document.getElementById('mainSafeBalance');
        
        if (todayReceipts) todayReceipts.textContent = formatMoney(data.today.receipts);
        if (todayPayments) todayPayments.textContent = formatMoney(data.today.payments);
        if (todayNet) todayNet.textContent = formatMoney(data.today.net);
        
        const mainSafe = data.safes.find(s => s.is_main);
        if (mainSafe && mainSafeBalance) {
            mainSafeBalance.textContent = formatMoney(mainSafe.balance);
        }
    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

// تحميل العملاء
async function loadCustomers(showLoader = true) {
    try {
        const response = await fetch('/api/customers');
        if (!response.ok) return;
        
        customers = await response.json();
        
        const tbody = document.getElementById('customersTableBody');
        if (!tbody) return;
        
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
        
        // DataTable إذا كان موجود
        if (typeof $ !== 'undefined' && $.fn.DataTable) {
            if ($.fn.DataTable.isDataTable('#customersTable')) {
                $('#customersTable').DataTable().destroy();
            }
            $('#customersTable').DataTable({
                language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/ar.json' },
                order: [[0, 'asc']],
                pageLength: 10
            });
        }
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

// تحميل الموردين
async function loadSuppliers(showLoader = true) {
    try {
        const response = await fetch('/api/suppliers');
        if (!response.ok) return;
        
        suppliers = await response.json();
        
        const tbody = document.getElementById('suppliersTableBody');
        if (!tbody) return;
        
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
        
        if (typeof $ !== 'undefined' && $.fn.DataTable) {
            if ($.fn.DataTable.isDataTable('#suppliersTable')) {
                $('#suppliersTable').DataTable().destroy();
            }
            $('#suppliersTable').DataTable({
                language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/ar.json' },
                order: [[0, 'asc']],
                pageLength: 10
            });
        }
    } catch (error) {
        console.error('Error loading suppliers:', error);
    }
}

// تحميل الخزائن
async function loadSafes(showLoader = true) {
    try {
        const response = await fetch('/api/safes');
        if (!response.ok) return;
        
        safes = await response.json();
        
        // تحديث قائمة الخزائن
        const safeSelect = document.getElementById('safeSelect');
        if (safeSelect) {
            const currentValue = safeSelect.value;
            safeSelect.innerHTML = '<option value="">اختر الخزينة</option>';
            safes.forEach(safe => {
                const option = document.createElement('option');
                option.value = safe.id;
                option.textContent = safe.name + (safe.is_main ? ' (رئيسية)' : '');
                safeSelect.appendChild(option);
            });
            if (currentValue) safeSelect.value = currentValue;
        }
        
        // تحديث جدول الخزائن
        const tbody = document.getElementById('safesTableBody');
        if (tbody) {
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
        }
    } catch (error) {
        console.error('Error loading safes:', error);
    }
}

// تحميل الفئات
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        if (response.ok) {
            categories = await response.json();
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// تحميل السندات
async function loadVouchers(showLoader = true) {
    try {
        const response = await fetch('/api/vouchers?limit=50');
        if (!response.ok) return;
        
        const vouchers = await response.json();
        
        const tbody = document.getElementById('vouchersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        vouchers.forEach(voucher => {
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
            
            const row = tbody.insertRow();
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
        
        if (typeof $ !== 'undefined' && $.fn.DataTable) {
            if ($.fn.DataTable.isDataTable('#vouchersTable')) {
                $('#vouchersTable').DataTable().destroy();
            }
            $('#vouchersTable').DataTable({
                language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/ar.json' },
                order: [[0, 'desc']],
                pageLength: 10
            });
        }
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
        alert('يرجى إدخال اسم العميل');
        return;
    }
    
    try {
        const response = await fetch('/api/customers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, phone, address})
        });
        
        if (response.ok) {
            showSuccessMessage('تم حفظ العميل بنجاح');
            $('#customerModal').modal('hide');
            document.getElementById('customerForm').reset();
            loadCustomers(false);
        }
    } catch (error) {
        alert('حدث خطأ أثناء حفظ العميل');
    }
}

// حفظ مورد جديد
async function saveSupplier() {
    const name = document.getElementById('supplierName').value;
    const phone = document.getElementById('supplierPhone').value;
    const address = document.getElementById('supplierAddress').value;
    
    if (!name) {
        alert('يرجى إدخال اسم المورد');
        return;
    }
    
    try {
        const response = await fetch('/api/suppliers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, phone, address})
        });
        
        if (response.ok) {
            showSuccessMessage('تم حفظ المورد بنجاح');
            $('#supplierModal').modal('hide');
            document.getElementById('supplierForm').reset();
            loadSuppliers(false);
        }
    } catch (error) {
        alert('حدث خطأ أثناء حفظ المورد');
    }
}

// حفظ خزينة جديدة
async function saveSafe() {
    const name = document.getElementById('safeName').value;
    const type = document.getElementById('safeType').value;
    
    if (!name) {
        alert('يرجى إدخال اسم الخزينة');
        return;
    }
    
    try {
        const response = await fetch('/api/safes', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, type, is_main: type === 'main'})
        });
        
        if (response.ok) {
            showSuccessMessage('تم حفظ الخزينة بنجاح');
            $('#safeModal').modal('hide');
            document.getElementById('safeForm').reset();
            loadSafes(false);
        }
    } catch (error) {
        alert('حدث خطأ أثناء حفظ الخزينة');
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

// حذف عميل
async function deleteCustomer(id) {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return;
    
    try {
        const response = await fetch(`/api/customers/${id}`, {method: 'DELETE'});
        if (response.ok) {
            showSuccessMessage('تم حذف العميل بنجاح');
            loadCustomers(false);
        }
    } catch (error) {
        alert('حدث خطأ أثناء الحذف');
    }
}

// حذف مورد
async function deleteSupplier(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المورد؟')) return;
    
    try {
        const response = await fetch(`/api/suppliers/${id}`, {method: 'DELETE'});
        if (response.ok) {
            showSuccessMessage('تم حذف المورد بنجاح');
            loadSuppliers(false);
        }
    } catch (error) {
        alert('حدث خطأ أثناء الحذف');
    }
}

// عرض كشف حساب العميل
async function viewCustomerStatement(id) {
    const dateFrom = prompt('من تاريخ (YYYY-MM-DD):', new Date().getFullYear() + '-01-01');
    const dateTo = prompt('إلى تاريخ (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    
    if (!dateFrom || !dateTo) return;
    
    try {
        const response = await fetch(`/api/reports/customer/${id}?date_from=${dateFrom}&date_to=${dateTo}`);
        const data = await response.json();
        
        // عرض البيانات في نافذة جديدة
        const win = window.open('', '_blank');
        win.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>كشف حساب ${data.customer.name}</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body class="p-4">
                <h3>كشف حساب: ${data.customer.name}</h3>
                <p>الرصيد السابق: ${formatMoney(data.previous_balance)}</p>
                <table class="table table-bordered">
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
                <p><strong>الرصيد الحالي: ${formatMoney(data.current_balance)}</strong></p>
                <button class="btn btn-primary" onclick="window.print()">طباعة</button>
            </body>
            </html>
        `);
    } catch (error) {
        alert('حدث خطأ في جلب البيانات');
    }
}