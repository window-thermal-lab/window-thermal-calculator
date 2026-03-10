// window thermal calculator

const params = new URLSearchParams(window.location.search);
const clientId = params.get("client") || "mm1001";

console.log("clientId =", clientId);

if( clientId != NULL )
{
fetch(`config/clients/${clientId}.json`)
  .then(r => r.json())
  .then(client => {
    console.log("client config =", client);
  });
}

fetch("config/common.json")
  .then(r => r.json())
  .then(common => {
    console.log("common config =", common);
  });
