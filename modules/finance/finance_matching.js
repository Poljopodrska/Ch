// Finance Document Matching Module
// Matches ININ Goods Receipts with CSB Invoices via Delivery Note Numbers

const FinanceMatching = {
    ininDocuments: {},
    csbInvoices: {},
    matchedDocuments: [],
    unmatchedININ: [],
    unmatchedInvoices: [],
    
    init() {
        console.log('Finance Matching Module initialized');
        this.render();
    },
    
    render() {
        const container = document.getElementById('finance-overview-content');
        if (!container) return;
        
        container.innerHTML = `
            <div class="finance-matching-container">
                <div class="matching-header">
                    <h1>[Chart] Invoice & Goods Receipt Matching System</h1>
                    <p class="subtitle">Welcome Marina! Match ININ goods receipts with CSB invoices</p>
                    <div style="background: #fff3cd; color: #856404; padding: 12px; border-radius: 5px; margin-top: 15px; border: 1px solid #ffeeba;">
                        <strong>[Info] Important:</strong> ININ contains only <strong>retail shop</strong> deliveries. CSB contains <strong>ALL</strong> company invoices (factory + retail).<br>
                        Unmatched CSB invoices may be factory purchases that don't appear in ININ.
                    </div>
                </div>
                
                <div class="upload-section">
                    <div class="upload-card">
                        <div class="card-header inin-header">
                            <h3>🏬 ININ System (Retail Shops)</h3>
                            <span class="system-badge">Shop Goods Receipts</span>
                        </div>
                        <div class="card-body">
                            <p>Upload ININ goods receiving documents from retail shops (.txt files)</p>
                            <input type="file" id="inin-upload" multiple accept=".txt" />
                            <div id="inin-status" class="upload-status"></div>
                        </div>
                    </div>
                    
                    <div class="upload-card">
                        <div class="card-header csb-header">
                            <h3>[Factory] CSB System (All Company)</h3>
                            <span class="system-badge">All Invoices (Factory + Retail)</span>
                        </div>
                        <div class="card-body">
                            <p>Upload CSB invoice files - includes both factory and retail (.xml files)</p>
                            <input type="file" id="csb-upload" multiple accept=".xml" />
                            <div id="csb-status" class="upload-status"></div>
                        </div>
                    </div>
                </div>
                
                <div class="action-section">
                    <button id="match-button" class="btn-primary" disabled>
                        [Refresh] Match Documents
                    </button>
                    <button id="clear-button" class="btn-secondary">
                        🗑️ Clear All
                    </button>
                </div>
                
                <div id="results-section" class="results-section" style="display: none;">
                    <div class="results-header">
                        <h2>[Clipboard] Matching Results</h2>
                        <div id="suspicious-warning" style="display: none; background: #ffebee; color: var(--ch-error); padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #ef5350;">
                            <strong>[!] Warning: Suspicious Matches Detected!</strong>
                            <div id="suspicious-details"></div>
                        </div>
                        <div class="summary-stats">
                            <div class="stat-card success">
                                <span class="stat-number" id="matched-count">0</span>
                                <span class="stat-label">Matched Retail</span>
                            </div>
                            <div class="stat-card warning">
                                <span class="stat-number" id="unmatched-inin">0</span>
                                <span class="stat-label">Unmatched ININ</span>
                            </div>
                            <div class="stat-card danger">
                                <span class="stat-number" id="unmatched-inv">0</span>
                                <span class="stat-label">Unmatched CSB</span>
                                <span style="font-size: 10px; opacity: 0.8;">(incl. factory)</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="tabs">
                        <button class="tab-btn active" data-tab="matched">[OK] Matched Documents</button>
                        <button class="tab-btn" data-tab="unmatched-inin">[!] Unmatched ININ</button>
                        <button class="tab-btn" data-tab="unmatched-invoices">[Factory] Unmatched Invoices (Factory+Retail)</button>
                        <button class="tab-btn" data-tab="all-inin">[Box] All ININ Data</button>
                        <button class="tab-btn" data-tab="all-csb">[Card] All CSB Data</button>
                    </div>
                    
                    <div id="matched-tab" class="tab-content active">
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Delivery Note</th>
                                    <th>Goods Receipt</th>
                                    <th>ININ Date</th>
                                    <th>Supplier Code</th>
                                    <th>ININ Amount (€)</th>
                                    <th>Invoice #</th>
                                    <th>Invoice Date</th>
                                    <th>Supplier Name</th>
                                    <th>Amount inc. VAT (€)</th>
                                    <th>VAT (€)</th>
                                    <th>Amount w/o VAT (€)</th>
                                    <th>Invoice Approval 1</th>
                                    <th>Invoice Approval 2</th>
                                    <th>Category</th>
                                </tr>
                            </thead>
                            <tbody id="matched-tbody">
                                <!-- Matched rows will be inserted here -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div id="unmatched-inin-tab" class="tab-content">
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Goods Receipt</th>
                                    <th>Delivery Note</th>
                                    <th>Date</th>
                                    <th>Supplier Code</th>
                                    <th>Items</th>
                                </tr>
                            </thead>
                            <tbody id="unmatched-inin-tbody">
                                <!-- Unmatched ININ rows -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div id="unmatched-invoices-tab" class="tab-content">
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Date</th>
                                    <th>Supplier</th>
                                    <th>Amount (€)</th>
                                    <th>Reference</th>
                                </tr>
                            </thead>
                            <tbody id="unmatched-inv-tbody">
                                <!-- Unmatched invoice rows -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div id="all-inin-tab" class="tab-content">
                        <h3>[Box] All ININ Goods Receipts</h3>
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>File Name</th>
                                    <th>Goods Receipt</th>
                                    <th>Delivery Note</th>
                                    <th>Date</th>
                                    <th>Supplier Code</th>
                                    <th>Items Count</th>
                                    <th>First Items</th>
                                </tr>
                            </thead>
                            <tbody id="all-inin-tbody">
                                <!-- All ININ rows -->
                            </tbody>
                        </table>
                        <p style="margin-top: 10px; color: #666; font-size: 14px;">
                            <strong>Note:</strong> ININ only contains retail shop deliveries
                        </p>
                    </div>
                    
                    <div id="all-csb-tab" class="tab-content">
                        <h3>[Card] All CSB Invoices (Factory + Retail)</h3>
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>File Name</th>
                                    <th>Invoice #</th>
                                    <th>Date</th>
                                    <th>Supplier</th>
                                    <th>Amount (€)</th>
                                    <th>Found Delivery Notes</th>
                                    <th>XML Preview</th>
                                </tr>
                            </thead>
                            <tbody id="all-csb-tbody">
                                <!-- All CSB rows -->
                            </tbody>
                        </table>
                        <p style="margin-top: 10px; color: #666; font-size: 14px;">
                            <strong>Note:</strong> CSB contains ALL company invoices. Only those with matching ININ delivery notes are retail.
                        </p>
                    </div>
                    
                    <div class="export-section">
                        <button id="export-csv" class="btn-export">
                            [Download] Export to CSV
                        </button>
                        <button id="export-json" class="btn-export">
                            [Doc] Export to JSON
                        </button>
                    </div>
                </div>
            </div>
            
            <style>
                .finance-matching-container {
                    padding: 30px;
                    max-width: 1400px;
                    margin: 0 auto;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .matching-header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding: 30px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
                }
                
                .matching-header h1 {
                    margin: 0 0 10px 0;
                    font-size: 32px;
                    font-weight: 600;
                }
                
                .subtitle {
                    font-size: 18px;
                    opacity: 0.95;
                }
                
                .upload-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-bottom: 30px;
                }
                
                .upload-card {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                
                .card-header {
                    padding: 20px;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .inin-header {
                    background: linear-gradient(135deg, #00c896 0%, #00a676 100%);
                }
                
                .csb-header {
                    background: linear-gradient(135deg, #fc6076 0%, #ff9a44 100%);
                }
                
                .system-badge {
                    background: rgba(255,255,255,0.2);
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                }
                
                .card-body {
                    padding: 25px;
                }
                
                .card-body p {
                    margin-bottom: 20px;
                    color: #666;
                }
                
                input[type="file"] {
                    width: 100%;
                    padding: 12px;
                    border: 2px dashed #ddd;
                    border-radius: 8px;
                    background: var(--ch-gray-100);
                    cursor: pointer;
                }
                
                input[type="file"]:hover {
                    border-color: var(--ch-primary);
                    background: #f5f6ff;
                }
                
                .upload-status {
                    margin-top: 15px;
                    font-size: 14px;
                    color: #666;
                }
                
                .action-section {
                    text-align: center;
                    margin: 40px 0;
                }
                
                .btn-primary, .btn-secondary {
                    padding: 14px 32px;
                    font-size: 16px;
                    font-weight: 600;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    margin: 0 10px;
                    transition: all 0.3s;
                }
                
                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                
                .btn-primary:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
                }
                
                .btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .btn-secondary {
                    background: var(--ch-gray-200);
                    color: #333;
                }
                
                .btn-secondary:hover {
                    background: var(--ch-gray-200);
                }
                
                .results-section {
                    margin-top: 40px;
                }
                
                .results-header {
                    margin-bottom: 30px;
                }
                
                .results-header h2 {
                    font-size: 24px;
                    color: #333;
                    margin-bottom: 20px;
                }
                
                .summary-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                }
                
                .stat-card {
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                    color: white;
                }
                
                .stat-card.success {
                    background: linear-gradient(135deg, #00c896 0%, #00a676 100%);
                }
                
                .stat-card.warning {
                    background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%);
                }
                
                .stat-card.danger {
                    background: linear-gradient(135deg, #ef5350 0%, #e53935 100%);
                }
                
                .stat-number {
                    display: block;
                    font-size: 36px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                .stat-label {
                    font-size: 14px;
                    opacity: 0.95;
                }
                
                .tabs {
                    display: flex;
                    gap: 10px;
                    margin: 30px 0 20px;
                    border-bottom: 2px solid #e0e0e0;
                }
                
                .tab-btn {
                    padding: 12px 24px;
                    background: transparent;
                    border: none;
                    border-bottom: 3px solid transparent;
                    color: #666;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .tab-btn:hover {
                    color: var(--ch-primary);
                }
                
                .tab-btn.active {
                    color: var(--ch-primary);
                    border-bottom-color: var(--ch-primary);
                }
                
                .tab-content {
                    display: none;
                }
                
                .tab-content.active {
                    display: block;
                }
                
                .results-table {
                    width: 100%;
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                
                .results-table thead {
                    background: var(--ch-gray-100);
                }
                
                .results-table th {
                    padding: 15px;
                    text-align: left;
                    font-weight: 600;
                    color: #333;
                    border-bottom: 2px solid #e0e0e0;
                    font-size: 14px;
                }
                
                .results-table td {
                    padding: 12px 15px;
                    border-bottom: 1px solid #f0f0f0;
                    font-size: 14px;
                }
                
                .results-table tbody tr:hover {
                    background: #f8f9ff;
                }
                
                .status-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                }
                
                .status-matched {
                    background: #e8f5e9;
                    color: var(--ch-success);
                }
                
                .export-section {
                    margin-top: 30px;
                    text-align: center;
                }
                
                .btn-export {
                    padding: 10px 20px;
                    margin: 0 10px;
                    background: white;
                    border: 2px solid #667eea;
                    color: var(--ch-primary);
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .btn-export:hover {
                    background: var(--ch-primary);
                    color: white;
                }
            </style>
        `;
        
        this.attachEventListeners();
    },
    
    attachEventListeners() {
        // ININ file upload
        const ininUpload = document.getElementById('inin-upload');
        if (ininUpload) {
            ininUpload.addEventListener('change', (e) => this.handleININUpload(e));
        }
        
        // CSB file upload
        const csbUpload = document.getElementById('csb-upload');
        if (csbUpload) {
            csbUpload.addEventListener('change', (e) => this.handleCSBUpload(e));
        }
        
        // Match button
        const matchBtn = document.getElementById('match-button');
        if (matchBtn) {
            matchBtn.addEventListener('click', () => this.performMatching());
        }
        
        // Clear button
        const clearBtn = document.getElementById('clear-button');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAll());
        }
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Export buttons
        const exportCSV = document.getElementById('export-csv');
        if (exportCSV) {
            exportCSV.addEventListener('click', () => this.exportToCSV());
        }
        
        const exportJSON = document.getElementById('export-json');
        if (exportJSON) {
            exportJSON.addEventListener('click', () => this.exportToJSON());
        }
    },
    
    handleININUpload(event) {
        const files = event.target.files;
        let processedCount = 0;
        
        this.ininDocuments = {};
        
        for (let file of files) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const lines = content.split('\n');
                
                if (lines.length > 0) {
                    const docLine = lines[0].trim();
                    const parts = docLine.split(';');
                    
                    if (parts.length >= 5) {
                        const goodsReceipt = parts[4];
                        const deliveryNote = parts[2];
                        
                        this.ininDocuments[goodsReceipt] = {
                            fileName: file.name,
                            supplierCode: parts[1],
                            deliveryNote: deliveryNote,
                            date: this.formatDate(parts[3]),
                            goodsReceipt: goodsReceipt,
                            items: []
                        };
                        
                        // Parse items
                        for (let i = 1; i < lines.length; i++) {
                            if (lines[i].trim().startsWith('ITM1')) {
                                const itemParts = lines[i].trim().split(';');
                                this.ininDocuments[goodsReceipt].items.push({
                                    itemCode: itemParts[1],
                                    quantity: itemParts[3]
                                });
                            }
                        }
                    }
                }
                
                processedCount++;
                if (processedCount === files.length) {
                    this.updateININStatus(processedCount);
                }
            };
            reader.readAsText(file);
        }
    },
    
    handleCSBUpload(event) {
        const files = event.target.files;
        let processedCount = 0;
        
        this.csbInvoices = {};
        
        for (let file of files) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const invoiceNum = file.name.replace('_1.xml', '').replace('.xml', '');
                
                // Parse XML content using regex
                const invoice = {
                    fileName: file.name,
                    invoiceNumber: invoiceNum,
                    deliveryNotes: [],
                    supplierName: '',
                    amount: '',
                    date: '',
                    xmlContent: content // Store full content for later matching
                };
                
                // Extract invoice number from XML
                const invNumMatch = content.match(/<StevilkaRacuna>([^<]+)<\/StevilkaRacuna>/);
                if (invNumMatch) invoice.invoiceNumberXML = invNumMatch[1];
                
                // Extract supplier - try both formats
                let supplierMatch = content.match(/<NazivPartnerja1>([^<]+)<\/NazivPartnerja1>/);
                if (supplierMatch) {
                    invoice.supplierName = supplierMatch[1];
                } else {
                    // Try eSLOG format - look for supplier
                    // For P-series files, just extract the first D_3036 which contains the supplier name
                    supplierMatch = content.match(/<D_3036>([^<]+)<\/D_3036>/);
                    if (supplierMatch) invoice.supplierName = supplierMatch[1];
                }
                
                // Extract amounts - try multiple patterns for different XML formats
                // Format 1: IzdaniRacunEnostavni (38xxx series)
                
                // Extract total amount (with VAT) - VrstaZneska=9 or 86
                let totalMatch = content.match(/<VrstaZneska>(?:9|86)<\/VrstaZneska>\s*<ZnesekRacuna>([^<]+)<\/ZnesekRacuna>/);
                if (totalMatch) {
                    invoice.amount = parseFloat(totalMatch[1].replace(',', '.'));
                }
                
                // Extract base amount (without VAT) - VrstaZneska=79 or 125
                let baseMatch = content.match(/<VrstaZneska>(?:79|125)<\/VrstaZneska>\s*<ZnesekRacuna>([^<]+)<\/ZnesekRacuna>/);
                if (baseMatch) {
                    invoice.amountBase = parseFloat(baseMatch[1].replace(',', '.'));
                }
                
                // Extract VAT amount - ZnesekDavka with VrstaZneskaDavka=124
                let vatMatch = content.match(/<VrstaZneskaDavka>124<\/VrstaZneskaDavka>\s*<ZnesekDavka>([^<]+)<\/ZnesekDavka>/);
                if (vatMatch) {
                    invoice.vatAmount = parseFloat(vatMatch[1].replace(',', '.'));
                }
                
                // If not found, try the eSLOG 2.00 format (P-series)
                if (!invoice.amount) {
                    // Extract all D_5004 values and find the one that looks like a total
                    const allAmounts = content.match(/<D_5004>([0-9]+\.?[0-9]*)<\/D_5004>/g);
                    if (allAmounts && allAmounts.length > 0) {
                        // Extract the numeric value from the last match (usually the total)
                        const lastAmount = allAmounts[allAmounts.length - 1];
                        const amountMatch = lastAmount.match(/>([0-9]+\.?[0-9]*)</);
                        if (amountMatch) {
                            invoice.amount = parseFloat(amountMatch[1].replace(',', '.'));
                        }
                    }
                }
                
                // Extract date - try both formats
                let dateMatch = content.match(/<DatumRacuna>([^<]+)<\/DatumRacuna>/);
                if (dateMatch) {
                    invoice.date = dateMatch[1].substring(0, 10);
                } else {
                    // Try eSLOG format - look for dates
                    // Find all D_2380 fields and look for one with date format
                    const allDates = content.match(/<D_2380>([^<]+)<\/D_2380>/g);
                    if (allDates && allDates.length > 0) {
                        // Look for first date that matches date format (YYYY-MM-DD or YYYYMMDD)
                        for (let dateStr of allDates) {
                            const match = dateStr.match(/>([0-9]{4}[-]?[0-9]{2}[-]?[0-9]{2})</);
                            if (match) {
                                invoice.date = match[1].substring(0, 10);
                                break;
                            }
                        }
                    }
                }
                
                this.csbInvoices[invoiceNum] = invoice;
                
                processedCount++;
                if (processedCount === files.length) {
                    this.updateCSBStatus(processedCount);
                }
            };
            reader.readAsText(file);
        }
    },
    
    updateININStatus(count) {
        const status = document.getElementById('inin-status');
        status.innerHTML = `[OK] Loaded ${count} ININ documents (${Object.keys(this.ininDocuments).length} goods receipts)`;
        this.checkReadyToMatch();
    },
    
    updateCSBStatus(count) {
        const status = document.getElementById('csb-status');
        status.innerHTML = `[OK] Loaded ${count} invoice files`;
        this.checkReadyToMatch();
    },
    
    checkReadyToMatch() {
        const matchBtn = document.getElementById('match-button');
        if (Object.keys(this.ininDocuments).length > 0 && Object.keys(this.csbInvoices).length > 0) {
            matchBtn.disabled = false;
        }
    },
    
    performMatching() {
        this.matchedDocuments = [];
        this.unmatchedININ = [];
        this.unmatchedInvoices = [];
        
        console.log('Starting matching process...');
        console.log('ININ documents (retail shops only):', Object.keys(this.ininDocuments).length);
        console.log('CSB invoices (entire company):', Object.keys(this.csbInvoices).length);
        
        // Create a map of delivery notes to goods receipts
        const deliveryNoteMap = {};
        const ininDeliveryNotes = new Set();
        for (let gr in this.ininDocuments) {
            const doc = this.ininDocuments[gr];
            deliveryNoteMap[doc.deliveryNote] = gr;
            ininDeliveryNotes.add(doc.deliveryNote);
        }
        
        console.log('Unique delivery notes from retail shops:', ininDeliveryNotes.size);
        
        // Match invoices with ININ documents
        // Important: ININ only has retail shop deliveries
        const matchedININ = new Set();
        let retailInvoiceCount = 0;
        let checkedInvoices = 0;
        
        for (let invNum in this.csbInvoices) {
            const invoice = this.csbInvoices[invNum];
            checkedInvoices++;
            
            // Search for ININ delivery notes in the entire invoice XML content
            invoice.deliveryNotes = [];
            if (invoice.xmlContent) {
                // Check each ININ delivery note against this invoice
                for (let deliveryNote of ininDeliveryNotes) {
                    // Search for exact match anywhere in XML
                    if (invoice.xmlContent.includes(deliveryNote)) {
                        invoice.deliveryNotes.push(deliveryNote);
                        console.log(`Found retail delivery note "${deliveryNote}" in invoice ${invNum}`);
                    }
                }
                
                // Also check specific XML fields that might contain delivery notes
                // For P-series: check RFF segments
                const rffMatches = invoice.xmlContent.match(/<D_1154>([^<]+)<\/D_1154>/g);
                if (rffMatches) {
                    for (let match of rffMatches) {
                        const value = match.replace(/<[^>]+>/g, '');
                        if (ininDeliveryNotes.has(value) && !invoice.deliveryNotes.includes(value)) {
                            invoice.deliveryNotes.push(value);
                            console.log(`Found retail delivery note "${value}" in RFF field`);
                        }
                    }
                }
                
                // For 38xxx series: check reference documents
                const refDocMatches = invoice.xmlContent.match(/<StevilkaDokumenta>([^<]+)<\/StevilkaDokumenta>/g);
                if (refDocMatches) {
                    for (let match of refDocMatches) {
                        const value = match.replace(/<[^>]+>/g, '');
                        if (ininDeliveryNotes.has(value) && !invoice.deliveryNotes.includes(value)) {
                            invoice.deliveryNotes.push(value);
                            console.log(`Found retail delivery note "${value}" in reference document`);
                        }
                    }
                }
            }
            
            if (invoice.deliveryNotes.length > 0) {
                // This is a RETAIL invoice (matches ININ delivery notes)
                retailInvoiceCount++;
                
                for (let dn of invoice.deliveryNotes) {
                    const goodsReceipt = deliveryNoteMap[dn];
                    if (goodsReceipt) {
                        const ininDoc = this.ininDocuments[goodsReceipt];
                        matchedININ.add(goodsReceipt);
                        
                        this.matchedDocuments.push({
                            deliveryNote: dn,
                            goodsReceipt: goodsReceipt,
                            ininDate: ininDoc.date,
                            supplierCode: ininDoc.supplierCode,
                            invoiceNumber: invoice.invoiceNumberXML || invNum,
                            invoiceDate: invoice.date,
                            supplierName: invoice.supplierName,
                            amount: invoice.amount,
                            amountBase: invoice.amountBase,
                            vatAmount: invoice.vatAmount,
                            category: 'RETAIL SHOP' // Mark as retail
                        });
                    }
                }
            } else {
                // This is either:
                // 1. A FACTORY invoice (most likely)
                // 2. A retail invoice where delivery note isn't in XML
                this.unmatchedInvoices.push(invoice);
            }
        }
        
        // VALIDATION: Check for suspicious matches (delivery note in multiple invoices)
        const deliveryNoteInvoiceCount = {};
        const suspiciousMatches = [];
        
        // Count how many invoices each delivery note appears in
        for (let invNum in this.csbInvoices) {
            const invoice = this.csbInvoices[invNum];
            if (invoice.deliveryNotes) {
                for (let dn of invoice.deliveryNotes) {
                    if (!deliveryNoteInvoiceCount[dn]) {
                        deliveryNoteInvoiceCount[dn] = [];
                    }
                    deliveryNoteInvoiceCount[dn].push(invNum);
                }
            }
        }
        
        // Identify suspicious delivery notes (appear in multiple invoices)
        for (let dn in deliveryNoteInvoiceCount) {
            if (deliveryNoteInvoiceCount[dn].length > 1) {
                suspiciousMatches.push({
                    deliveryNote: dn,
                    invoiceCount: deliveryNoteInvoiceCount[dn].length,
                    invoices: deliveryNoteInvoiceCount[dn]
                });
                console.warn(`[!] SUSPICIOUS: Delivery note "${dn}" appears in ${deliveryNoteInvoiceCount[dn].length} invoices!`);
            }
        }
        
        // Filter out suspicious matches from results
        if (suspiciousMatches.length > 0) {
            const suspiciousDNs = new Set(suspiciousMatches.map(s => s.deliveryNote));
            const originalCount = this.matchedDocuments.length;
            
            // Remove suspicious matches
            this.matchedDocuments = this.matchedDocuments.filter(match => {
                if (suspiciousDNs.has(match.deliveryNote)) {
                    console.log(`Removing suspicious match: ${match.deliveryNote}`);
                    return false;
                }
                return true;
            });
            
            const removedCount = originalCount - this.matchedDocuments.length;
            console.log(`\n[Search] Removed ${removedCount} suspicious matches (delivery notes appearing in multiple invoices)`);
            
            // Store suspicious matches for display
            this.suspiciousMatches = suspiciousMatches;
        }
        
        // Find unmatched ININ documents
        const matchedDeliveryNotes = new Set(this.matchedDocuments.map(m => m.deliveryNote));
        for (let gr in this.ininDocuments) {
            const doc = this.ininDocuments[gr];
            if (!matchedDeliveryNotes.has(doc.deliveryNote)) {
                this.unmatchedININ.push(doc);
            }
        }
        
        // Validate VAT data in matched documents
        let vatErrors = 0;
        let vatMismatches = 0;
        this.matchedDocuments.forEach(match => {
            if (match.vatAmount === undefined || match.amountBase === undefined) {
                vatErrors++;
            } else if (match.amount > 0) {
                const calculated = match.amountBase + match.vatAmount;
                const diff = Math.abs(calculated - match.amount);
                if (diff > 0.02) {
                    vatMismatches++;
                }
            }
        });
        
        console.log(`\nMatching complete:`);
        console.log(`- Checked ${checkedInvoices} invoices`);
        console.log(`- Found ${retailInvoiceCount} retail invoices (have ININ delivery notes)`);
        console.log(`- ${this.unmatchedInvoices.length} unmatched invoices (likely factory purchases)`);
        console.log(`- VALID matches: ${this.matchedDocuments.length} (after filtering suspicious)`);
        console.log(`- Suspicious matches removed: ${this.suspiciousMatches ? this.suspiciousMatches.length : 0}`);
        console.log(`- ${this.unmatchedININ.length} unmatched ININ receipts`);
        if (vatErrors > 0) console.log(`- [!] VAT ERRORS: ${vatErrors} documents missing VAT data`);
        if (vatMismatches > 0) console.log(`- [!] VAT MISMATCHES: ${vatMismatches} documents where VAT + base ≠ total`);
        
        this.displayResults();
    },
    
    displayResults() {
        // Show results section
        document.getElementById('results-section').style.display = 'block';
        
        // Check for VAT issues
        let vatErrors = 0;
        let vatMismatches = 0;
        this.matchedDocuments.forEach(match => {
            if (match.vatAmount === undefined || match.amountBase === undefined) {
                vatErrors++;
            } else if (match.amount > 0) {
                const calculated = match.amountBase + match.vatAmount;
                const diff = Math.abs(calculated - match.amount);
                if (diff > 0.02) {
                    vatMismatches++;
                }
            }
        });
        
        // Show suspicious matches warning if any
        if (this.suspiciousMatches && this.suspiciousMatches.length > 0) {
            const warningDiv = document.getElementById('suspicious-warning');
            const detailsDiv = document.getElementById('suspicious-details');
            
            warningDiv.style.display = 'block';
            
            let warningHTML = '<ul style="margin-top: 10px;">';
            for (let suspicious of this.suspiciousMatches.slice(0, 5)) {
                warningHTML += `<li>Delivery note <strong>"${suspicious.deliveryNote}"</strong> appears in ${suspicious.invoiceCount} invoices - REMOVED as likely false positive</li>`;
            }
            if (this.suspiciousMatches.length > 5) {
                warningHTML += `<li>... and ${this.suspiciousMatches.length - 5} more suspicious matches</li>`;
            }
            warningHTML += '</ul>';
            
            // Add VAT warnings
            if (vatErrors > 0 || vatMismatches > 0) {
                warningHTML += '<hr style="margin: 15px 0;">';
                warningHTML += '<p style="color: red; font-weight: bold;">[!] VAT Data Issues:</p>';
                warningHTML += '<ul style="margin-top: 10px;">';
                if (vatErrors > 0) {
                    warningHTML += `<li><strong>${vatErrors} documents</strong> are missing VAT data in the XML</li>`;
                }
                if (vatMismatches > 0) {
                    warningHTML += `<li><strong>${vatMismatches} documents</strong> have VAT calculation errors (base + VAT ≠ total)</li>`;
                }
                warningHTML += '</ul>';
            }
            
            warningHTML += '<p style="margin-top: 10px; font-size: 14px;">These have been filtered out. A delivery note should typically appear in only ONE invoice.</p>';
            
            detailsDiv.innerHTML = warningHTML;
        } else if (vatErrors > 0 || vatMismatches > 0) {
            // Show VAT warnings even if no suspicious matches
            const warningDiv = document.getElementById('suspicious-warning');
            const detailsDiv = document.getElementById('suspicious-details');
            
            warningDiv.style.display = 'block';
            
            let warningHTML = '<p style="color: red; font-weight: bold;">[!] VAT Data Issues:</p>';
            warningHTML += '<ul style="margin-top: 10px;">';
            if (vatErrors > 0) {
                warningHTML += `<li><strong>${vatErrors} documents</strong> are missing VAT data in the XML</li>`;
            }
            if (vatMismatches > 0) {
                warningHTML += `<li><strong>${vatMismatches} documents</strong> have VAT calculation errors (base + VAT ≠ total)</li>`;
            }
            warningHTML += '</ul>';
            
            detailsDiv.innerHTML = warningHTML;
        }
        
        // Update statistics
        document.getElementById('matched-count').textContent = this.matchedDocuments.length;
        document.getElementById('unmatched-inin').textContent = this.unmatchedININ.length;
        document.getElementById('unmatched-inv').textContent = this.unmatchedInvoices.length;
        
        // Display matched documents
        const matchedTbody = document.getElementById('matched-tbody');
        matchedTbody.innerHTML = '';
        
        this.matchedDocuments.forEach(match => {
            const row = document.createElement('tr');
            // Use actual VAT values from invoice - no fallback calculations
            const amountIncVAT = match.amount || 0;
            const vatAmount = match.vatAmount;
            const amountExclVAT = match.amountBase;
            
            // Validate that the numbers add up correctly
            let validationError = '';
            if (vatAmount === undefined || amountExclVAT === undefined) {
                validationError = '[!] Missing VAT data';
            } else if (amountIncVAT > 0) {
                const calculated = amountExclVAT + vatAmount;
                const diff = Math.abs(calculated - amountIncVAT);
                if (diff > 0.02) { // Allow 2 cents tolerance for rounding
                    validationError = `[!] VAT mismatch: ${amountExclVAT.toFixed(2)} + ${vatAmount.toFixed(2)} ≠ ${amountIncVAT.toFixed(2)}`;
                }
            }
            
            row.innerHTML = `
                <td><strong>${match.deliveryNote}</strong></td>
                <td>${match.goodsReceipt}</td>
                <td>${match.ininDate}</td>
                <td>${match.supplierCode}</td>
                <td>-</td>
                <td><strong>${match.invoiceNumber}</strong></td>
                <td>${match.invoiceDate}</td>
                <td>${match.supplierName}</td>
                <td>${amountIncVAT ? '€' + amountIncVAT.toFixed(2) : 'N/A'}</td>
                <td>${vatAmount !== undefined ? '€' + vatAmount.toFixed(2) : '<span style="color:red">ERROR</span>'}</td>
                <td>${amountExclVAT !== undefined ? '€' + amountExclVAT.toFixed(2) : '<span style="color:red">ERROR</span>'}</td>
                <td>Irena</td>
                <td>Janez</td>
                <td><span class="status-badge status-matched">${match.category || 'RETAIL'}</span>${validationError ? '<br><span style="color:red; font-size:11px">' + validationError + '</span>' : ''}</td>
            `;
            matchedTbody.appendChild(row);
        });
        
        // Display unmatched ININ
        const ininTbody = document.getElementById('unmatched-inin-tbody');
        ininTbody.innerHTML = '';
        
        this.unmatchedININ.forEach(doc => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${doc.goodsReceipt}</td>
                <td>${doc.deliveryNote}</td>
                <td>${doc.date}</td>
                <td>${doc.supplierCode}</td>
                <td>${doc.items.length} items</td>
            `;
            ininTbody.appendChild(row);
        });
        
        // Display unmatched invoices
        const invTbody = document.getElementById('unmatched-inv-tbody');
        invTbody.innerHTML = '';
        
        this.unmatchedInvoices.forEach(inv => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${inv.invoiceNumberXML || inv.invoiceNumber}</td>
                <td>${inv.date}</td>
                <td>${inv.supplierName}</td>
                <td>€${inv.amount ? inv.amount.toFixed(2) : 'N/A'}</td>
                <td>${inv.fileName}</td>
            `;
            invTbody.appendChild(row);
        });
        
        // Display ALL ININ data
        const allIninTbody = document.getElementById('all-inin-tbody');
        allIninTbody.innerHTML = '';
        
        for (let gr in this.ininDocuments) {
            const doc = this.ininDocuments[gr];
            const row = document.createElement('tr');
            const firstItems = doc.items.slice(0, 3).map(item => 
                `${item.itemCode}(${item.quantity})`
            ).join(', ');
            const moreItems = doc.items.length > 3 ? ` ... +${doc.items.length - 3} more` : '';
            
            row.innerHTML = `
                <td>${doc.fileName}</td>
                <td><strong>${doc.goodsReceipt}</strong></td>
                <td><strong style="color: #007bff;">${doc.deliveryNote}</strong></td>
                <td>${doc.date}</td>
                <td>${doc.supplierCode}</td>
                <td>${doc.items.length}</td>
                <td>${firstItems}${moreItems}</td>
            `;
            allIninTbody.appendChild(row);
        }
        
        // Display ALL CSB data
        const allCsbTbody = document.getElementById('all-csb-tbody');
        allCsbTbody.innerHTML = '';
        
        for (let invNum in this.csbInvoices) {
            const inv = this.csbInvoices[invNum];
            const row = document.createElement('tr');
            
            // Show first 100 chars of XML content for preview
            const xmlPreview = inv.xmlContent ? 
                inv.xmlContent.substring(0, 100).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '...' : 
                'No content';
            
            // Highlight delivery notes if found
            const deliveryNotes = inv.deliveryNotes && inv.deliveryNotes.length > 0 ? 
                `<strong style="color: green;">${inv.deliveryNotes.join(', ')}</strong>` : 
                '<span style="color: #999;">None found</span>';
            
            row.innerHTML = `
                <td>${inv.fileName}</td>
                <td><strong>${inv.invoiceNumberXML || inv.invoiceNumber}</strong></td>
                <td>${inv.date || 'N/A'}</td>
                <td>${inv.supplierName || 'N/A'}</td>
                <td>€${inv.amount ? inv.amount.toFixed(2) : 'N/A'}</td>
                <td>${deliveryNotes}</td>
                <td style="font-size: 10px; color: #666;">${xmlPreview}</td>
            `;
            allCsbTbody.appendChild(row);
        }
        
        // Scroll to results
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
    },
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const tabContent = document.getElementById(tabName + '-tab');
        if (tabContent) {
            tabContent.classList.add('active');
        }
    },
    
    formatDate(dateStr) {
        if (!dateStr || dateStr.length !== 8) return dateStr;
        return `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
    },
    
    clearAll() {
        this.ininDocuments = {};
        this.csbInvoices = {};
        this.matchedDocuments = [];
        this.unmatchedININ = [];
        this.unmatchedInvoices = [];
        
        document.getElementById('inin-upload').value = '';
        document.getElementById('csb-upload').value = '';
        document.getElementById('inin-status').innerHTML = '';
        document.getElementById('csb-status').innerHTML = '';
        document.getElementById('match-button').disabled = true;
        document.getElementById('results-section').style.display = 'none';
    },
    
    exportToCSV() {
        let csv = 'Delivery Note,Goods Receipt,ININ Date,Supplier Code,ININ Amount,Invoice Number,Invoice Date,Supplier Name,Amount inc. VAT,VAT,Amount w/o VAT,Invoice Approval 1,Invoice Approval 2,Status\n';
        
        this.matchedDocuments.forEach(match => {
            const amountIncVAT = match.amount || 0;
            const vatAmount = match.vatAmount;
            const amountExclVAT = match.amountBase;
            
            // Check for errors
            let status = 'Matched';
            if (vatAmount === undefined || amountExclVAT === undefined) {
                status = 'ERROR: Missing VAT data';
            } else if (amountIncVAT > 0) {
                const calculated = amountExclVAT + vatAmount;
                const diff = Math.abs(calculated - amountIncVAT);
                if (diff > 0.02) {
                    status = 'ERROR: VAT mismatch';
                }
            }
            
            csv += `"${match.deliveryNote}","${match.goodsReceipt}","${match.ininDate}","${match.supplierCode}","-",`;
            csv += `"${match.invoiceNumber}","${match.invoiceDate}","${match.supplierName}",`;
            csv += `"${amountIncVAT}","${vatAmount !== undefined ? vatAmount.toFixed(2) : 'ERROR'}","${amountExclVAT !== undefined ? amountExclVAT.toFixed(2) : 'ERROR'}","Irena","Janez","${status}"\n`;
        });
        
        this.downloadFile(csv, 'matched_documents.csv', 'text/csv');
    },
    
    exportToJSON() {
        const exportData = {
            summary: {
                totalMatched: this.matchedDocuments.length,
                totalUnmatchedININ: this.unmatchedININ.length,
                totalUnmatchedInvoices: this.unmatchedInvoices.length,
                exportDate: new Date().toISOString()
            },
            matchedDocuments: this.matchedDocuments,
            unmatchedININ: this.unmatchedININ,
            unmatchedInvoices: this.unmatchedInvoices
        };
        
        const json = JSON.stringify(exportData, null, 2);
        this.downloadFile(json, 'matching_results.json', 'application/json');
    },
    
    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// Auto-initialize when loaded
if (typeof window !== 'undefined') {
    window.FinanceMatching = FinanceMatching;
}