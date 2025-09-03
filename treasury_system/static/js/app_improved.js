// متغيرات عامة
let customers = [];
let suppliers = [];
let safes = [];
let categories = [];
let currentEntity = null;
let currentEntityType = null;
let isLoading = false;

// Cache للبيانات
const dataCache = {
    customers: { data: null, timestamp: 0 },
    suppliers: { data: null, timestamp: 0 },
    safes: { data: null, timestamp: 0 },
    vouchers: { data: null, timestamp: 0 }
};

const CACHE_DURATION = 30000; // 30 ثانية

// تهيئة التطبيق عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupKeyboardShortcuts();
    setupAutoComplete();
    setupRealTimeUpdates();
    loadDashboard();
});

// تهيئة التطبيق
async function initializeApp() {
    showGlobalLoader();
    
    try {
        // تحميل البيانات بشكل متوازي لتسريع التحميل
        await Promise.all([
            loadCustomers(),
            loadSuppliers(),
            loadSafes(),
            loadCategories(),
            loadVouchers()
        ]).catch(error => {
            console.error('Error loading initial data:', error);
            // نستمر حتى لو فشل جزء من التحميل
        });
    } catch (error) {
        console.error('Initialization error:', error);
    } finally {
        // إخفاء رسالة التحميل في كل الأحوال
        hideGlobalLoader();
    }
    
    // تحديث البيانات كل 30 ثانية
    setInterval(loadDashboard, 30000);
}

// إضافة مؤشر تحميل عام
function showGlobalLoader() {
    if (!document.getElementById('globalLoader')) {
        const loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        z-index: 9999; background: white; padding: 20px; border-radius: 10px; 
                        box-shadow: 0 0 20px rgba(0,0,0,0.2);">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">جاري التحميل...</span>
                </div>
                <p class="mt-2 mb-0">جاري تحميل البيانات...</p>
            </div>
        `;
        document.body.appendChild(loader);
        
        // إخفاء تلقائي بعد 5 ثواني في حالة حدوث مشكلة
        setTimeout(() => {
            hideGlobalLoader();
        }, 5000);
    }
}

function hideGlobalLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.remove();
    }
}

// إضافة مؤشر تحميل للجداول
function showTableLoader(tableId) {
    const table = document.getElementById(tableId);
    if (table) {
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="100%" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">جاري التحميل...</span>
                    </div>
                </td>
            </tr>
        `;
    }
}

