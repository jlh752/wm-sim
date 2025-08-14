import '../app/index.js';
import './components/bossSelect.js';
import { BossSelect } from './components/bossSelect.js';

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('boss-select')?.addEventListener('change', (event) => {
        console.log('Selected Boss:', (event.target as BossSelect).getBoss());
    });
});