const VERSION = "v1.7.8";
class JeomVersion extends HTMLElement {
  connectedCallback() {
    this.textContent = VERSION;
  }
}
customElements.define("jeom-version", JeomVersion);
