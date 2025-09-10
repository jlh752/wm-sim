const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      cursor: pointer;
    }

    [part="track"] {
      width: 2em;
      height: 1em;
      box-sizing: border-box;
      display: inline-block;
      line-height: 1;
      background-color: #dddddd;
      text-align: left;
    }

    [part="slider"] {
      box-sizing: border-box;
      display: inline-block;
      line-height: 1;
      width: 50%;
      height: 100%;
      background-color: #777777;
      vertical-align: text-top;
    }

    [part="pre-label"],[part="post-label"] {
      text-decoration: none;
    }

    [part="track"], [part="slider"] {
      transition: all 200ms;
    }

    :host([checked]) [part="slider"] {
      transform: translateX(100%);
    }

    :host(:not([checked])) [part="pre-label"] {
      text-decoration: underline;
    }
      :host([checked]) [part="post-label"] {
      text-decoration: underline;
    }
  </style>
  <span part="pre-label"></span>
  <span part="track">
    <span part="slider"></span>
  </span>
  <span part="post-label"></span>
`;

export class ToggleSwitch extends HTMLElement {
    static elementName = 'toggle-switch';
    static observedAttributes = ['checked', 'pre-label', 'post-label'];
    static formAssociated = true;
    private _internals: ElementInternals;

    constructor() {
        super();
        this._internals = this.attachInternals();
        this.attachShadow({ mode: 'open' })
            .appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        this.setAttribute('role', 'switch');
        this.setAttribute('tabindex', '0');
        this.addEventListener('click', this.toggle);
        this._internals.setFormValue(this.checked ? "on" : null);
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.toggle);
    }

    attributeChangedCallback(name:string, oldValue:string, newValue:string) {
        switch (name) {
            case 'checked':
                this.setAttribute('aria-checked', this.checked.toString());
                this._updateFormValue();
                this.dispatchEvent(new CustomEvent('toggle-switch:change', {
                    detail: {
                        checked: this.checked
                    }
                }));
                break;
            case 'pre-label':
                const preLabel = this.shadowRoot?.querySelector('[part="pre-label"]');
                if (preLabel) {
                    preLabel.textContent = newValue;
                }
                break;
            case 'post-label':
                const postLabel = this.shadowRoot?.querySelector('[part="post-label"]');
                if (postLabel) {
                    postLabel.textContent = newValue;
                }
                break;
        }
    }

    get checked() {
        return this.hasAttribute('checked');
    }
    set checked(value) {
        this.toggleAttribute('checked', value);
    }

    toggle = () => {
        this.checked = !this.checked;
    }

    _updateFormValue() {
        this._internals.setFormValue(this.checked ? "on" : null);
    }

    formDisabledCallback(disabled:boolean) {
        if (disabled) {
            this.setAttribute('disabled', '');
        } else {
            this.removeAttribute('disabled');
        }
    }
    formResetCallback() {
        this.checked = false;
    }
    formStateRestoreCallback(state:string) {
        this.checked = state === "on";
    }
}

window.customElements.define(ToggleSwitch.elementName, ToggleSwitch)