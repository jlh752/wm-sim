import type { BossesFile, Boss } from '../../types/boss';

class BossSelect extends HTMLSelectElement {
    static elementName = 'boss-select';
    static observedAttributes = ['data-file'];

    bosses: Boss[] = [];
    constructor() {
        super();
    }

    async attributeChangedCallback(name:string, oldValue:string, newValue:string) {
        if(name === 'data-file') {
            this.bosses = await this.loadData(newValue);
            this.renderSelect();
        }
    }

    async loadData(dataFile: string | null) : Promise<Boss[]>{
        if (dataFile) {
            try{
                const response = await fetch(dataFile);
                return ((await response.json()) as BossesFile).bosses || [];
            }
            catch(error){
                console.error('Error loading data file:', error);
            }
        } else {
            console.error('No data file specified for BossSelect');
        }
        return [];
    }

    renderSelect(data:Boss[] = this.bosses) {
        this.innerHTML = '';
        for(let i = 0; i < data.length; i++) {
            const boss: Boss = data[i];
            const option = document.createElement('option');
            option.value = boss.name;
            option.textContent = boss.name;
            this.appendChild(option);
        }

        if (this.options.length > 0) {
            this.selectedIndex = 0;
        }
    }

    get boss() {
		return this.getBoss();
	}

    getBoss(name?:string): Boss | null {
        if(typeof name !== 'string') {
            name = this.value
        }
        return this.bosses.find(boss => boss.name === name) ?? null;
    }
}

export type { BossSelect };

customElements.define(BossSelect.elementName, BossSelect, { extends: 'select' });