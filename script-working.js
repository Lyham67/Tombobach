// ============================================
// CONFIGURATION
// ============================================

const VENDEURS = [
    'Dorian', 'Robin', 'Léopold', 'Julien/Alexandre', 'Gaël', 'Aloys',
    'Marin', 'Maxence R', 'Emerson', 'Peyo', 'Antoine', 'Vincent',
    'Mayeul', 'Thomas', 'Samuel', 'Mathieu', 'Romain', 'Timéo',
    'Jules', 'Nathanaël', 'Maxence D', 'Raphaël', 'Lyham', 'Elio',
    'Théophile', 'Autre'
];

let selectedTickets = 0;
let selectedPrice = 0;
let modal = null;

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

function openModal(tickets, price) {
    selectedTickets = tickets;
    selectedPrice = price;
    
    // Mettre à jour le résumé
    const orderSummary = document.getElementById('orderSummary');
    if (orderSummary) {
        const unitPrice = (price / tickets).toFixed(2);
        orderSummary.innerHTML = `
            <h3 style="margin-bottom: 15px;">Résumé de votre commande</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span><strong>Nombre de tickets:</strong></span>
                <span>${tickets} ticket${tickets > 1 ? 's' : ''}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span><strong>Prix unitaire:</strong></span>
                <span>${unitPrice}€</span>
            </div>
            <hr style="margin: 15px 0; border: none; border-top: 2px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; font-size: 1.3rem; font-weight: 700;">
                <span>Total:</span>
                <span style="color: #667eea;">${price.toFixed(2)}€</span>
            </div>
        `;
    }
    
    // Afficher le modal
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function initVendeurs() {
    const vendeurInput = document.getElementById('vendeur');
    if (!vendeurInput) return;
    
    let datalist = document.getElementById('vendeurs-list');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'vendeurs-list';
        document.body.appendChild(datalist);
        vendeurInput.setAttribute('list', 'vendeurs-list');
    }
    
    datalist.innerHTML = '';
    VENDEURS.forEach(vendeur => {
        const option = document.createElement('option');
        option.value = vendeur;
        datalist.appendChild(option);
    });
}

function savePayment(data) {
    try {
        let payments = JSON.parse(localStorage.getItem('tombobach_payments') || '[]');
        payments.push({
            ...data,
            id: Date.now(),
            date: new Date().toISOString()
        });
        localStorage.setItem('tombobach_payments', JSON.stringify(payments));
        console.log('✅ Paiement sauvegardé');
    } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
    }
}

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation...');
    
    // Récupérer les éléments
    modal = document.getElementById('paymentModal');
    const closeBtn = document.querySelector('.close');
    const paymentForm = document.getElementById('payment-form');
    
    console.log('Modal trouvé:', !!modal);
    console.log('Formulaire trouvé:', !!paymentForm);
    
    // Initialiser les vendeurs
    initVendeurs();
    
    // Fermeture du modal
    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }
    
    window.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };
    
    // Gestionnaires des boutons de tickets
    const ticketButtons = document.querySelectorAll('.ticket-button');
    console.log(`📊 ${ticketButtons.length} boutons trouvés`);
    
    ticketButtons.forEach((button, index) => {
        button.onclick = function(e) {
            e.preventDefault();
            console.log(`🎫 Clic sur bouton ${index + 1}`);
            
            const card = this.closest('.ticket-card');
            if (!card) {
                console.error('❌ Carte non trouvée');
                return;
            }
            
            const tickets = parseInt(card.dataset.tickets);
            const price = parseFloat(card.dataset.price);
            
            console.log(`✅ ${tickets} tickets pour ${price}€`);
            openModal(tickets, price);
        };
    });
    
    // Soumission du formulaire
    if (paymentForm) {
        paymentForm.onsubmit = function(e) {
            e.preventDefault();
            
            const formData = new FormData(paymentForm);
            const data = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                vendeur: formData.get('vendeur') || 'Autre',
                tickets: selectedTickets,
                amount: selectedPrice
            };
            
            console.log('📝 Données:', data);
            
            // Sauvegarder
            savePayment(data);
            
            // Confirmation
            alert(`✅ Merci ! ${data.tickets} ticket(s) pour ${data.amount}€`);
            
            // Fermer et réinitialiser
            closeModal();
            paymentForm.reset();
        };
    }
    
    console.log('✅ Initialisation terminée');
});
