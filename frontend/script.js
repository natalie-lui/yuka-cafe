//pull menu item from backend
async function loadDrinks(){
    try{
        const res = await fetch('/api/drinks');
        const drinks = await res.json();

        const menuContainer = document.querySelector('.menu');
        menuContainer.innerHTML = ''; // clear placeholder

        drinks.forEach(drink => {
            const card = document.createElement('article');
            card.className = 'menu-card';
            card.href = `customize.html?id=${drink.id}`;

            card.innerHTML = `
                <img 
                    src="${drink.image}" 
                    alt="${drink.name}"
                >
                <h3>${drink.name}</h3>
                <p>$${drink.price.toFixed(2)}</p>
            `;
            
            card.addEventListener('click', () => {
                window.location.href = `customize.html?id=${drink.id}`;
            });
            

            //change cursor when hovering over item
            card.style.cursor = 'pointer';

            menuContainer.appendChild(card);
        });
    } catch(err){
        console.error('Error loading drinks:', err);
    }   
}

window.addEventListener('DOMContentLoaded', loadDrinks);

function openModal(name, price){
    currItem = {name, price};
    document.getElementById("modal-title").textContent = name;
    document.getElementById("modal-price").textContent = `$${price.toFixed(2)}`;
    document.getElementById("modal").classList.add("active");
}

function closeModal(){
    document.getElementById("modal").classList.remove("active");
}