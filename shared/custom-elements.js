const VERSION = "v1.7.6";
class JeomVersion extends HTMLElement {
  connectedCallback() {
    this.textContent = VERSION;
  }
}
customElements.define("jeom-version", JeomVersion);
