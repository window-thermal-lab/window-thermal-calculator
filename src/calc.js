// window thermal calculator

const params = new URLSearchParams(window.location.search);
const clientId = params.get("client");

console.log("clientId =", clientId);

if( clientId != null )
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
