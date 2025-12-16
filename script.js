const app = {
    scanner: null,
    paymentData: null,

    init: () => {
        console.log('App Initialized');
        // Check for user data
        const userData = localStorage.getItem('interUser');
        if (userData) {
            app.user = JSON.parse(userData);
            app.updateUserInfo();
        } else {
            // Show Modal
            document.getElementById('user-setup-modal').classList.remove('hidden');
        }
    },

    saveUserSetup: () => {
        const nameInput = document.getElementById('setup-name').value.trim();
        const cpfInput = document.getElementById('setup-cpf').value.trim();

        if (!nameInput || !cpfInput) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        app.user = {
            name: nameInput,
            cpf: cpfInput
        };

        localStorage.setItem('interUser', JSON.stringify(app.user));
        app.updateUserInfo();

        // Hide Modal
        document.getElementById('user-setup-modal').classList.add('hidden');
    },

    updateUserInfo: () => {
        if (!app.user) return;

        // Update Header
        // Gets first name for header
        const firstName = app.user.name.split(' ')[0];
        const headerName = document.getElementById('header-username');
        if (headerName) headerName.innerText = `Olá, ${firstName}`;

        // Any other real-time updates if needed
    },

    startScanner: () => {
        // Prevent multiple instances
        if (app.scanner) {
            return;
        }

        // Use Html5Qrcode for custom control (auto-start)
        const scannerId = "reader";
        app.scanner = new Html5Qrcode(scannerId);

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        // Start the camera automatically
        app.scanner.start(
            { facingMode: "environment" }, // Prefer back camera
            config,
            app.onScanSuccess,
            app.onScanFailure
        ).catch(err => {
            console.error("Error starting scanner", err);
            // Optional: Show a UI error message to the user
            document.getElementById('reader').innerHTML = `<p style="color:red; text-align:center; padding:20px;">Erro ao acessar câmera: ${err}</p>`;
        });
    },

    stopScanner: () => {
        if (app.scanner) {
            app.scanner.stop().then(() => {
                app.scanner.clear();
                app.scanner = null;
            }).catch(err => {
                console.error("Failed to stop scanner", err);
                // Even if stop fails, let's try to nullify to reset state if possible or handle it
                // Usually bad state, but for now just logging.
            });
        }
    },

    onScanSuccess: (decodedText, decodedResult) => {
        // Stop scanning after success
        app.stopScanner();

        console.log(`Scan result: ${decodedText}`, decodedResult);

        // Mock parsing data (In real world, parse the Pix String)
        // For this demo, we assume any QR code is valid and generate mock data
        app.paymentData = {
            amount: "50,00",
            payee: "Loja Exemplo - QR Scanned",
            date: new Date().toLocaleDateString('pt-BR')
        };

        // Update UI with data
        document.getElementById('payee-name').innerText = app.paymentData.payee;
        document.getElementById('payment-date').innerText = app.paymentData.date;

        // Navigate to details
        router.navigateTo('payment-details');
    },

    onScanFailure: (error) => {
        // handle scan failure, usually better to ignore and keep scanning.
        // console.warn(`Code scan error = ${error}`);
    },

    simulateScan: () => {
        // For testing without camera
        app.onScanSuccess("00020126580014br.gov.bcb.pix...", null);
    },

    processPayment: () => {
        // Show loader
        document.getElementById('processing-overlay').classList.remove('hidden');

        // Simulate network delay
        setTimeout(() => {
            document.getElementById('processing-overlay').classList.add('hidden');
            app.generateReceipt();
            router.navigateTo('receipt');
        }, 2000);
    },

    generateReceipt: () => {
        const now = new Date();

        // Format Date: "Quarta-feira, 10/12/2025"
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' };
        const dateString = now.toLocaleDateString('pt-BR', dateOptions);
        // JS often gives "quarta-feira" lowercase, let's Capitalize if needed, 
        // but typically 'pt-BR' locale is fine or we capitalize first letter.
        const capitalizedDate = dateString.charAt(0).toUpperCase() + dateString.slice(1);

        // Format Time: "16h48"
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}h${minutes}`;

        if (app.paymentData) {
            document.getElementById('receipt-payee').innerText = app.paymentData.payee;
        }

        document.getElementById('receipt-date-full').innerText = capitalizedDate;
        document.getElementById('receipt-time').innerText = timeString;

        // Generate random ID
        const randomId = 'E' + Date.now() + Math.floor(Math.random() * 10000000000);
        document.getElementById('receipt-id').innerText = randomId;

        // Update Payer Info from Global User Data
        if (app.user) {
            document.getElementById('receipt-payer-name').innerText = app.user.name.toUpperCase();
            document.getElementById('receipt-payer-cpf').innerText = app.user.cpf;
        }
    },

    loadExtrato: () => {
        const container = document.getElementById('transaction-list');
        container.innerHTML = ''; // Clear layout

        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        // Helper to format date header
        const formatHeaderDate = (date) => {
            const options = { weekday: 'long', day: 'numeric', month: 'long' };
            return date.toLocaleDateString('pt-BR', options);
        };

        // 1. TODAY'S GROUP
        const todayHeader = document.createElement('div');
        todayHeader.className = 'history-date-group';

        const todayTitle = document.createElement('h4');
        todayTitle.className = 'history-date-header';
        todayTitle.innerText = formatHeaderDate(now);
        todayHeader.appendChild(todayTitle);

        // LATEST TRANSACTION (Pix Enviado - Opens Receipt)
        const latestTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const latestItem = document.createElement('div');
        latestItem.className = 'transaction-item';
        latestItem.onclick = () => {
            // Setup receipt data for consistency
            app.paymentData = {
                payee: "Loja Exemplo",
                amount: "50,00",
                date: now.toLocaleDateString('pt-BR')
            };
            app.generateReceipt(); // Refresh time in receipt
            router.navigateTo('receipt');
        };
        latestItem.innerHTML = `
            <div class="transaction-icon icon-out">
                <i class="ph ph-arrow-up-right"></i>
            </div>
            <div class="transaction-info">
                <div class="t-top-row">
                    <span>Pix enviado</span>
                    <span class="amount-out">- R$ 50,00</span>
                </div>
                <div class="t-bottom-row">
                    <span>${latestItem.getAttribute('data-payee') || 'Loja Exemplo'}</span>
                    <span>${latestTime}</span>
                </div>
            </div>
        `;
        todayHeader.appendChild(latestItem);

        // Fake Transaction 2 (Today) - MUST BE BEFORE "now"
        const earlier = new Date(now);
        earlier.setHours(now.getHours() - 3); // 3 hours ago
        earlier.setMinutes(Math.floor(Math.random() * 60));
        const earlierTime = `${earlier.getHours().toString().padStart(2, '0')}:${earlier.getMinutes().toString().padStart(2, '0')}`;

        const fake2 = document.createElement('div');
        fake2.className = 'transaction-item';
        fake2.innerHTML = `
            <div class="transaction-icon icon-out">
                <i class="ph ph-shopping-cart"></i>
            </div>
            <div class="transaction-info">
                <div class="t-top-row">
                    <span>Compra no débito</span>
                    <span class="amount-out">- R$ 24,90</span>
                </div>
                <div class="t-bottom-row">
                    <span>Padaria Central</span>
                    <span>${earlierTime}</span>
                </div>
            </div>
        `;
        todayHeader.appendChild(fake2);

        container.appendChild(todayHeader);

        // 2. YESTERDAY'S GROUP
        const yersterdayHeader = document.createElement('div');
        yersterdayHeader.className = 'history-date-group';

        const yTitle = document.createElement('h4');
        yTitle.className = 'history-date-header';
        yTitle.innerText = formatHeaderDate(yesterday);
        yersterdayHeader.appendChild(yTitle);

        const fake3 = document.createElement('div');
        fake3.className = 'transaction-item';
        fake3.innerHTML = `
            <div class="transaction-icon icon-in">
                <i class="ph ph-arrow-down-left"></i>
            </div>
            <div class="transaction-info">
                <div class="t-top-row">
                    <span>Pix recebido</span>
                    <span class="amount-in">+ R$ 1.500,00</span>
                </div>
                <div class="t-bottom-row">
                    <span>Maria Silva</span>
                    <span>14:30</span>
                </div>
            </div>
        `;
        yersterdayHeader.appendChild(fake3);

        container.appendChild(yersterdayHeader);
    }
};

const router = {
    navigateTo: (screenId) => {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
            screen.classList.add('hidden');
        });

        // Show target screen
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.remove('hidden');
            // Small delay to allow display:block to apply before opacity transition
            setTimeout(() => {
                target.classList.add('active');
            }, 10);
        }

        // Specific Screen Logic
        if (screenId === 'scanner') {
            app.startScanner();
        } else if (screenId === 'extrato') {
            app.loadExtrato();
        } else {
            // Stop scanner if leaving scanner page
            if (app.scanner) {
                app.stopScanner();
            }
        }
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', app.init);
