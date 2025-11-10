// ============================================
// CONFIGURATION
// ============================================

// Configuration Stripe - Utilise la clé depuis config.js
let stripe = null;

// Initialiser Stripe
if (typeof Stripe !== 'undefined' && typeof STRIPE_CONFIG !== 'undefined') {
    stripe = Stripe(STRIPE_CONFIG.publicKey);
    console.log('✅ Stripe initialisé avec la clé:', STRIPE_CONFIG.publicKey.substring(0, 20) + '...');
} else {
    console.error('❌ Stripe.js ou STRIPE_CONFIG non chargé');
}

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
// GESTION DES IMAGES
// ============================================

function handleImageUpload(event, imgId) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image (PNG, JPG, WEBP)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.getElementById(imgId);
        if (img) {
            img.src = e.target.result;
            img.classList.add('loaded');
            // Sauvegarder dans localStorage
            localStorage.setItem(imgId, e.target.result);
            console.log('✅ Image uploadée pour', imgId);
        }
    };
    reader.readAsDataURL(file);
}

// Charger les images sauvegardées au démarrage
function loadSavedImages() {
    ['prize-img-1', 'prize-img-2', 'prize-img-3'].forEach(imgId => {
        const savedImage = localStorage.getItem(imgId);
        if (savedImage) {
            const img = document.getElementById(imgId);
            if (img) {
                img.src = savedImage;
                img.classList.add('loaded');
            }
        }
    });
}

// Sauvegarder les textes éditables
function saveEditableContent(element) {
    const id = element.id || element.className;
    const content = element.textContent || element.innerText;
    localStorage.setItem('text_' + id, content);
    console.log('💾 Texte sauvegardé pour', id);
}

// Charger les textes sauvegardés
function loadSavedTexts() {
    // Charger les titres et descriptions des 3 lots principaux
    document.querySelectorAll('.prize-title, .prize-description').forEach((element, index) => {
        const id = element.classList.contains('prize-title') ? 'prize-title-' + Math.floor(index/2) : 'prize-description-' + Math.floor(index/2);
        element.id = id;
        const savedText = localStorage.getItem('text_' + id);
        if (savedText) {
            element.textContent = savedText;
        }
        
        // Sauvegarder à chaque modification
        element.addEventListener('blur', function() {
            saveEditableContent(this);
        });
        element.addEventListener('input', function() {
            saveEditableContent(this);
        });
    });
    
    // Charger les titres des petits lots
    document.querySelectorAll('.small-prize-title').forEach((element, index) => {
        element.id = 'small-prize-title-' + index;
        const savedText = localStorage.getItem('text_small-prize-title-' + index);
        if (savedText) {
            element.textContent = savedText;
        }
        
        // Sauvegarder à chaque modification
        element.addEventListener('blur', function() {
            saveEditableContent(this);
        });
        element.addEventListener('input', function() {
            saveEditableContent(this);
        });
    });
}

// ============================================
// INITIALISATION
// ============================================

