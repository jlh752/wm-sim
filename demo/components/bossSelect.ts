import type { BossesFile, Boss } from '../types/boss';

class BossSelect extends HTMLSelectElement {
    bosses: Boss[] = [];
    constructor() {
        super();
    }

    connectedCallback() {
        const dataFile = this.getAttribute('data-file');
        if (dataFile) {
            fetch(dataFile)
            .then(response => response.json())
            .then((data:BossesFile) => {
                this.bosses = data.bosses;
                this.renderSelect();
            })
            .catch(error => {
                console.error('Error loading data file:', error);
            });
        } else {
            console.error('No data file specified for BossSelect');
        }
    }

    renderSelect(data:Boss[] = this.bosses) {
        this.innerHTML = '';
        for(let i = 0; i < this.bosses.length; i++) {
            const boss: Boss = this.bosses[i];
            const option = document.createElement('option');
            option.value = boss.name;
            option.textContent = boss.name;
            this.appendChild(option);
        }

        if (this.options.length > 0) {
            this.selectedIndex = 0;
        }
    }

    getBoss(name?:string): Boss | null {
        if(typeof name !== 'string') {
            name = this.value
        }
        return this.bosses.find(boss => boss.name === name) ?? null;
    }
}

export type { BossSelect };

customElements.define("boss-select", BossSelect, { extends: 'select' });