// ─── Sponsors & Vendors ───────────────────────────────────────────────────────
//
// SPONSORS — fields:
//   name   — Display name shown on the card
//   level  — Sponsorship tier label, e.g. 'Flagship', 'Gold', 'Silver', 'Bronze'
//             Leave as '' to show no tier badge.
//   logo   — Path to their logo image, e.g. 'images/sponsors/acme.png'
//             Leave as '' to show an auto-generated initials badge instead.
//   url    — Their website URL (include https://). Leave as '' to omit the link.
//
// VENDORS — fields:
//   name        — Display name shown on the card
//   description — Short descriptor shown below the name, e.g. 'Food Truck', 'Softball Lessons'
//   logo        — Same as sponsors above
//   url         — Same as sponsors above
//
// Drop logo image files into the images/sponsors/ or images/vendors/ folders.
// ─────────────────────────────────────────────────────────────────────────────

const SPONSORS = [
  { name: 'Suffolk Construction', level: 'Flagship', logo: 'images/sponsors/Suffolk.png', url: 'https://suffolk.com/' },
  { name: 'Tufts University', level: 'Gold', logo: 'images/sponsors/Tufts.jpg', url: 'https://www.tufts.edu/' },
  { name: 'Boston Physical Therapy & Welness', level: 'Silver', logo: 'images/sponsors/Boston PT.jpg', url: 'https://bostonptwellness.com/' },
  { name: 'Cataldo Ambulance', level: 'Bronze', logo: 'images/sponsors/Cataldo.jpg', url: 'https://www.cataldoambulance.com' },
  { name: 'Chevalier Theater', level: 'Bronze', logo: 'images/sponsors/Chevalier.jpg', url: 'https://www.chevaliertheater.com/' },
  { name: 'Colette Bakery', level: 'Bronze', logo: 'images/sponsors/Colette.jpg', url: 'http://colettebakery.com' },
  { name: 'Intoppa Painting', level: 'Bronze', logo: 'images/sponsors/Intoppa.jpg', url: 'https://www.intoppa.com/' },
  { name: 'Pompeo & Sons Insurance', level: 'Bronze', logo: 'images/sponsors/Pompeo.jpg', url: 'https://www.pompeoinsurance.com/' },
  
];

const VENDORS = [
  { name: 'Wally\'s Waffles', description: 'Food Truck', logo: 'images/sponsors/11_AllBelgiumLogo-1289777767.jpg', url: 'https://allbelgiumwaffles.com/find-willys-waffle-trucks/boston-waffle-food-truck/' },
  { name: 'Ace of Diamonds', description: 'Softball Mini-Clinics', logo: 'images/sponsors/Ace of Diamonds.jpg', url: 'https://www.theacema.com' },
  { name: 'Kona Ice', description: 'Food Truck', logo: 'images/sponsors/Kona Ice.jpg', url: 'https://www.kona-ice.com/' },
  { name: 'Crafty Divas', description: 'Face Painting', logo: 'images/sponsors/Crafty Divas.jpg', url: 'https://www.instagram.com/craftydivasparties/' },

];

// ─── Rendering ───────────────────────────────────────────────────────────────

function renderSponsorGrid(items, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!items.length) {
    container.innerHTML = '<p class="sp-empty">Check back soon!</p>';
    return;
  }

  container.innerHTML = items.map(item => {
    const initials = item.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const logoHtml = item.logo
      ? `<img class="sp-logo" src="${item.logo}" alt="${item.name} logo" loading="lazy">`
      : `<div class="sp-logo-placeholder">${initials}</div>`;
    const levelHtml = item.level
      ? `<div class="sp-level">${item.level}</div>`
      : '';
    const descHtml = item.description
      ? `<div class="sp-description">${item.description}</div>`
      : '';
    const linkHtml = item.url
      ? `<a class="sp-link" href="${item.url}" target="_blank" rel="noopener">Visit Website →</a>`
      : '';
    return `
      <div class="sp-card">
        ${levelHtml}
        <div class="sp-logo-wrap">${logoHtml}</div>
        <div class="sp-name">${item.name}</div>
        ${descHtml}
        ${linkHtml}
      </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderSponsorGrid(SPONSORS, 'sponsors-grid');
  renderSponsorGrid(VENDORS, 'vendors-grid');
});
