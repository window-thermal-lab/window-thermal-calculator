// window thermal calculator

const params = new URLSearchParams(window.location.search);
const clientId = params.get("client");

console.log("clientId =", clientId);

if (clientId) {
  fetch(`config/clients/${clientId}.json`)
    .then(r => {
      if (!r.ok) return null;
      return r.json();
    })
    .then(client => {
      console.log("client config =", client);
    })
    .catch(() => {
      console.log("client config not found");
    });
}

fetch("config/common.json")
  .then(r => r.json())
  .then(common => {
    console.log("common config =", common);
  });