// Fonction pour calculer le prix selon le nombre de tickets
function calculateCustomPrice(tickets) {
    if (tickets === 1) {
        return 2; // 1 ticket = 2€
    } else if (tickets === 2) {
        return 3.70; // 2 tickets = 3,70€ (1,85€/ticket)
    } else if (tickets === 3) {
        return 5; // 3 tickets = 5€
    } else if (tickets === 5) {
        return 8; // 5 tickets = 8€
    } else if (tickets >= 10) {
        // À partir de 10 tickets : prix diminue de 2 centimes par ticket
        // 10 tickets = 15€ (1,50€/ticket)
        // Chaque ticket supplémentaire : -0,02€ jusqu'à minimum 1€/ticket
        const pricePerTicket = Math.max(1, 1.50 - (tickets - 10) * 0.02);
        return tickets * pricePerTicket;
    } else if (tickets >= 5) {
        // Entre 5 et 10 : interpolation linéaire de 8€ à 15€
        return 8 + (tickets - 5) * 1.4;
    } else if (tickets >= 3) {
        // Entre 3 et 5 : interpolation linéaire de 5€ à 8€
        return 5 + (tickets - 3) * 1.5;
    } else {
        // Entre 2 et 3 : interpolation linéaire de 3,70€ à 5€
        return 3.70 + (tickets - 2) * 1.30;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation...');
    
    // Réinitialiser la validation du téléphone quand l'utilisateur modifie le champ
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            // Réinitialiser le message d'erreur personnalisé
            this.setCustomValidity('');
        });
    }
    
    // Menu burger mobile
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navbarMenu = document.getElementById('navbarMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (mobileMenuToggle && navbarMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navbarMenu.classList.toggle('active');
        });
        
        // Fermer le menu quand on clique sur un lien
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenuToggle.classList.remove('active');
                navbarMenu.classList.remove('active');
            });
        });
        
        // Fermer le menu si on clique en dehors
        document.addEventListener('click', function(event) {
            if (!navbarMenu.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
                mobileMenuToggle.classList.remove('active');
                navbarMenu.classList.remove('active');
            }
        });
    }
    
    // Charger les images sauvegardées
    loadSavedImages();
    
    // Charger les textes sauvegardés
    loadSavedTexts();
    
    // Récupérer les éléments
    modal = document.getElementById('paymentModal');
    const closeBtn = document.querySelector('.close');
    const paymentForm = document.getElementById('paymentForm');
    
    console.log('Modal trouvé:', !!modal);
    console.log('Formulaire trouvé:', !!paymentForm);
    console.log('Stripe chargé:', !!stripe);
    
    // Initialiser les vendeurs
    initVendeurs();
    
    // Initialiser la formule personnalisée
    let customTickets = 1;
    const decreaseBtn = document.getElementById('decrease-btn');
    const increaseBtn = document.getElementById('increase-btn');
    const customQuantity = document.getElementById('custom-quantity');
    const customTotal = document.getElementById('custom-total');
    const customUnit = document.getElementById('custom-unit');
    const customBuyBtn = document.getElementById('custom-buy-btn');
    
    function updateCustomDisplay() {
        const total = calculateCustomPrice(customTickets);
        const unitPrice = total / customTickets;
        
        customQuantity.textContent = customTickets;
        customTotal.textContent = total.toFixed(2) + '€';
        customUnit.textContent = unitPrice.toFixed(2) + '€/ticket';
    }
    
    if (decreaseBtn) {
        decreaseBtn.onclick = function() {
            if (customTickets > 1) {
                customTickets--;
                updateCustomDisplay();
            }
        };
    }
    
    if (increaseBtn) {
        increaseBtn.onclick = function() {
            customTickets++;
            updateCustomDisplay();
        };
    }
    
    if (customBuyBtn) {
        customBuyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const total = calculateCustomPrice(customTickets);
            console.log('🎨 Formule personnalisée:', customTickets, 'tickets,', total, '€');
            openModal(customTickets, total);
        });
    }
    
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
        paymentForm.onsubmit = async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🔄 Soumission du formulaire...');
            
            const formData = new FormData(paymentForm);
            const vendeurValue = formData.get('vendeur');
            
            const data = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                vendeur: vendeurValue && vendeurValue.trim() !== '' ? vendeurValue.trim() : 'Non spécifié',
                tickets: selectedTickets,
                amount: selectedPrice
            };
            
            console.log('📝 Données du formulaire:', data);
            
            // Validation
            if (!data.firstName || !data.lastName || !data.email || !data.phone) {
                alert('Veuillez remplir tous les champs obligatoires');
                return false;
            }
            
            // Validation du numéro de téléphone
            // Vérifier d'abord s'il y a des caractères interdits (avant de nettoyer)
            if (/[+\-().]/.test(data.phone)) {
                document.getElementById('phone').setCustomValidity('Le numéro ne doit pas contenir +, -, ( ), ou . (pas de +33)');
                document.getElementById('phone').reportValidity();
                return false;
            }
            
            const phoneClean = data.phone.replace(/\s/g, ''); // Enlever les espaces
            
            // Vérifier qu'il n'y a que des chiffres
            if (!/^[0-9]+$/.test(phoneClean)) {
                document.getElementById('phone').setCustomValidity('Le numéro ne doit contenir que des chiffres');
                document.getElementById('phone').reportValidity();
                return false;
            }
            
            // Vérifier que ça commence par 0
            if (!phoneClean.startsWith('0')) {
                document.getElementById('phone').setCustomValidity('Le numéro doit commencer par 0 (pas de +33)');
                document.getElementById('phone').reportValidity();
                return false;
            }
            
            // Vérifier qu'il y a exactement 10 chiffres
            if (phoneClean.length !== 10) {
                document.getElementById('phone').setCustomValidity('Le numéro doit contenir exactement 10 chiffres');
                document.getElementById('phone').reportValidity();
                return false;
            }
            
            // Réinitialiser la validation si tout est OK
            document.getElementById('phone').setCustomValidity('');
            
            if (!selectedTickets || !selectedPrice) {
                alert('Erreur: Aucun ticket sélectionné');
                return false;
            }
            
            console.log('✅ Validation OK');
            
            // Désactiver le bouton
            const submitBtn = paymentForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Redirection vers le paiement...';
            }
            
            try {
                // Vérifier que Stripe est chargé
                if (!stripe) {
                    throw new Error('Stripe n\'est pas initialisé. Veuillez recharger la page.');
                }
                
                // Sauvegarder temporairement les données
                sessionStorage.setItem('pendingPayment', JSON.stringify(data));
                console.log('💾 Données sauvegardées dans sessionStorage');
                
                // Créer une session Stripe Checkout
                console.log('🔄 Création de la session Stripe...');
                console.log('URL:', '/create-checkout-session');
                console.log('Body:', JSON.stringify({
                    tickets: selectedTickets,
                    amount: selectedPrice,
                    customerInfo: data
                }, null, 2));
                
                const response = await fetch(`${API_URL}/create-checkout-session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        tickets: selectedTickets,
                        amount: selectedPrice,
                        customerInfo: data
                    })
                });
                
                console.log('📡 Réponse reçue, status:', response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Erreur serveur:', errorText);
                    throw new Error(`Erreur serveur: ${response.status} - ${errorText}`);
                }
                
                const session = await response.json();
                console.log('✅ Session créée:', session);
                
                if (session.error) {
                    throw new Error(session.error);
                }
                
                if (!session.id) {
                    throw new Error('Session ID manquant dans la réponse');
                }
                
                // Rediriger vers Stripe Checkout
                console.log('🚀 Redirection vers Stripe Checkout avec session ID:', session.id);
                const result = await stripe.redirectToCheckout({
                    sessionId: session.id
                });
                
                if (result.error) {
                    console.error('❌ Erreur Stripe:', result.error);
                    throw new Error(result.error.message);
                }
                
            } catch (error) {
                console.error('❌ Erreur complète:', error);
                console.error('Stack:', error.stack);
                alert(`Erreur: ${error.message}\n\nVérifiez la console pour plus de détails.`);
                
                // Réactiver le bouton
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Continuer vers le paiement';
                }
            }
            
            return false;
        };
    }
    
    console.log('✅ Initialisation terminée');
});