// تحديثات في الوقت الفعلي
function setupRealTimeUpdates() {
    // استخدام Server-Sent Events أو WebSocket في المستقبل
    // حالياً سنستخدم polling محسّن
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

// الإكمال التلقائي المحسّن
function setupAutoComplete() {
    const entitySearch = document.getElementById('entitySearch');
    const suggestions = document.getElementById('entitySuggestions');
    let selectedIndex = -1;
    let searchTimeout;
    
    entitySearch.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        
        // إلغاء البحث السابق
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            suggestions.classList.add('d-none');
            return;
        }
        
        // تأخير البحث لتحسين الأداء
        searchTimeout = setTimeout(() => {
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
        }, 200); // تأخير 200ms
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

// حفظ السند السريع - محسّن
document.getElementById('quickEntryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (isLoading) return; // منع الإرسال المتعدد
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // إظهار مؤشر التحميل
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>جاري الحفظ...';
    isLoading = true;
    
    const voucherType = document.getElementById('voucherType').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value;
    const safeId = document.getElementById('safeSelect').value;
    
    if (!voucherType || !amount || !safeId) {
        Swal.fire('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        isLoading = false;
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
            
            // إضافة السند للجدول مباشرة بدون إعادة تحميل
            addVoucherToTable(result);
            
            // تحديث الإحصائيات مباشرة
            updateDashboardStats(voucherType, amount);
            
            // إظهار رسالة نجاح
            const toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });
            
            toast.fire({
                icon: 'success',
                title: `تم حفظ السند رقم ${result.voucher_number}`
            });
            
            // تنظيف النموذج
            document.getElementById('quickEntryForm').reset();
            currentEntity = null;
            currentEntityType = null;
            
            // تحديث البيانات في الخلفية
            setTimeout(() => {
                loadVouchers(false); // false = بدون مؤشر تحميل
                loadDashboard(false);
                if (currentEntity) {
                    if (currentEntity.type === 'customer') {
                        loadCustomers(false);
                    } else {
                        loadSuppliers(false);
                    }
                }
                loadSafes(false);
            }, 500);
            
            // التركيز على الحقل الأول للإدخال التالي
            document.getElementById('voucherType').focus();
        } else {
            const error = await response.json();
            Swal.fire('خطأ', error.message || 'حدث خطأ أثناء حفظ السند', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('خطأ', 'حدث خطأ في الاتصال بالخادم', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        isLoading = false;
    }
});

// إضافة السند للجدول مباشرة
function addVoucherToTable(voucher) {
    const tbody = document.getElementById('vouchersTableBody');
    if (!tbody) return;
    
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
    
    const row = document.createElement('tr');
    row.style.animation = 'slideIn 0.5s ease-out';
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
    
    // إضافة السند في البداية
    tbody.insertBefore(row, tbody.firstChild);
    
    // إزالة آخر صف إذا كان الجدول طويلاً
    if (tbody.children.length > 20) {
        tbody.removeChild(tbody.lastChild);
    }
}

// تحديث الإحصائيات مباشرة
function updateDashboardStats(voucherType, amount) {
    const todayReceipts = document.getElementById('todayReceipts');
    const todayPayments = document.getElementById('todayPayments');
    const todayNet = document.getElementById('todayNet');
    
    if (voucherType === 'receipt' && todayReceipts) {
        const currentValue = parseFloat(todayReceipts.textContent.replace(/[^\d.-]/g, '')) || 0;
        todayReceipts.textContent = formatMoney(currentValue + amount);
        animateValue(todayReceipts);
    } else if (voucherType === 'payment' && todayPayments) {
        const currentValue = parseFloat(todayPayments.textContent.replace(/[^\d.-]/g, '')) || 0;
        todayPayments.textContent = formatMoney(currentValue + amount);
        animateValue(todayPayments);
    }
    
    // تحديث الصافي
    if (todayNet && todayReceipts && todayPayments) {
        const receipts = parseFloat(todayReceipts.textContent.replace(/[^\d.-]/g, '')) || 0;
        const payments = parseFloat(todayPayments.textContent.replace(/[^\d.-]/g, '')) || 0;
        todayNet.textContent = formatMoney(receipts - payments);
        animateValue(todayNet);
    }
}

// تأثير حركي للأرقام
function animateValue(element) {
    element.style.animation = 'pulse 0.5s ease-out';
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

// تحميل لوحة التحكم - محسّن
async function loadDashboard(showLoader = false) {
    if (showLoader) {
        document.querySelectorAll('.stat-card h3').forEach(el => {
            el.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        });
    }
    
    try {
        const response = await fetch('/api/dashboard');
        const data = await response.json();
        
        // تحديث الإحصائيات مع تأثير حركي
        updateStatWithAnimation('todayReceipts', data.today.receipts);
        updateStatWithAnimation('todayPayments', data.today.payments);
        updateStatWithAnimation('todayNet', data.today.net);
        
        // رصيد الخزينة الرئيسية
        const mainSafe = data.safes.find(s => s.is_main);
        if (mainSafe) {
            updateStatWithAnimation('mainSafeBalance', mainSafe.balance);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function updateStatWithAnimation(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        const formattedValue = formatMoney(value);
        if (element.textContent !== formattedValue) {
            element.style.opacity = '0.5';
            setTimeout(() => {
                element.textContent = formattedValue;
                element.style.opacity = '1';
                element.style.transition = 'opacity 0.3s ease-out';
            }, 100);
        }
    }
}

// تحميل العملاء - محسّن مع Cache
async function loadCustomers(showLoader = true) {
    // التحقق من Cache
    const now = Date.now();
    if (dataCache.customers.data && (now - dataCache.customers.timestamp) < CACHE_DURATION) {
        customers = dataCache.customers.data;
        renderCustomersTable();
        return;
    }
    
    if (showLoader) {
        showTableLoader('customersTableBody');
    }
    
    try {
        const response = await fetch('/api/customers');
        if (!response.ok) throw new Error('Failed to fetch');
        
        customers = await response.json();
        
        // حفظ في Cache
        dataCache.customers = {
            data: customers,
            timestamp: now
        };
        
        renderCustomersTable();
    } catch (error) {
        console.error('Error loading customers:', error);
        // عرض جدول فارغ بدلاً من رسالة الخطأ
        const tbody = document.getElementById('customersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">لا توجد بيانات</td></tr>';
        }
        customers = []; // تفريغ القائمة
    }
}

function renderCustomersTable() {
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
    
    // إعادة تهيئة DataTable إذا كان موجوداً
    if ($.fn.DataTable.isDataTable('#customersTable')) {
        $('#customersTable').DataTable().destroy();
    }
    $('#customersTable').DataTable({
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/ar.json'
        },
        order: [[0, 'asc']],
        pageLength: 10
    });
}

// تحميل الموردين - محسّن
async function loadSuppliers(showLoader = true) {
    const now = Date.now();
    if (dataCache.suppliers.data && (now - dataCache.suppliers.timestamp) < CACHE_DURATION) {
        suppliers = dataCache.suppliers.data;
        renderSuppliersTable();
        return;
    }
    
    if (showLoader) {
        showTableLoader('suppliersTableBody');
    }
    
    try {
        const response = await fetch('/api/suppliers');
        if (!response.ok) throw new Error('Failed to fetch');
        
        suppliers = await response.json();
        
        dataCache.suppliers = {
            data: suppliers,
            timestamp: now
        };
        
        renderSuppliersTable();
    } catch (error) {
        console.error('Error loading suppliers:', error);
        const tbody = document.getElementById('suppliersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">لا توجد بيانات</td></tr>';
        }
        suppliers = [];
    }
}

function renderSuppliersTable() {
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
    
    if ($.fn.DataTable.isDataTable('#suppliersTable')) {
        $('#suppliersTable').DataTable().destroy();
    }
    $('#suppliersTable').DataTable({
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/ar.json'
        },
        order: [[0, 'asc']],
        pageLength: 10
    });
}

// تحميل الخزائن - محسّن
async function loadSafes(showLoader = true) {
    const now = Date.now();
    if (dataCache.safes.data && (now - dataCache.safes.timestamp) < CACHE_DURATION) {
        safes = dataCache.safes.data;
        renderSafesUI();
        return;
    }
    
    try {
        const response = await fetch('/api/safes');
        safes = await response.json();
        
        dataCache.safes = {
            data: safes,
            timestamp: now
        };
        
        renderSafesUI();
    } catch (error) {
        console.error('Error loading safes:', error);
    }
}

function renderSafesUI() {
    // تحديث قائمة الخزائن في النموذج السريع
    const safeSelect = document.getElementById('safeSelect');
    if (safeSelect) {
        const currentValue = safeSelect.value;
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
        
        // استعادة القيمة المختارة
        if (currentValue) {
            safeSelect.value = currentValue;
        }
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

// تحميل السندات - محسّن
async function loadVouchers(showLoader = true) {
    if (showLoader) {
        showTableLoader('vouchersTableBody');
    }
    
    try {
        const response = await fetch('/api/vouchers?limit=50'); // حد أقل للسرعة
        if (!response.ok) throw new Error('Failed to fetch');
        
        const vouchers = await response.json();
        renderVouchersTable(vouchers);
    } catch (error) {
        console.error('Error loading vouchers:', error);
        const tbody = document.getElementById('vouchersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">لا توجد سندات</td></tr>';
        }
    }
}

function renderVouchersTable(vouchers) {
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
    
    if ($.fn.DataTable.isDataTable('#vouchersTable')) {
        $('#vouchersTable').DataTable().destroy();
    }
    $('#vouchersTable').DataTable({
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/ar.json'
        },
        order: [[0, 'desc']],
        pageLength: 10
    });
}

// حفظ عميل جديد - محسّن
async function saveCustomer() {
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const address = document.getElementById('customerAddress').value;
    
    if (!name) {
        Swal.fire('خطأ', 'يرجى إدخال اسم العميل', 'error');
        return;
    }
    
    const submitBtn = document.querySelector('#customerModal .btn-primary');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>جاري الحفظ...';
    
    try {
        const response = await fetch('/api/customers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, phone, address})
        });
        
        if (response.ok) {
            const newCustomer = await response.json();
            
            // إضافة العميل للقائمة مباشرة
            customers.push(newCustomer);
            
            // مسح Cache
            dataCache.customers.timestamp = 0;
            
            // إظهار رسالة نجاح
            const toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
            
            toast.fire({
                icon: 'success',
                title: 'تم حفظ العميل بنجاح'
            });
            
            $('#customerModal').modal('hide');
            document.getElementById('customerForm').reset();
            
            // تحديث الجدول
            renderCustomersTable();
        }
    } catch (error) {
        Swal.fire('خطأ', 'حدث خطأ أثناء حفظ العميل', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'حفظ';
    }
}

// حفظ مورد جديد - محسّن
async function saveSupplier() {
    const name = document.getElementById('supplierName').value;
    const phone = document.getElementById('supplierPhone').value;
    const address = document.getElementById('supplierAddress').value;
    
    if (!name) {
        Swal.fire('خطأ', 'يرجى إدخال اسم المورد', 'error');
        return;
    }
    
    const submitBtn = document.querySelector('#supplierModal .btn-primary');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>جاري الحفظ...';
    
    try {
        const response = await fetch('/api/suppliers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, phone, address})
        });
        
        if (response.ok) {
            const newSupplier = await response.json();
            
            // إضافة المورد للقائمة مباشرة
            suppliers.push(newSupplier);
            
            // مسح Cache
            dataCache.suppliers.timestamp = 0;
            
            const toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
            
            toast.fire({
                icon: 'success',
                title: 'تم حفظ المورد بنجاح'
            });
            
            $('#supplierModal').modal('hide');
            document.getElementById('supplierForm').reset();
            
            renderSuppliersTable();
        }
    } catch (error) {
        Swal.fire('خطأ', 'حدث خطأ أثناء حفظ المورد', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'حفظ';
    }
}

// حفظ خزينة جديدة - محسّن
async function saveSafe() {
    const name = document.getElementById('safeName').value;
    const type = document.getElementById('safeType').value;
    
    if (!name) {
        Swal.fire('خطأ', 'يرجى إدخال اسم الخزينة', 'error');
        return;
    }
    
    const submitBtn = document.querySelector('#safeModal .btn-primary');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>جاري الحفظ...';
    
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
            const newSafe = await response.json();
            
            // إضافة الخزينة للقائمة مباشرة
            safes.push(newSafe);
            
            // مسح Cache
            dataCache.safes.timestamp = 0;
            
            const toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
            
            toast.fire({
                icon: 'success',
                title: 'تم حفظ الخزينة بنجاح'
            });
            
            $('#safeModal').modal('hide');
            document.getElementById('safeForm').reset();
            
            renderSafesUI();
        }
    } catch (error) {
        Swal.fire('خطأ', 'حدث خطأ أثناء حفظ الخزينة', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'حفظ';
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
    document.getElementById('voucherType').focus();
}

// حذف مع تأكيد محسّن
async function deleteCustomer(id) {
    const result = await Swal.fire({
        title: 'هل أنت متأكد؟',
        text: 'سيتم حذف العميل وجميع سنداته',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، احذف',
        cancelButtonText: 'إلغاء',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
            try {
                const response = await fetch(`/api/customers/${id}`, {method: 'DELETE'});
                if (!response.ok) throw new Error('فشل الحذف');
                return response.json();
            } catch (error) {
                Swal.showValidationMessage(`خطأ: ${error}`);
            }
        },
        allowOutsideClick: () => !Swal.isLoading()
    });
    
    if (result.isConfirmed) {
        // حذف من القائمة المحلية
        customers = customers.filter(c => c.id !== id);
        dataCache.customers.timestamp = 0;
        
        renderCustomersTable();
        
        const toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
        
        toast.fire({
            icon: 'success',
            title: 'تم حذف العميل بنجاح'
        });
    }
}

// عرض كشف حساب العميل
async function viewCustomerStatement(id) {
    const { value: formValues } = await Swal.fire({
        title: 'كشف حساب العميل',
        html:
            '<label>من تاريخ:</label>' +
            '<input id="swal-input1" type="date" class="swal2-input" value="' + new Date().getFullYear() + '-01-01">' +
            '<label>إلى تاريخ:</label>' +
            '<input id="swal-input2" type="date" class="swal2-input" value="' + new Date().toISOString().split('T')[0] + '">',
        focusConfirm: false,
        showLoaderOnConfirm: true,
        preConfirm: async () => {
            const dateFrom = document.getElementById('swal-input1').value;
            const dateTo = document.getElementById('swal-input2').value;
            
            try {
                const response = await fetch(`/api/reports/customer/${id}?date_from=${dateFrom}&date_to=${dateTo}`);
                if (!response.ok) throw new Error('فشل جلب البيانات');
                return response.json();
            } catch (error) {
                Swal.showValidationMessage(`خطأ: ${error}`);
            }
        }
    });
    
    if (formValues) {
        const data = formValues;
        
        let html = `
            <div class="text-end">
                <h5>كشف حساب: ${data.customer.name}</h5>
                <p>الرصيد السابق: ${formatMoney(data.previous_balance)}</p>
                <div style="max-height: 400px; overflow-y: auto;">
                    <table class="table table-sm">
                        <thead style="position: sticky; top: 0; background: white;">
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
                </div>
                <p class="mt-3"><strong>الرصيد الحالي: ${formatMoney(data.current_balance)}</strong></p>
            </div>
        `;
        
        Swal.fire({
            title: 'كشف الحساب',
            html: html,
            width: '80%',
            showCloseButton: true,
            confirmButtonText: 'طباعة',
            showCancelButton: true,
            cancelButtonText: 'إغلاق'
        }).then((result) => {
            if (result.isConfirmed) {
                window.print();
            }
        });
    }
}

// إضافة CSS للتأثيرات الحركية
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    .spinner-border-sm {
        width: 1rem;
        height: 1rem;
        border-width: 0.2em;
    }
    
    tr {
        transition: background-color 0.3s ease;
    }
    
    tr:hover {
        background-color: rgba(102, 126, 234, 0.1);
    }
    
    .stat-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }
`;
document.head.appendChild(style);