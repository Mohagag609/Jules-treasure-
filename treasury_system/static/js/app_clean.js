// نظام الخزينة - نسخة نظيفة بدون رسائل تحميل

// متغيرات عامة
let customers = [];
let suppliers = [];
let safes = [];
let currentEntity = null;

// بدء التطبيق
document.addEventListener('DOMContentLoaded', function() {
    // حذف أي رسائل تحميل موجودة
    cleanupLoaders();
    
    // تحميل البيانات
    loadData();
    
    // إعداد الأحداث
    setupEvents();
    
    // تحديث دوري
    setInterval(updateDashboard, 60000);
});

// تنظيف أي رسائل تحميل
function cleanupLoaders() {
    document.querySelectorAll('#globalLoader, .spinner-border, .spinner-grow, .loading').forEach(el => {
        el.remove();
    });
}

// تحميل البيانات
function loadData() {
    fetch('/api/customers').then(r => r.json()).then(data => {
        customers = data;
        updateCustomersTable();
    }).catch(() => {});
    
    fetch('/api/suppliers').then(r => r.json()).then(data => {
        suppliers = data;
        updateSuppliersTable();
    }).catch(() => {});
    
    fetch('/api/safes').then(r => r.json()).then(data => {
        safes = data;
        updateSafesSelect();
        updateSafesTable();
    }).catch(() => {});
    
    fetch('/api/vouchers?limit=50').then(r => r.json()).then(data => {
        updateVouchersTable(data);
    }).catch(() => {});
    
    updateDashboard();
}

// إعداد الأحداث
function setupEvents() {
    // نموذج الإدخال السريع
    const form = document.getElementById('quickEntryForm');
    if (form) {
        form.addEventListener('submit', handleQuickEntry);
    }
    
    // البحث عن عميل/مورد
    const search = document.getElementById('entitySearch');
    if (search) {
        search.addEventListener('input', handleEntitySearch);
    }
    
    // اختصارات لوحة المفاتيح
    document.addEventListener('keydown', function(e) {
        if (e.altKey) {
            switch(e.key) {
                case 'n':
                    e.preventDefault();
                    document.getElementById('voucherType')?.focus();
                    break;
                case 'c':
                    e.preventDefault();
                    document.getElementById('entitySearch')?.focus();
                    break;
                case 'm':
                    e.preventDefault();
                    document.getElementById('amount')?.focus();
                    break;
            }
        }
    });
}

// معالج الإدخال السريع
async function handleQuickEntry(e) {
    e.preventDefault();
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'حفظ...';
    btn.disabled = true;
    
    const formData = {
        voucher_type: document.getElementById('voucherType').value,
        amount: parseFloat(document.getElementById('amount').value),
        description: document.getElementById('description').value
    };
    
    const safeId = document.getElementById('safeSelect').value;
    
    if (!formData.voucher_type || !formData.amount || !safeId) {
        showMessage('يرجى ملء الحقول المطلوبة', 'warning');
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }
    
    // التحقق من صلاحية الخزينة للمعاملات
    try {
        const validateResponse = await fetch('/api/safes/validate-transaction', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({safe_id: safeId})
        });
        
        const validation = await validateResponse.json();
        if (!validation.valid) {
            showMessage(validation.message, 'danger');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }
    } catch (error) {
        console.error('Validation error:', error);
    }
    
    // تحديد الخزينة حسب النوع
    if (formData.voucher_type === 'receipt') {
        formData.safe_to_id = parseInt(safeId);
        if (currentEntity?.type === 'customer') {
            formData.customer_id = currentEntity.id;
        }
    } else if (formData.voucher_type === 'payment') {
        formData.safe_from_id = parseInt(safeId);
        if (currentEntity?.type === 'supplier') {
            formData.supplier_id = currentEntity.id;
        }
    }
    
    try {
        const response = await fetch('/api/vouchers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage(`تم حفظ السند رقم ${result.voucher_number}`, 'success');
            
            // تنظيف النموذج
            e.target.reset();
            currentEntity = null;
            
            // تحديث البيانات
            loadData();
        } else {
            showMessage('حدث خطأ في الحفظ', 'danger');
        }
    } catch (error) {
        showMessage('خطأ في الاتصال', 'danger');
    }
    
    btn.innerHTML = originalText;
    btn.disabled = false;
}

// البحث عن عميل/مورد
function handleEntitySearch(e) {
    const query = e.target.value.toLowerCase();
    const suggestions = document.getElementById('entitySuggestions');
    
    if (query.length < 2) {
        suggestions.classList.add('d-none');
        return;
    }
    
    let results = [];
    
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
            div.innerHTML = `<strong>${item.label}</strong>`;
            div.onclick = () => selectEntity(item);
            suggestions.appendChild(div);
        });
        suggestions.classList.remove('d-none');
    } else {
        suggestions.classList.add('d-none');
    }
}

// اختيار كيان
function selectEntity(entity) {
    currentEntity = entity;
    document.getElementById('entitySearch').value = entity.name;
    document.getElementById('entitySuggestions').classList.add('d-none');
    
    // تحديد نوع السند تلقائياً
    const voucherType = document.getElementById('voucherType');
    if (!voucherType.value) {
        voucherType.value = entity.type === 'customer' ? 'receipt' : 'payment';
    }
    
    document.getElementById('safeSelect').focus();
}

// تحديث لوحة التحكم
async function updateDashboard() {
    try {
        const response = await fetch('/api/dashboard');
        const data = await response.json();
        
        document.getElementById('todayReceipts').textContent = formatMoney(data.today.receipts);
        document.getElementById('todayPayments').textContent = formatMoney(data.today.payments);
        document.getElementById('todayNet').textContent = formatMoney(data.today.net);
        
        const mainSafe = data.safes.find(s => s.is_main);
        if (mainSafe) {
            document.getElementById('mainSafeBalance').textContent = formatMoney(mainSafe.balance);
        }
    } catch (error) {
        // تجاهل الأخطاء
    }
}

// تحديث جدول العملاء
function updateCustomersTable() {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    customers.forEach(c => {
        tbody.innerHTML += `
            <tr>
                <td>${c.name}</td>
                <td>${c.phone || '-'}</td>
                <td>${c.address || '-'}</td>
                <td class="${c.balance >= 0 ? 'text-success' : 'text-danger'}">${formatMoney(c.balance)}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewStatement('customer', ${c.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

// تحديث جدول الموردين
function updateSuppliersTable() {
    const tbody = document.getElementById('suppliersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    suppliers.forEach(s => {
        tbody.innerHTML += `
            <tr>
                <td>${s.name}</td>
                <td>${s.phone || '-'}</td>
                <td>${s.address || '-'}</td>
                <td class="${s.balance >= 0 ? 'text-success' : 'text-danger'}">${formatMoney(s.balance)}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewStatement('supplier', ${s.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

// تحديث قائمة الخزائن
function updateSafesSelect() {
    const select = document.getElementById('safeSelect');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">اختر الخزينة</option>';
    
    safes.forEach(safe => {
        select.innerHTML += `<option value="${safe.id}">${safe.name}${safe.is_main ? ' (رئيسية)' : ''}</option>`;
    });
    
    if (currentValue) select.value = currentValue;
}

// تحديث جدول الخزائن
function updateSafesTable() {
    const tbody = document.getElementById('safesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    safes.forEach(safe => {
        tbody.innerHTML += `
            <tr>
                <td>${safe.name}</td>
                <td>${safe.is_main ? 'رئيسية' : 'فرعية'}</td>
                <td class="${safe.balance >= 0 ? 'text-success' : 'text-danger'}">${formatMoney(safe.balance)}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewSafeMovements(${safe.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

// تحديث جدول السندات
function updateVouchersTable(vouchers) {
    const tbody = document.getElementById('vouchersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    vouchers.forEach(v => {
        let entity = '-';
        if (v.customer) entity = `عميل: ${v.customer.name}`;
        else if (v.supplier) entity = `مورد: ${v.supplier.name}`;
        
        let typeClass = v.voucher_type === 'receipt' ? 'success' : v.voucher_type === 'payment' ? 'danger' : 'warning';
        let typeText = v.voucher_type === 'receipt' ? 'قبض' : v.voucher_type === 'payment' ? 'صرف' : 'تحويل';
        
        tbody.innerHTML += `
            <tr>
                <td>${v.voucher_number}</td>
                <td><span class="badge badge-${typeClass}">${typeText}</span></td>
                <td>${new Date(v.date).toLocaleDateString('ar-EG')}</td>
                <td>${entity}</td>
                <td>${formatMoney(v.amount)}</td>
                <td>${v.description || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="printVoucher(${v.id})">
                        <i class="bi bi-printer"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

// عرض رسالة
function showMessage(text, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    alert.style.zIndex = '9999';
    alert.textContent = text;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.5s';
        setTimeout(() => alert.remove(), 500);
    }, 3000);
}

// تنسيق المال
function formatMoney(amount) {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP'
    }).format(amount || 0);
}

// حفظ عميل
async function saveCustomer() {
    const name = document.getElementById('customerName').value;
    if (!name) return;
    
    const data = {
        name: name,
        phone: document.getElementById('customerPhone').value,
        address: document.getElementById('customerAddress').value
    };
    
    try {
        const response = await fetch('/api/customers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showMessage('تم حفظ العميل', 'success');
            $('#customerModal').modal('hide');
            document.getElementById('customerForm').reset();
            loadData();
        }
    } catch (error) {
        showMessage('خطأ في الحفظ', 'danger');
    }
}

// حفظ مورد
async function saveSupplier() {
    const name = document.getElementById('supplierName').value;
    if (!name) return;
    
    const data = {
        name: name,
        phone: document.getElementById('supplierPhone').value,
        address: document.getElementById('supplierAddress').value
    };
    
    try {
        const response = await fetch('/api/suppliers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showMessage('تم حفظ المورد', 'success');
            $('#supplierModal').modal('hide');
            document.getElementById('supplierForm').reset();
            loadData();
        }
    } catch (error) {
        showMessage('خطأ في الحفظ', 'danger');
    }
}

// حفظ خزينة
async function saveSafe() {
    const name = document.getElementById('safeName').value;
    if (!name) return;
    
    const data = {
        name: name,
        type: document.getElementById('safeType').value,
        is_main: document.getElementById('safeType').value === 'main'
    };
    
    try {
        const response = await fetch('/api/safes', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showMessage('تم حفظ الخزينة', 'success');
            $('#safeModal').modal('hide');
            document.getElementById('safeForm').reset();
            loadData();
        }
    } catch (error) {
        showMessage('خطأ في الحفظ', 'danger');
    }
}

// دوال العرض
function showCustomerModal() { $('#customerModal').modal('show'); }
function showSupplierModal() { $('#supplierModal').modal('show'); }
function showSafeModal() { $('#safeModal').modal('show'); }

// دوال placeholder
function viewStatement(type, id) { console.log('View statement:', type, id); }
function viewSafeMovements(id) { console.log('View safe movements:', id); }
function printVoucher(id) { console.log('Print voucher:', id); }
function deleteCustomer(id) { if(confirm('حذف؟')) loadData(); }
function deleteSupplier(id) { if(confirm('حذف؟')) loadData(); }